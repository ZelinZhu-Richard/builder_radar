import { NextRequest, NextResponse } from "next/server";
import { assertIntakeAdmin } from "@/lib/intake/api-auth";
import { getIntakeErrorResponse, parseBooleanParam } from "@/lib/intake/http";
import {
  createTrustedAccount,
  listTrustedAccounts,
} from "@/lib/intake/trusted-accounts";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import type { SignalLane, SourceKind, TrustTier } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface TrustedAccountRequestBody {
  handle: string;
  externalAccountId?: string | null;
  displayName?: string | null;
  profileUrl?: string | null;
  sourceKind: SourceKind;
  trustTier: TrustTier;
  laneHints: SignalLane[];
  topicTags?: string[];
  ingestPriority?: number;
  isActive?: boolean;
  notes?: string | null;
}

export async function GET(request: NextRequest) {
  try {
    assertIntakeAdmin(request);

    const includeInactive =
      parseBooleanParam(request.nextUrl.searchParams.get("includeInactive")) ??
      true;

    const accounts = await listTrustedAccounts(getSupabaseAdminClient(), {
      includeInactive,
    });

    return NextResponse.json({ ok: true, accounts });
  } catch (error) {
    return getIntakeErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertIntakeAdmin(request);

    const body = (await request.json()) as TrustedAccountRequestBody;
    const account = await createTrustedAccount(getSupabaseAdminClient(), body);

    return NextResponse.json({ ok: true, account }, { status: 201 });
  } catch (error) {
    return getIntakeErrorResponse(error);
  }
}
