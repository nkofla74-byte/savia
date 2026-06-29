import { describe, expect, it } from "vitest";
import { products, getProduct, USES } from "./products";

describe("products catalog", () => {
  it("has 15 products with unique slugs", () => {
    expect(products).toHaveLength(15);
    const slugs = new Set(products.map((p) => p.slug));
    expect(slugs.size).toBe(15);
  });
  it("prices are positive integers in COP", () => {
    for (const p of products) {
      expect(Number.isInteger(p.precioCOP)).toBe(true);
      expect(p.precioCOP).toBeGreaterThan(0);
      for (const pres of p.presentaciones ?? []) {
        expect(Number.isInteger(pres.precioCOP)).toBe(true);
        expect(pres.precioCOP).toBeGreaterThan(0);
        expect(pres.ml).toBeGreaterThan(0);
      }
    }
  });
  it("every product use is a known use", () => {
    for (const p of products) for (const u of p.usos) expect(USES).toContain(u);
  });
  it("getProduct returns by slug or undefined", () => {
    expect(getProduct("calma")?.nombre).toBe("Calma");
    expect(getProduct("nope")).toBeUndefined();
  });
  it("has at least one featured product", () => {
    expect(products.some((p) => p.destacado)).toBe(true);
  });
});
