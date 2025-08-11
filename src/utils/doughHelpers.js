export const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
export const round1 = (n) => Math.round(n * 10) / 10;
export const gPct = (base, pct) => base * (pct / 100);

export function calcStarter(flourTotal, starterPct) {
  const starterWeight = (starterPct / 100) * flourTotal;
  return {
    weight: round1(starterWeight),
    flour: round1(starterWeight / 2),
    water: round1(starterWeight / 2),
  };
}
