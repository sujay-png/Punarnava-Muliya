import { DepositDeduction } from "./deposit.schema";

/**
 * Calculates the net refundable amount from a deposit.
 */
export function calculateNetRefund(depositAmount: number, deductions: DepositDeduction[]): number {
  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const net = depositAmount - totalDeductions;
  return net > 0 ? net : 0;
}
