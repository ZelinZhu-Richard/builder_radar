import { NextRequest, NextResponse } from "next/server";
import { assertIntakeAdmin } from "@/lib/intake/api-auth";
import { getIntakeErrorResponse, parsePositiveIntParam } from "@/lib/intake/http";
import { listRecentIntakeRuns } from "@/lib/intake/persist";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    assertIntakeAdmin(request);

    const limit = parsePositiveIntParam(
      request.nextUrl.searchParams.get("limit"),
      {
        defaultValue: 20,
        maxValue: 50,
        field: "limit",
      },
    );

    const runs = await listRecentIntakeRuns(getSupabaseAdminClient(), limit);

    return NextResponse.json({ ok: true, runs });
  } catch (error) {
    return getIntakeErrorResponse(error);
  }
}
