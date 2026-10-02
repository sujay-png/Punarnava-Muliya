import { describe, it, expect } from 'vitest';
import { calculateStayDuration } from '../stay.logic';

describe('Stay Logic - calculateStayDuration', () => {
  it('calculates days only', () => {
    expect(calculateStayDuration(new Date("2026-01-01"), new Date("2026-01-15"))).toBe("14 days");
  });

  it('calculates exact months', () => {
    expect(calculateStayDuration(new Date("2026-01-01"), new Date("2026-03-01"))).toBe("2 months");
  });

  it('calculates months and days (leap year)', () => {
    expect(calculateStayDuration(new Date("2024-02-01"), new Date("2024-03-10"))).toBe("1 month, 9 days");
  });
});
