import { NextResponse, type NextRequest } from "next/server";
import { allyIdFromRequest } from "@/lib/allyAuth";
import { getAllyById, ownAlly } from "@/lib/allies";
export async function GET(request: NextRequest) {
  const id = allyIdFromRequest(request);
  if (!id) return NextResponse.json({ authenticated: false });
  const ally = await getAllyById(id);
  if (!ally || ally.status !== "approved")
    return NextResponse.json({ authenticated: false });
  return NextResponse.json({ authenticated: true, ally: ownAlly(ally) });
}
