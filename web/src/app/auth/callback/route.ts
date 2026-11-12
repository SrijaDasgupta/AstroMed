import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Where the confirmation email link lands: turns the one-time code into a login session.
 *
 * Supabase confirms the email before it sends people here, so a code that can't be exchanged
 * (link opened in another browser or the mail app, or already opened by an email scanner)
 * still means the email is confirmed: ask them to sign in rather than showing an error.
 * Supabase adds error parameters instead of a code when the link itself was expired or invalid.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (!isSupabaseConfigured || searchParams.get("error") || !code) {
    return NextResponse.redirect(`${origin}/login?error=confirm`);
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (!error) return NextResponse.redirect(`${origin}/start`);
  const { data } = await supabase.auth.getUser();
  if (data.user) return NextResponse.redirect(`${origin}/start`);
  return NextResponse.redirect(`${origin}/login?confirmed=1`);
}
