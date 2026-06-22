import { describe, expect, it, beforeEach } from "vitest";
import { useCart } from "./store";

const reset = () => useCart.setState({ items: [] });

describe("cart store", () => {
  beforeEach(reset);
  it("adds an item and increments qty on re-add", () => {
    useCart.getState().add({ slug: "calma", nombre: "Calma", precioCOP: 13900 });
    useCart.getState().add({ slug: "calma", nombre: "Calma", precioCOP: 13900 });
    const items = useCart.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]!.qty).toBe(2);
  });
  it("setQty removes when qty <= 0", () => {
    useCart.getState().add({ slug: "luz", nombre: "Luz", precioCOP: 21900 });
    useCart.getState().setQty("luz", 0);
    expect(useCart.getState().items).toHaveLength(0);
  });
  it("subtotal sums qty * price", () => {
    useCart.getState().add({ slug: "calma", nombre: "Calma", precioCOP: 13900 });
    useCart.getState().add({ slug: "luz", nombre: "Luz", precioCOP: 21900 });
    useCart.getState().setQty("calma", 2);
    expect(useCart.getState().subtotal()).toBe(2 * 13900 + 21900);
  });
});
