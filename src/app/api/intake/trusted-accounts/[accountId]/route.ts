import { NextRequest, NextResponse } from "next/server";
import { assertIntakeAdmin } from "@/lib/intake/api-auth";
import { getIntakeErrorResponse } from "@/lib/intake/http";
import { updateTrustedAccount } from "@/lib/intake/trusted-accounts";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { SignalLane, SourceKind, TrustTier } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface TrustedAccountPatchBody {
  handle?: string;
  externalAccountId?: string | null;
  displayName?: string | null;
  profileUrl?: string | null;
  sourceKind?: SourceKind;
  trustTier?: TrustTier;
  laneHints?: SignalLane[];
  topicTags?: string[];
  ingestPriority?: number;
  isActive?: boolean;
  notes?: string | null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> },
) {
  try {
    assertIntakeAdmin(request);

    const { accountId } = await params;
    const body = (await request.json().catch(() => ({}))) as TrustedAccountPatchBody;
    const account = await updateTrustedAccount(
      getSupabaseAdminClient(),
      accountId,
      body,
    );

    if (!account) {
      return NextResponse.json(
        { ok: false, error: "Trusted account not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, account });
  } catch (error) {
    return getIntakeErrorResponse(error);
  }
}
