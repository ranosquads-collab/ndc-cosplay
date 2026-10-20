import { describe, expect, it } from "vitest";
import { computePrice } from "@/lib/pricing";
import { phoneKey } from "@/lib/types";

describe("Régressions critiques", () => {
  it("applique le supplément urgent uniquement quand le produit le permet", () => {
    const product = {
      base_price: 50000,
      weapon_price: null,
      accessories_price: null,
      weapon_only_price: null,
      accessories_only_price: null,
      urgent_days: 4,
    };
    expect(
      computePrice(
        product,
        {
          mode: "cosplay",
          withWeapon: true,
          withAccessories: true,
          urgent: true,
        },
        10,
      ),
    ).toBe(55000);
    expect(
      computePrice(
        { ...product, urgent_days: null },
        {
          mode: "cosplay",
          withWeapon: false,
          withAccessories: false,
          urgent: true,
        },
        10,
      ),
    ).toBe(50000);
  });

  it("ne considère pas deux formats de téléphone différents comme deux numéros", () => {
    expect(phoneKey("77 123 45 67")).toBe(phoneKey("+221771234567"));
  });
});
