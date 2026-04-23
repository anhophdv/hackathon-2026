// Mulberry32 - tiny seeded PRNG so the demo is deterministic.
export function makeRng(seed: number) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickWeighted<T>(
  rand: () => number,
  items: { item: T; weight: number }[],
): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = rand() * total;
  for (const { item, weight } of items) {
    if ((r -= weight) <= 0) return item;
  }
  return items[items.length - 1].item;
}

export function randInt(rand: () => number, min: number, max: number) {
  return Math.floor(rand() * (max - min + 1)) + min;
}

export function gauss(rand: () => number, mean = 0, sd = 1) {
  // Box-Muller
  const u = Math.max(rand(), 1e-9);
  const v = Math.max(rand(), 1e-9);
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return z * sd + mean;
}
