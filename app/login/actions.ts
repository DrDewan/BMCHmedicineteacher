"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(64)
    .regex(/^[a-z0-9._-]+$/),
  password: z.string().min(6),
  next: z.string().optional(),
});

function safeNextPath(value?: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

function usernameToInternalEmail(username: string) {
  return `${username}@bmch.internal`;
}

export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });

  const nextPath = safeNextPath(parsed.success ? parsed.data.next : undefined);

  if (!parsed.success) {
    redirect(`/login?error=${encodeURIComponent("Enter a valid username and password.")}`);
  }

  const supabase = await createClient();
  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email: usernameToInternalEmail(parsed.data.username),
    password: parsed.data.password,
  });

  if (error || !signInData.user?.id) {
    redirect(`/login?error=${encodeURIComponent("Invalid username or password.")}`);
  }

  // signInWithPassword already returns the verified authenticated user.
  // Re-running getClaims() here adds another auth round trip without adding
  // a meaningful security check. The profile activation check remains required.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("id", signInData.user.id)
    .single();

  if (!profile?.is_active) {
    redirect("/pending");
  }

  redirect(nextPath);
}
