import { NextRequest, NextResponse } from "next/server";
import { assertIntakeAdmin } from "@/lib/intake/api-auth";
import {
  getIntakeErrorResponse,
  parseBooleanParam,
  parsePlatformParam,
  parsePositiveIntParam,
  parseQuerySourceParam,
} from "@/lib/intake/http";
import { listInspectableRawItems } from "@/lib/intake/persist";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    assertIntakeAdmin(request);

    const searchParams = request.nextUrl.searchParams;
    const items = await listInspectableRawItems(getSupabaseAdminClient(), {
      limit: parsePositiveIntParam(searchParams.get("limit"), {
        defaultValue: 20,
        maxValue: 100,
        field: "limit",
      }),
      platform: parsePlatformParam(searchParams.get("platform")),
      trustedOnly: parseBooleanParam(searchParams.get("trustedOnly")),
      querySource: parseQuerySourceParam(searchParams.get("querySource")),
      recentHours:
        searchParams.get("recentHours") == null
          ? undefined
          : parsePositiveIntParam(searchParams.get("recentHours"), {
              defaultValue: 24,
              maxValue: 24 * 30,
              field: "recentHours",
            }),
    });

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    return getIntakeErrorResponse(error);
  }
}
