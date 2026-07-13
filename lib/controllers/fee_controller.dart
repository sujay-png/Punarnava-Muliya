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

  int get collected => _payments
      .where((p) => p.status == PaymentStatus.paid)
      .fold(0, (sum, p) => sum + p.amount);

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
  List<PaymentModel> billingRows(List<TenantModel> tenants) {
    final byTenant = {for (final p in _payments) p.tenantId: p};
    final overdueNow = DateTime.now().day > ReminderConfig.reminderDays.last;
    return tenants
        .where((t) => t.status != TenantStatus.vacated)
        .map((t) =>
            byTenant[t.id] ??
            PaymentModel(
              id: '',
              tenantId: t.id,
              tenantName: t.name,
              roomNo: t.roomNo,
              monthKey: monthKey,
              amount: t.monthlyRent,
              status:
                  overdueNow ? PaymentStatus.overdue : PaymentStatus.pending,
            ))
        .toList();
  }

  Future<void> markPaid(PaymentModel payment) => _service.markPaid(payment);

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}
