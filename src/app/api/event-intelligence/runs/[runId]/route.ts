import { NextRequest, NextResponse } from "next/server";
import { assertAdminAccess } from "@/lib/intake/api-auth";
import { getEventIntelligenceErrorResponse } from "@/lib/event-intelligence/http";
import { getEventIntelligenceRunDetails } from "@/lib/event-intelligence/persist";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  try {
    assertAdminAccess(request);

    const { runId } = await params;
    const details = await getEventIntelligenceRunDetails(
      getSupabaseAdminClient(),
      runId,
    );

    if (!details.run) {
      return NextResponse.json(
        { ok: false, error: "Event intelligence run not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, ...details });
  } catch (error) {
    return getEventIntelligenceErrorResponse(error);
  }
}
