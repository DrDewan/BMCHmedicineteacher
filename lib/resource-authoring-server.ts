import { createClient } from "@/lib/supabase/server";

export class AuthoringHttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function requireAuthoringContext() {
  const supabase = await createClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (claimsError || !userId) throw new AuthoringHttpError(401, "Unauthorised");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, is_active")
    .eq("id", userId)
    .single();

  if (!profile?.is_active || (profile.role !== "admin" && profile.role !== "editor")) {
    throw new AuthoringHttpError(403, "Forbidden");
  }

  return {
    supabase,
    userId,
    role: profile.role as "admin" | "editor",
  };
}

export async function recordResourceAudit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  action: string,
  resourceId: string,
  metadata: Record<string, unknown> = {},
) {
  const { error } = await supabase.rpc("record_audit_event", {
    p_action: action,
    p_entity_type: "resource",
    p_entity_id: resourceId,
    p_metadata: metadata,
  });
  if (error) throw new AuthoringHttpError(500, "Audit logging failed");
}
