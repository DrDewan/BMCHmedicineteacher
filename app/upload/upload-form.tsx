"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type CategoryOption = {
  id: string;
  slug: string;
  name: string;
};

type UploadFormProps = {
  categories: CategoryOption[];
  initialCategory?: string;
};

const MAX_FILE_SIZE = 100 * 1024 * 1024;

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: "application/pdf",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

const OFFICE_MIME_TYPES = new Set([
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const TYPE_BY_CATEGORY: Record<string, string> = {
  "clinical-cases": "case",
  "teaching-materials": "pdf",
  "clinical-images": "image",
  "x-rays": "xray",
  ecg: "ecg",
  investigations: "investigation",
  procedures: "procedure",
  "question-bank": "pdf",
  guidelines: "pdf",
};

function inferMimeType(file: File) {
  if (file.type && Object.values(MIME_BY_EXTENSION).includes(file.type)) {
    return file.type;
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXTENSION[extension] ?? "";
}

function inferGenericResourceType(mimeType: string, selectedType: string) {
  if (!["pdf", "pptx", "docx", "other"].includes(selectedType)) return selectedType;
  if (mimeType === "application/pdf") return "pdf";
  if (
    mimeType === "application/vnd.ms-powerpoint" ||
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return "pptx";
  }
  if (
    mimeType === "application/msword" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }
  if (mimeType.startsWith("image/")) return "image";
  return selectedType;
}

function sanitizeFileName(name: string) {
  const trimmed = name.trim().replace(/\s+/g, "-");
  const safe = trimmed.replace(/[^a-zA-Z0-9._-]/g, "");
  return safe || "resource-file";
}

export function UploadForm({ categories, initialCategory }: UploadFormProps) {
  const router = useRouter();
  const initial = useMemo(
    () => categories.find((category) => category.slug === initialCategory) ?? categories[0],
    [categories, initialCategory],
  );

  const [categoryId, setCategoryId] = useState(initial?.id ?? "");
  const [resourceType, setResourceType] = useState(
    initial ? TYPE_BY_CATEGORY[initial.slug] ?? "other" : "other",
  );
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function handleCategoryChange(nextId: string) {
    setCategoryId(nextId);
    const category = categories.find((item) => item.id === nextId);
    if (category) {
      setResourceType(TYPE_BY_CATEGORY[category.slug] ?? "other");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setUploading(true);

    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const visibility = String(form.get("visibility") ?? "registrars");
    const file = form.get("file");

    try {
      if (!title) throw new Error("Add a title.");
      if (!categoryId) throw new Error("Choose a category.");
      if (!(file instanceof File) || file.size === 0) throw new Error("Choose a file to upload.");
      if (file.size > MAX_FILE_SIZE) throw new Error("File size must be 100 MB or less.");

      const mimeType = inferMimeType(file);
      if (!mimeType) {
        throw new Error("Unsupported file type. Use PDF, PowerPoint, Word, JPG, PNG, WebP or GIF.");
      }

      const finalResourceType = inferGenericResourceType(mimeType, resourceType);
      const supabase = createClient();
      const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
      const userId = claimsData?.claims?.sub;
      if (claimsError || !userId) throw new Error("Your session could not be verified. Sign in again.");

      const resourceId = crypto.randomUUID();
      const versionId = crypto.randomUUID();
      const storagePath = `resources/${resourceId}/${versionId}/${sanitizeFileName(file.name)}`;

      const { error: uploadError } = await supabase.storage
        .from("bmch-resources")
        .upload(storagePath, file, {
          cacheControl: "3600",
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message || "File upload failed.");
      }

      const processingStatus = OFFICE_MIME_TYPES.has(mimeType) ? "pending" : "not_required";
      const { error: metadataError } = await supabase.rpc("create_resource_with_version", {
        p_resource_id: resourceId,
        p_version_id: versionId,
        p_title: title,
        p_description: description,
        p_category_id: categoryId,
        p_resource_type: finalResourceType,
        p_visibility: visibility,
        p_original_filename: file.name,
        p_mime_type: mimeType,
        p_file_size: file.size,
        p_storage_path: storagePath,
        p_processing_status: processingStatus,
      });

      if (metadataError) {
        await supabase.storage.from("bmch-resources").remove([storagePath]);
        throw new Error(metadataError.message || "Resource metadata could not be saved.");
      }

      router.push(`/resources/${resourceId}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          Title
          <input
            name="title"
            required
            className="mt-2 w-full rounded-xl border border-[var(--line)] px-3.5 py-3 font-normal outline-none focus:border-[var(--accent)]"
            placeholder="e.g. Acute pulmonary oedema teaching deck"
          />
        </label>

        <label className="text-sm font-semibold">
          Category
          <select
            name="category"
            value={categoryId}
            onChange={(event) => handleCategoryChange(event.target.value)}
            className="mt-2 w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-3 font-normal outline-none focus:border-[var(--accent)]"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-sm font-semibold">
        Description
        <textarea
          name="description"
          rows={3}
          className="mt-2 w-full resize-y rounded-xl border border-[var(--line)] px-3.5 py-3 font-normal outline-none focus:border-[var(--accent)]"
          placeholder="What this resource teaches and when to use it."
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          Resource type
          <select
            name="resourceType"
            value={resourceType}
            onChange={(event) => setResourceType(event.target.value)}
            className="mt-2 w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-3 font-normal outline-none focus:border-[var(--accent)]"
          >
            <option value="pdf">PDF</option>
            <option value="pptx">PowerPoint</option>
            <option value="docx">Word document</option>
            <option value="image">Clinical image</option>
            <option value="case">Clinical case</option>
            <option value="ecg">ECG</option>
            <option value="xray">X-ray</option>
            <option value="investigation">Investigation</option>
            <option value="procedure">Procedure</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label className="text-sm font-semibold">
          Visibility
          <select
            name="visibility"
            defaultValue="registrars"
            className="mt-2 w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-3 font-normal outline-none focus:border-[var(--accent)]"
          >
            <option value="private">Private</option>
            <option value="registrars">Registrars</option>
            <option value="department">Department</option>
            <option value="students">Students</option>
          </select>
        </label>
      </div>

      <label className="block rounded-2xl border border-dashed border-[#c8d5d8] bg-[#f8fafb] p-5 text-sm font-semibold">
        File
        <input
          name="file"
          type="file"
          required
          accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png,.webp,.gif"
          className="mt-3 block w-full text-sm font-normal text-[var(--muted)] file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--accent)] file:px-3.5 file:py-2.5 file:font-semibold file:text-white"
        />
        <span className="mt-2 block text-xs font-normal text-[var(--muted)]">
          PDF, PowerPoint, Word or image · maximum 100 MB
        </span>
      </label>

      {message ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {message}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={uploading}
        className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {uploading ? "Uploading…" : "Upload resource"}
      </button>
    </form>
  );
}
