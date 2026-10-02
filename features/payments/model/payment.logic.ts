import { differenceInDays, isBefore, isAfter } from "date-fns";
import { Stay } from "../../stays/model/stay.schema";
import { Payment } from "./payment.schema";

/**
 * Calculates the payment status for a given stay and month.
 */
export function calculatePaymentStatus(stay: Stay, month: string /* YYYY-MM */, payments: Payment[]): "Paid" | "Pending" | "Overdue" | "Partial" | "Upcoming" | "N/A" {
  const [year, monthNum] = month.split("-").map(Number);
  const monthStart = new Date(year, monthNum - 1, 1);
  const monthEnd = new Date(year, monthNum, 0);
  
  const joinDate = stay.joinDate;
  if (isAfter(joinDate, monthEnd)) {
    return "N/A";
  }
  
  if (stay.vacateDate && isBefore(stay.vacateDate, monthStart)) {
    return "N/A";
  }

  const payment = payments.find(p => (p.month === month || p.monthKey === month) && (p.stayId === stay.id || p.tenantId === stay.tenantId));

  if (payment) {
    const s = (payment.status || "").toLowerCase();
    if (s === "paid") return "Paid";
    if (s === "partial") return "Partial";
    if (s === "overdue") return "Overdue";
    if (s === "pending") return "Pending";
  }

  const today = new Date();
  const billing10th = new Date(year, monthNum - 1, 10, 23, 59, 59);

  if (isAfter(today, billing10th)) {
    if (stay.vacateDate && isBefore(stay.vacateDate, billing10th)) {
      return "Pending"; 
    }
    return "Overdue";
  }

  // If we are before the month even starts, it's Upcoming
  if (isBefore(today, monthStart)) {
    return "Upcoming";
  }

  return "Pending";
}

/**
 * Calculates fine based on ₹100/day after the 10th of the month.
 * Stops accruing if vacated.
 */
export function calculateFine(month: string /* YYYY-MM */, currentDate: Date = new Date(), vacateDate?: Date | null): number {
  const [year, monthNum] = month.split("-").map(Number);
  const dueDate = new Date(year, monthNum - 1, 10);
  let endDate = currentDate;
  
  if (vacateDate && isBefore(vacateDate, currentDate)) {
    endDate = vacateDate;
  }

  if (isBefore(endDate, dueDate)) {
    return 0;
  }

  const diffDays = differenceInDays(endDate, dueDate);
  return diffDays > 0 ? diffDays * 100 : 0;
}
