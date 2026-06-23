import { describe, expect, it } from "vitest";
import { generateOrderRef } from "./reference";

describe("generateOrderRef", () => {
  it("matches SAVIA- followed by 4 unambiguous chars", () => {
    expect(generateOrderRef()).toMatch(/^SAVIA-[A-HJ-NP-Z2-9]{4}$/);
  });

  it("never uses ambiguous chars (0 O 1 I) in the suffix", () => {
    for (let i = 0; i < 1000; i++) {
      const suffix = generateOrderRef().split("-")[1]!;
      expect(suffix).not.toMatch(/[01OI]/);
    }
  });
});
