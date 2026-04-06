import type { RunIntakeOptions } from "./types";
import { runIntake } from "./run-intake";

export async function runWebIntake(
  options: Omit<RunIntakeOptions, "mode"> = {},
) {
  return runIntake({
    ...options,
    mode: "web",
  });
}
