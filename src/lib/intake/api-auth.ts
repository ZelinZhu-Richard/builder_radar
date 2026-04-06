import type { NextRequest } from "next/server";

export function assertIntakeAdmin(request: NextRequest) {
  const configuredKey = process.env.INTAKE_ADMIN_KEY;

  if (!configuredKey && process.env.NODE_ENV !== "production") {
    return;
  }

  if (!configuredKey) {
    throw new Error("INTAKE_ADMIN_KEY must be configured for protected intake routes.");
  }

  const headerKey = request.headers.get("x-intake-admin-key");
  const authorization = request.headers.get("authorization");
  const bearerKey = authorization?.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : null;
  const providedKey = headerKey ?? bearerKey;

  if (!providedKey || providedKey !== configuredKey) {
    const error = new Error("Unauthorized intake request.");
    error.name = "UnauthorizedError";
    throw error;
  }
}
