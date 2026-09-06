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
app.use(express.json({ limit: "1mb" }));

const PORT = Number(process.env.PORT || 8080);
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const DOCUMENT_WORKER_SECRET = process.env.DOCUMENT_WORKER_SECRET;
const STORAGE_BUCKET = process.env.STORAGE_BUCKET || "bmch-resources";

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY || !DOCUMENT_WORKER_SECRET) {
  throw new Error(
    "SUPABASE_URL, SUPABASE_SECRET_KEY and DOCUMENT_WORKER_SECRET must be configured.",
  );
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const ProcessSchema = z.object({
  resourceId: z.string().uuid(),
  versionId: z.string().uuid(),
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

function extensionForMime(mime: string | null, originalName: string | null) {
  const originalExtension = originalName ? extname(originalName).toLowerCase() : "";
  if ([".ppt", ".pptx", ".doc", ".docx"].includes(originalExtension)) {
    return originalExtension;
  }
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

async function uploadFile(path: string, localFile: string, contentType: string) {
  const bytes = await readFile(localFile);
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, bytes, {
    contentType,
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw new Error(`Storage upload failed for ${path}: ${error.message}`);
}

async function removePreviousPreviewAssets(versionId: string, previewPath: string | null) {
  const { data: pages } = await supabase
    .from("resource_pages")
    .select("image_path, thumbnail_path")
    .eq("resource_version_id", versionId);

  const paths = new Set<string>();
  if (previewPath) paths.add(previewPath);
  for (const page of pages || []) {
    if (page.image_path) paths.add(page.image_path);
    if (page.thumbnail_path) paths.add(page.thumbnail_path);
  }

  if (paths.size > 0) {
    await supabase.storage.from(STORAGE_BUCKET).remove([...paths]);
  }

  const { error } = await supabase
    .from("resource_pages")
    .delete()
    .eq("resource_version_id", versionId);
  if (error) throw new Error(`Could not clear old preview rows: ${error.message}`);
}

async function processVersion(resourceId: string, versionId: string) {
  const jobKey = `${resourceId}:${versionId}`;
  let workDir: string | null = null;

  try {
    const { data: version, error: versionError } = await supabase
      .from("resource_versions")
      .select(
        "id, resource_id, original_filename, mime_type, storage_path, preview_path, processing_status",
      )
      .eq("id", versionId)
      .eq("resource_id", resourceId)
      .single();

    if (versionError || !version) throw new Error("Resource version was not found.");
    if (!version.storage_path) throw new Error("Resource version has no stored original file.");
    if (!version.mime_type || !supportedMimeTypes.has(version.mime_type)) {
      throw new Error(`Unsupported office document type: ${version.mime_type || "unknown"}`);
    }

    await supabase
      .from("resource_versions")
      .update({ processing_status: "processing", processing_error: null })
      .eq("id", versionId);

    workDir = await mkdtemp(join(tmpdir(), "bmch-doc-"));
    const extension = extensionForMime(version.mime_type, version.original_filename);
    const inputPath = join(workDir, `original${extension}`);

    const { data: sourceBlob, error: downloadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(version.storage_path);
    if (downloadError || !sourceBlob) {
      throw new Error(`Could not download original file: ${downloadError?.message || "unknown error"}`);
    }

    await writeFile(inputPath, Buffer.from(await sourceBlob.arrayBuffer()));

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

    const fullPrefix = join(workDir, "slide");
    const thumbPrefix = join(workDir, "thumb");
    await run("pdftoppm", ["-png", "-r", "144", pdfPath, fullPrefix], { cwd: workDir });
    await run("pdftoppm", ["-png", "-scale-to", "360", pdfPath, thumbPrefix], { cwd: workDir });

    const { stdout: extractedText } = await run("pdftotext", ["-layout", pdfPath, "-"], {
      cwd: workDir,
    });
    const pageTexts = String(extractedText || "").split("\f");

    const generatedFiles = await readdir(workDir);
    const slideFiles = generatedFiles
      .filter((name) => /^slide-\d+\.png$/i.test(name))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const thumbFiles = generatedFiles
      .filter((name) => /^thumb-\d+\.png$/i.test(name))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    if (slideFiles.length === 0) throw new Error("No slide preview images were generated.");
    if (slideFiles.length !== thumbFiles.length) {
      throw new Error("Slide preview and thumbnail counts do not match.");
    }

    await removePreviousPreviewAssets(versionId, version.preview_path);

    const basePath = `resources/${resourceId}/${versionId}/preview`;
    const previewPdfPath = `${basePath}/preview.pdf`;
    await uploadFile(previewPdfPath, pdfPath, "application/pdf");

    const pageRows: Array<{
      resource_version_id: string;
      page_number: number;
      text_content: string | null;
      image_path: string;
      thumbnail_path: string;
      metadata: Record<string, unknown>;
    }> = [];

    for (let index = 0; index < slideFiles.length; index += 1) {
      const pageNumber = index + 1;
      const padded = String(pageNumber).padStart(4, "0");
      const imagePath = `${basePath}/slides/slide-${padded}.png`;
      const thumbnailPath = `${basePath}/thumbnails/slide-${padded}.png`;

      await Promise.all([
        uploadFile(imagePath, join(workDir, slideFiles[index]), "image/png"),
        uploadFile(thumbnailPath, join(workDir, thumbFiles[index]), "image/png"),
      ]);

      pageRows.push({
        resource_version_id: versionId,
        page_number: pageNumber,
        text_content: pageTexts[index]?.trim() || null,
        image_path: imagePath,
        thumbnail_path: thumbnailPath,
        metadata: {
          processor: "bmch-document-worker",
          source_filename: basename(version.original_filename || "uploaded document"),
        },
      });
    }

    const { error: insertError } = await supabase.from("resource_pages").insert(pageRows);
    if (insertError) throw new Error(`Could not save generated pages: ${insertError.message}`);

    const { error: readyError } = await supabase
      .from("resource_versions")
      .update({
        preview_path: previewPdfPath,
        processing_status: "ready",
        processing_error: null,
      })
      .eq("id", versionId);
    if (readyError) throw new Error(`Could not mark preview ready: ${readyError.message}`);

    console.info(
      JSON.stringify({ event: "document_processed", resourceId, versionId, pages: pageRows.length }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown document-processing failure";
    console.error(JSON.stringify({ event: "document_processing_failed", resourceId, versionId, message }));
    await supabase
      .from("resource_versions")
      .update({ processing_status: "failed", processing_error: message.slice(0, 2000) })
      .eq("id", versionId);
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

  const { resourceId, versionId } = parsed.data;
  const jobKey = `${resourceId}:${versionId}`;
  if (activeJobs.has(jobKey)) {
    res.status(202).json({ status: "already_processing", resourceId, versionId });
    return;
  }

  activeJobs.add(jobKey);
  setImmediate(() => void processVersion(resourceId, versionId));
  res.status(202).json({ status: "accepted", resourceId, versionId });
});

app.listen(PORT, () => {
  console.info(`BMCH document worker listening on port ${PORT}`);
});
