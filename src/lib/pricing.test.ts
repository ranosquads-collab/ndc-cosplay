import { describe, expect, it } from "vitest";
import { computePrice } from "./pricing";

const p = {
  base_price: 35000,
  weapon_price: 8000,
  accessories_price: 7000,
  weapon_only_price: 12000,
  accessories_only_price: 10000,
  urgent_days: 7,
};
const base = { mode: "cosplay" as const, withWeapon: false, withAccessories: false, urgent: false };

describe("prix selon les options", () => {
  it("cosplay seul = prix de base", () => expect(computePrice(p, base, null)).toBe(35000));
  it("cosplay complet ajoute arme et accessoires", () =>
    expect(computePrice(p, { ...base, withWeapon: true, withAccessories: true }, null)).toBe(
      50000,
    ));
  it("armes + accessoires uniquement", () =>
    expect(computePrice(p, { ...base, mode: "armes_accessoires" }, null)).toBe(22000));
  it("urgence appliquée seulement si le supplément est renseigné", () => {
    expect(computePrice(p, { ...base, urgent: true }, null)).toBe(35000);
    expect(computePrice(p, { ...base, urgent: true }, 20)).toBe(42000);
  });
  it("prix absent → null (Prix sur demande)", () =>
    expect(computePrice({ ...p, base_price: null }, base, null)).toBeNull());
  it("arme demandée mais sans prix → ignorée", () =>
    expect(computePrice({ ...p, weapon_price: null }, { ...base, withWeapon: true }, null)).toBe(
      35000,
    ));
});
