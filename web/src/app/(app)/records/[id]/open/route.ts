import { NextResponse, type NextRequest } from "next/server";
import { recordLink } from "@/lib/records-store";
import { getViewer } from "@/lib/session";

/** Opens a record through a short-lived signed link, after checking who is asking. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const viewer = await getViewer();
  if (!viewer) return NextResponse.redirect(new URL("/login", request.url));
  const url = await recordLink(viewer, (await params).id);
  if (!url) return NextResponse.redirect(new URL("/records?missing=1", request.url));
  return NextResponse.redirect(url);
}
