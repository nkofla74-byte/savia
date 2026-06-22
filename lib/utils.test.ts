import { describe, expect, it } from "vitest";
import { formatCOP } from "./utils";

describe("formatCOP", () => {
  it("formats integer COP with thousands dot and no decimals", () => {
    expect(formatCOP(13900)).toBe("$13.900");
    expect(formatCOP(21900)).toBe("$21.900");
    expect(formatCOP(0)).toBe("$0");
  });
});
