import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/database/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    return NextResponse.json({ session });
  } catch (error) {
    console.error("/api/auth/session error:", error);
    return NextResponse.json({ session: null });
  }
}
