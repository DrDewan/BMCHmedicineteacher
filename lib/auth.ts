import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ActiveProfile = {
  id: string;
  full_name: string | null;
  role: "admin" | "editor" | "viewer";
  department: string;
  is_active: true;
};

export async function requireActiveProfile(): Promise<ActiveProfile> {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, role, department, is_active")
    .eq("id", userId)
    .single();

  if (profileError || !profile?.is_active) {
    redirect("/pending");
  }

  return profile as ActiveProfile;
}
