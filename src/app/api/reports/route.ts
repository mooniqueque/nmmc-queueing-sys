import { auth } from "@/lib/database/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getReportSnapshot } from "@/app/(dashboard)/reports/lib/report-data";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const snapshot = await getReportSnapshot({
    fromDate: searchParams.get("fromDate") ?? undefined,
    toDate: searchParams.get("toDate") ?? undefined,
    departmentId: searchParams.get("departmentId") ?? undefined,
    status: searchParams.get("status") ?? undefined,
  });

  return NextResponse.json(snapshot, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
