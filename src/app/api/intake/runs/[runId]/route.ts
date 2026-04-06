import { NextRequest, NextResponse } from "next/server";
import { assertIntakeAdmin } from "@/lib/intake/api-auth";
import { getIntakeErrorResponse } from "@/lib/intake/http";
import { getIntakeRunDetails } from "@/lib/intake/persist";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  try {
    assertIntakeAdmin(request);

    const { runId } = await params;
    const details = await getIntakeRunDetails(getSupabaseAdminClient(), runId);

    if (!details.run) {
      return NextResponse.json(
        { ok: false, error: "Intake run not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, ...details });
  } catch (error) {
    return getIntakeErrorResponse(error);
  }
}
