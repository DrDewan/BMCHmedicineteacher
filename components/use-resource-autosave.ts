"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type ResourceSaveStatus = "saved" | "saving" | "error" | "conflict";

type Options<T extends object> = {
  url: string;
  payload: T;
  initialUpdatedAt: string;
  delay?: number;
};

export function useResourceAutosave<T extends object>({ url, payload, initialUpdatedAt, delay = 850 }: Options<T>) {
  const serialised = useMemo(() => JSON.stringify(payload), [payload]);
  const lastSavedRef = useRef(serialised);
  const [status, setStatus] = useState<ResourceSaveStatus>("saved");
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (serialised === lastSavedRef.current) return;

    setStatus("saving");
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(url, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...payload, expectedUpdatedAt: updatedAt }),
        });

        if (response.status === 409) {
          setStatus("conflict");
          return;
        }
        if (!response.ok) throw new Error("Save failed");

        const result = (await response.json()) as { updatedAt: string };
        setUpdatedAt(result.updatedAt);
        lastSavedRef.current = serialised;
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [delay, payload, retryToken, serialised, updatedAt, url]);

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (status === "saved") return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [status]);

  const retry = useCallback(() => setRetryToken((value) => value + 1), []);
  const adoptUpdatedAt = useCallback((value: string) => setUpdatedAt(value), []);

  return { status, updatedAt, retry, adoptUpdatedAt };
}
