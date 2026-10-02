import { describe, it, expect } from 'vitest';
import { calculateNetRefund } from '../deposit.logic';

describe('Deposit Logic - calculateNetRefund', () => {
  it('calculates correct refund with no deductions', () => {
    expect(calculateNetRefund(5000, [])).toBe(5000);
  });

  it('calculates correct refund with deductions', () => {
    expect(calculateNetRefund(5000, [{ label: 'Damage', amount: 1000 }, { label: 'Unpaid rent', amount: 500 }])).toBe(3500);
  });

  it('does not return negative refund', () => {
    expect(calculateNetRefund(5000, [{ label: 'Major Damage', amount: 6000 }])).toBe(0);
  });
});
