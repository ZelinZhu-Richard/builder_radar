import { NextRequest, NextResponse } from "next/server";
import { assertAdminAccess } from "@/lib/intake/api-auth";
import {
  getEventIntelligenceErrorResponse,
  parseManualEventIntelligenceRequest,
} from "@/lib/event-intelligence/http";
import { runEventIntelligence } from "@/lib/event-intelligence/run-event-intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    assertAdminAccess(request);

    const body = await parseManualEventIntelligenceRequest(request);
    const result = await runEventIntelligence({
      triggerSource: body.triggerSource,
      runType: body.runType,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return getEventIntelligenceErrorResponse(error);
  }
}
