import { NextRequest, NextResponse } from "next/server";
import { assertAdminAccess } from "@/lib/intake/api-auth";
import { getEventIntelligenceErrorResponse } from "@/lib/event-intelligence/http";
import { getCanonicalEventDetails } from "@/lib/event-intelligence/persist";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  try {
    assertAdminAccess(request);

    const { eventId } = await params;
    const details = await getCanonicalEventDetails(getSupabaseAdminClient(), eventId);

    if (!details.event) {
      return NextResponse.json(
        { ok: false, error: "Canonical event not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, ...details });
  } catch (error) {
    return getEventIntelligenceErrorResponse(error);
  }
}
