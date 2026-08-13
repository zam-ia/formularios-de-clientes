import { NextResponse, type NextRequest } from "next/server";
import { clearAllyCookie, sameOrigin } from "@/lib/allyAuth";
export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Origen no permitido." },
      { status: 403 },
    );
  const response = NextResponse.json({ success: true });
  clearAllyCookie(response);
  return response;
}
