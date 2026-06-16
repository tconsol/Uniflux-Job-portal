function seededRand(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// Starts at 20 on 2026-06-16, grows by 1–20 each day
export function getDailyUsers(): number {
  const start = new Date('2026-06-16').getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.max(0, Math.floor((today.getTime() - start) / 86400000));
  let total = 20;
  for (let i = 0; i <= days; i++) {
    total += Math.floor(seededRand(i) * 20) + 1;
  }
  return total;
}
