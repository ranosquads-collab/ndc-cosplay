import { describe, expect, it } from "vitest";
import { computePrice, availableModes, type PriceableProduct } from "@/lib/pricing";
import { phoneKey } from "@/lib/types";

const product: PriceableProduct = {
  base_price: 40000,
  weapon_price: 5000,
  accessories_price: 3000,
  weapon_only_price: 12000,
  accessories_only_price: 8000,
  urgent_days: 5,
};

describe("Calculs de prix et validation de téléphone", () => {
  it("calcule le prix du cosplay et des options côté serveur", () => {
    expect(
      computePrice(
        product,
        {
          mode: "cosplay",
          withWeapon: true,
          withAccessories: true,
          urgent: false,
        },
        null,
      ),
    ).toBe(48000);
  });

  it("renvoie null lorsque le prix de base n'est pas renseigné", () => {
    expect(
      computePrice(
        { ...product, base_price: null },
        {
          mode: "cosplay",
          withWeapon: false,
          withAccessories: false,
          urgent: false,
        },
        null,
      ),
    ).toBeNull();
  });

  it("expose uniquement les formules tarifées", () => {
    expect(availableModes(product)).toEqual([
      "cosplay",
      "armes",
      "accessoires",
      "armes_accessoires",
    ]);
    expect(availableModes({ ...product, weapon_only_price: null })).not.toContain("armes");
  });

  it("normalise un téléphone sénégalais vers ses neuf derniers chiffres", () => {
    expect(phoneKey("+221 77 123 45 67")).toBe("771234567");
  });
});
