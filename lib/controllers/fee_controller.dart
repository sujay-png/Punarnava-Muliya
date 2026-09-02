import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';
import '../core/constants/app_constants.dart';
import '../models/payment_model.dart';
import '../models/tenant_model.dart';
import '../services/firestore_service.dart';

class FeeController extends ChangeNotifier {
  final FirestoreService _service = FirestoreService();
  StreamSubscription? _sub;

  String monthKey = DateFormat('yyyy-MM').format(DateTime.now());
  List<PaymentModel> _payments = [];
  bool _loading = true;

  bool get loading => _loading;
  List<PaymentModel> get payments => _payments;

  int get collected => _payments.fold(0, (sum, p) => sum + p.paidAmount);

  FeeController() {
    _listen();
  }

  void _listen() {
    _sub?.cancel();
    _sub = _service.watchPayments(monthKey).listen((list) {
      _payments = list;
      _loading = false;
      notifyListeners();
    });
  }

  void changeMonth(String newMonthKey) {
    monthKey = newMonthKey;
    _loading = true;
    notifyListeners();
    _listen();
  }

  /// Merge tenants + this month's payment docs into one billing view.
  /// Tenants with no payment doc yet are 'pending' (or 'overdue' after the 15th).
  /// Rent due always comes from the tenant record so amounts stay at full rent.
  List<PaymentModel> billingRows(List<TenantModel> tenants) {
    final byTenant = {for (final p in _payments) p.tenantId: p};
    final overdueNow = DateTime.now().day > ReminderConfig.reminderDays.last;
    return tenants.where((t) => t.status != TenantStatus.vacated).map((t) {
      final existing = byTenant[t.id];
      final rent = t.monthlyRent;
      if (existing == null) {
        return PaymentModel(
          id: '',
          tenantId: t.id,
          tenantName: t.name,
          roomNo: t.roomNo,
          monthKey: monthKey,
          amount: rent,
          paidAmount: 0,
          status: overdueNow ? PaymentStatus.overdue : PaymentStatus.pending,
        );
      }
      final paid = existing.paidAmount > rent ? rent : existing.paidAmount;
      return existing.copyWith(
        tenantName: t.name,
        roomNo: t.roomNo,
        amount: rent,
        paidAmount: paid,
        status: _statusFor(rent, paid, overdueNow, existing.status),
      );
    }).toList();
  }

  String _statusFor(int rent, int paid, bool overdueNow, String stored) {
    if (paid >= rent && rent > 0) return PaymentStatus.paid;
    if (paid > 0) return PaymentStatus.partial;
    if (overdueNow) return PaymentStatus.overdue;
    return stored == PaymentStatus.overdue
        ? PaymentStatus.overdue
        : PaymentStatus.pending;
  }

  Future<void> markPaid(PaymentModel payment, String method) =>
      recordPayment(payment, payment.remaining, method);

  /// Record an installment. Completing rent on or before the 5th earns EARLY10
  /// for shop products (never applied to rent).
  Future<void> recordPayment(
    PaymentModel payment,
    int installment,
    String method,
  ) {
    final remaining = payment.remaining;
    final add = installment < 0
        ? 0
        : (installment > remaining ? remaining : installment);
    if (add <= 0) return Future.value();
    final newPaid = payment.paidAmount + add;
    final fullyPaid = newPaid >= payment.amount;
    final overdueNow = DateTime.now().day > ReminderConfig.reminderDays.last;
    final status = fullyPaid
        ? PaymentStatus.paid
        : (overdueNow ? PaymentStatus.overdue : PaymentStatus.partial);
    final coupon = fullyPaid &&
            DateTime.now().day <= ReminderConfig.earlyBirdLastDay
        ? ReminderConfig.earlyBirdCoupon
        : payment.couponUsed;
    return _service.recordPayment(
      payment.copyWith(
        paidAmount: newPaid,
        status: status,
        couponUsed: coupon,
        lastPaymentMethod: method,
      ),
      installmentAmount: add,
      method: method,
    );
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}
