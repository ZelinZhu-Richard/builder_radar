import { NextRequest, NextResponse } from "next/server";
import { assertIntakeAdmin } from "@/lib/intake/api-auth";
import { getIntakeErrorResponse, parseManualIntakeRequest } from "@/lib/intake/http";
import { runWebIntake } from "@/lib/intake/run-web-intake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    assertIntakeAdmin(request);
    const body = await parseManualIntakeRequest(request);

    const result = await runWebIntake({
      triggerSource: body.triggerSource ?? "api",
      useMockProvider: body.useMockProvider,
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return getIntakeErrorResponse(error);
  }
}
