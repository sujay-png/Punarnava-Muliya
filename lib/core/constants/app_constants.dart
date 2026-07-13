/// Single source of truth for collection names & statuses.
/// Must stay in sync with functions/src/config/constants.js
class FirestoreCollections {
  static const tenants = 'tenants';
  static const payments = 'payments';
  static const notices = 'notices';
  static const maintenance = 'maintenance';
  static const products = 'products';
  static const messageLogs = 'message_logs';
}

class TenantStatus {
  static const active = 'active';
  static const notice = 'notice';
  static const vacated = 'vacated';
}

class PaymentStatus {
  static const paid = 'paid';
  static const pending = 'pending';
  static const overdue = 'overdue';
}

class MaintenanceStatus {
  static const open = 'open';
  static const inProgress = 'in_progress';
  static const resolved = 'resolved';
}

class ReminderConfig {
  static const reminderDays = [1, 3, 5, 7, 10, 15];
  static const earlyBirdCoupon = 'EARLY10';
}
