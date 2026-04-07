import { NextRequest, NextResponse } from "next/server";
import { assertAdminAccess } from "@/lib/intake/api-auth";
import {
  getEventIntelligenceErrorResponse,
  parseEventManualOverrideRequest,
} from "@/lib/event-intelligence/http";
import { getEventIntelligenceConfig } from "@/lib/event-intelligence/config";
import { applyEventManualOverride } from "@/lib/event-intelligence/persist";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    assertAdminAccess(request);

    const body = await parseEventManualOverrideRequest(request);
    const config = getEventIntelligenceConfig();
    const result = await applyEventManualOverride(getSupabaseAdminClient(), {
      ...body,
      breakingWindowHours: config.breakingWindowHours,
    });

    return NextResponse.json({
      ok: true,
      actionType: body.actionType,
      affectedEventIds: result.affectedEventIds,
      override: result.override,
    });
  } catch (error) {
    return getEventIntelligenceErrorResponse(error);
  }
}
