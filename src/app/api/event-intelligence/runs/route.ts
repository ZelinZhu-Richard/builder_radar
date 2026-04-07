import { NextRequest, NextResponse } from "next/server";
import { assertAdminAccess } from "@/lib/intake/api-auth";
import {
  getEventIntelligenceErrorResponse,
  parseRunLimitParam,
} from "@/lib/event-intelligence/http";
import { listRecentEventIntelligenceRuns } from "@/lib/event-intelligence/persist";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    assertAdminAccess(request);

    const limit = parseRunLimitParam(request.nextUrl.searchParams.get("limit"));
    const runs = await listRecentEventIntelligenceRuns(getSupabaseAdminClient(), limit);

    return NextResponse.json({ ok: true, runs });
  } catch (error) {
    return getEventIntelligenceErrorResponse(error);
  }
}
