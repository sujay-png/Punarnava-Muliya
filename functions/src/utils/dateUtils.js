const { TIMEZONE } = require("../config/constants");

/** Returns { day, monthKey, date } in IST, e.g. { day: 5, monthKey: "2026-07" }. */
function todayInIST() {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: TIMEZONE })
  );
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return { day: now.getDate(), monthKey, date: now };
}

/** Human friendly month label, e.g. "July 2026". */
function monthLabel(date) {
  return date.toLocaleString("en-IN", { month: "long", year: "numeric", timeZone: TIMEZONE });
}

module.exports = { todayInIST, monthLabel };
