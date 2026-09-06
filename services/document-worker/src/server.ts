import express, { type NextFunction, type Request, type Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const app = express();
app.use(express.json({ limit: "2mb" }));

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be configured.`);
  return value;
}

const PORT = Number(process.env.PORT || 8080);
const SUPABASE_URL = requiredEnv("SUPABASE_URL");
const SUPABASE_PUBLISHABLE_KEY = requiredEnv("SUPABASE_PUBLISHABLE_KEY");
const DOCUMENT_WORKER_SECRET = requiredEnv("DOCUMENT_WORKER_SECRET");
const DOCUMENT_BRIDGE_URL = requiredEnv("DOCUMENT_BRIDGE_URL");
const STORAGE_BUCKET = process.env.STORAGE_BUCKET || "bmch-resources";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ProcessSchema = z.object({
  resourceId: z.string().uuid(),
  versionId: z.string().uuid(),
  originalUrl: z.string().url(),
  mimeType: z.string().min(1),
  originalFilename: z.string().nullable().optional(),
});

const supportedMimeTypes = new Set([
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const activeJobs = new Set<string>();

function requireWorkerSecret(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization") || "";
  if (header !== `Bearer ${DOCUMENT_WORKER_SECRET}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

function extensionForMime(mime: string, originalName?: string | null) {
  const originalExtension = originalName ? extname(originalName).toLowerCase() : "";
  if ([".ppt", ".pptx", ".doc", ".docx"].includes(originalExtension)) return originalExtension;
  if (mime === "application/vnd.ms-powerpoint") return ".ppt";
  if (mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation") return ".pptx";
  if (mime === "application/msword") return ".doc";
  if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return ".docx";
  return ".bin";
}

async function run(command: string, args: string[], options?: { cwd?: string; env?: NodeJS.ProcessEnv }) {
  return execFileAsync(command, args, {
    cwd: options?.cwd,
    env: options?.env,
    timeout: 180_000,
    maxBuffer: 64 * 1024 * 1024,
  });
}

async function callBridge<T>(payload: Record<string, unknown>): Promise<T> {
  const response = await fetch(DOCUMENT_BRIDGE_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-worker-secret": DOCUMENT_WORKER_SECRET,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(30_000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body?.error || `Bridge request failed with ${response.status}.`);
  return body as T;
}

async function uploadSigned(path: string, token: string, localFile: string, contentType: string) {
  const bytes = await readFile(localFile);
  const blob = new Blob([new Uint8Array(bytes)], { type: contentType });
  const { error } = await supabase.storage.from(STORAGE_BUCKET).uploadToSignedUrl(path, token, blob);
  if (error) throw new Error(`Signed upload failed for ${path}: ${error.message}`);
}

async function processVersion(input: z.infer<typeof ProcessSchema>) {
  const { resourceId, versionId, originalUrl, mimeType, originalFilename } = input;
  const jobKey = `${resourceId}:${versionId}`;
  let workDir: string | null = null;

  try {
    if (!supportedMimeTypes.has(mimeType)) throw new Error(`Unsupported office document type: ${mimeType}`);

    workDir = await mkdtemp(join(tmpdir(), "bmch-doc-"));
    const inputPath = join(workDir, `original${extensionForMime(mimeType, originalFilename)}`);

    const sourceResponse = await fetch(originalUrl, { signal: AbortSignal.timeout(120_000) });
    if (!sourceResponse.ok) throw new Error(`Could not download original file (${sourceResponse.status}).`);
    await writeFile(inputPath, Buffer.from(await sourceResponse.arrayBuffer()));

    const loProfile = join(workDir, "lo-profile");
    await run(
      "soffice",
      [
        "--headless",
        `-env:UserInstallation=file://${loProfile}`,
        "--convert-to",
        "pdf",
        "--outdir",
        workDir,
        inputPath,
      ],
      { cwd: workDir, env: { ...process.env, HOME: workDir } },
    );

    const filesAfterConversion = await readdir(workDir);
    const pdfFileName = filesAfterConversion.find((name) => name.toLowerCase().endsWith(".pdf"));
    if (!pdfFileName) throw new Error("LibreOffice did not produce a PDF preview.");
    const pdfPath = join(workDir, pdfFileName);

    await run("pdftoppm", ["-png", "-r", "144", pdfPath, join(workDir, "slide")], { cwd: workDir });
    await run("pdftoppm", ["-png", "-scale-to", "360", pdfPath, join(workDir, "thumb")], { cwd: workDir });
    const { stdout: extractedText } = await run("pdftotext", ["-layout", pdfPath, "-"], { cwd: workDir });
    const pageTexts = String(extractedText || "").split("\f");

    const generatedFiles = await readdir(workDir);
    const slideFiles = generatedFiles
      .filter((name) => /^slide-\d+\.png$/i.test(name))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const thumbFiles = generatedFiles
      .filter((name) => /^thumb-\d+\.png$/i.test(name))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    if (!slideFiles.length) throw new Error("No slide preview images were generated.");
    if (slideFiles.length !== thumbFiles.length) throw new Error("Slide preview and thumbnail counts do not match.");

    const basePath = `resources/${resourceId}/${versionId}/preview`;
    const previewPdfPath = `${basePath}/preview.pdf`;
    const fileSpecs: Array<{ path: string; localFile: string; contentType: string }> = [
      { path: previewPdfPath, localFile: pdfPath, contentType: "application/pdf" },
    ];
    const pageRows: Array<Record<string, unknown>> = [];

    for (let index = 0; index < slideFiles.length; index += 1) {
      const pageNumber = index + 1;
      const padded = String(pageNumber).padStart(4, "0");
      const imagePath = `${basePath}/slides/slide-${padded}.png`;
      const thumbnailPath = `${basePath}/thumbnails/slide-${padded}.png`;
      fileSpecs.push(
        { path: imagePath, localFile: join(workDir, slideFiles[index]), contentType: "image/png" },
        { path: thumbnailPath, localFile: join(workDir, thumbFiles[index]), contentType: "image/png" },
      );
      pageRows.push({
        page_number: pageNumber,
        text_content: pageTexts[index]?.trim() || null,
        image_path: imagePath,
        thumbnail_path: thumbnailPath,
        metadata: {
          processor: "bmch-document-worker",
          source_filename: basename(originalFilename || "uploaded document"),
        },
      });
    }

    const prepared = await callBridge<{ uploads: Array<{ path: string; token: string }> }>({
      action: "prepare",
      resourceId,
      versionId,
      files: fileSpecs.map(({ path, contentType }) => ({ path, contentType })),
    });
    const tokens = new Map(prepared.uploads.map((upload) => [upload.path, upload.token]));

    for (const file of fileSpecs) {
      const token = tokens.get(file.path);
      if (!token) throw new Error(`Bridge did not return an upload token for ${file.path}.`);
      await uploadSigned(file.path, token, file.localFile, file.contentType);
    }

    await callBridge({
      action: "complete",
      resourceId,
      versionId,
      previewPath: previewPdfPath,
      pages: pageRows,
    });

    console.info(JSON.stringify({ event: "document_processed", resourceId, versionId, pages: pageRows.length }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown document-processing failure";
    console.error(JSON.stringify({ event: "document_processing_failed", resourceId, versionId, message }));
    await callBridge({ action: "fail", resourceId, versionId, message }).catch(() => undefined);
  } finally {
    if (workDir) await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
    activeJobs.delete(jobKey);
  }
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "bmch-document-worker", activeJobs: activeJobs.size });
});

app.post("/process", requireWorkerSecret, (req, res) => {
  const parsed = ProcessSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  const jobKey = `${parsed.data.resourceId}:${parsed.data.versionId}`;
  if (activeJobs.has(jobKey)) {
    res.status(202).json({ status: "already_processing", resourceId: parsed.data.resourceId, versionId: parsed.data.versionId });
    return;
  }

  activeJobs.add(jobKey);
  setImmediate(() => void processVersion(parsed.data));
  res.status(202).json({ status: "accepted", resourceId: parsed.data.resourceId, versionId: parsed.data.versionId });
});

app.listen(PORT, () => {
  console.info(`BMCH document worker listening on port ${PORT}`);
});
