import { differenceInDays, differenceInMonths, isBefore } from "date-fns";

/**
 * Calculates total stay duration in a formatted string (e.g. "8 months, 12 days")
 */
export function calculateStayDuration(joinDate: Date, vacateDate?: Date | null): string {
  const end = vacateDate || new Date();
  
  if (isBefore(end, joinDate)) {
    return "0 days";
  }

  const totalDays = differenceInDays(end, joinDate);
  const months = differenceInMonths(end, joinDate);
  
  // Calculate remaining days after full months
  const tempDate = new Date(joinDate);
  tempDate.setMonth(tempDate.getMonth() + months);
  
  const days = differenceInDays(end, tempDate);
  
  if (months === 0) {
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  }
  
  if (days === 0) {
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  }
  
  return `${months} ${months === 1 ? 'month' : 'months'}, ${days} ${days === 1 ? 'day' : 'days'}`;
}
