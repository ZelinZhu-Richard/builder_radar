import type { RunIntakeOptions } from "./types";
import { runIntake } from "./run-intake";

export async function runXIntake(options: Omit<RunIntakeOptions, "mode"> = {}) {
  return runIntake({
    ...options,
    mode: "x",
  });
}
