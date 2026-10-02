import { describe, it, expect } from 'vitest';
import { calculatePaymentStatus, calculateFine } from '../payment.logic';
import { Stay } from '../../../stays/model/stay.schema';
import { Payment } from '../payment.schema';

describe('Payment Logic', () => {
  const mockStay: Stay = {
    id: "stay1",
    tenantId: "t1",
    roomNumber: "101",
    joinDate: new Date("2026-01-15"),
    monthlyRent: 10000,
    status: "Active",
  };

  describe('calculatePaymentStatus', () => {
    it('returns N/A before joinDate', () => {
      expect(calculatePaymentStatus(mockStay, "2025-12", [])).toBe("N/A");
    });

    it('returns Pending for current month before 10th', () => {
      expect(calculatePaymentStatus(mockStay, "2026-10", [])).toBe("Pending");
    });

    it('returns Overdue for past months with no payment', () => {
      expect(calculatePaymentStatus(mockStay, "2026-05", [])).toBe("Overdue");
    });

    it('returns Paid if payment exists and is Paid', () => {
      const payments: Payment[] = [{
        stayId: "stay1", tenantId: "t1", tenantName: "John", roomNo: "101", 
        month: "2026-05", amountPaid: 10000, rent: 10000, fine: 0, status: "Paid"
      }];
      expect(calculatePaymentStatus(mockStay, "2026-05", payments)).toBe("Paid");
    });
    
    it('returns N/A after vacateDate', () => {
      const vacatedStay = { ...mockStay, vacateDate: new Date("2026-03-05") };
      expect(calculatePaymentStatus(vacatedStay, "2026-04", [])).toBe("N/A");
    });
  });

  describe('calculateFine', () => {
    it('returns 0 before the 10th', () => {
      const current = new Date("2026-05-09");
      expect(calculateFine("2026-05", current)).toBe(0);
    });

    it('returns 100 on the 11th', () => {
      const current = new Date("2026-05-11");
      expect(calculateFine("2026-05", current)).toBe(100);
    });

    it('returns 500 on the 15th', () => {
      const current = new Date("2026-05-15");
      expect(calculateFine("2026-05", current)).toBe(500);
    });

    it('stops calculating fine after vacateDate', () => {
      const current = new Date("2026-05-20");
      const vacate = new Date("2026-05-13");
      expect(calculateFine("2026-05", current, vacate)).toBe(300);
    });
  });
});
