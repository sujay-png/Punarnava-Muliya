import 'package:flutter_test/flutter_test.dart';
import 'package:pgmaster/models/payment_model.dart';

void main() {
  test('remaining rent is amount minus paidAmount', () {
    const p = PaymentModel(
      id: '1',
      tenantId: 't1',
      tenantName: 'Bhuvanesh',
      roomNo: 'A1',
      monthKey: '2026-09',
      amount: 3000,
      paidAmount: 1000,
      status: 'partial',
    );
    expect(p.remaining, 1000);
    expect(p.isFullyPaid, isFalse);
  });

  test('installment history keeps method and amount', () {
    const p = PaymentModel(
      id: '1',
      tenantId: 't1',
      tenantName: 'Bhuvanesh',
      roomNo: 'A1',
      monthKey: '2026-09',
      amount: 3000,
      paidAmount: 1500,
      status: 'partial',
      lastPaymentMethod: 'cash',
      installments: [
        PaymentInstallment(amount: 1000, method: 'upi'),
        PaymentInstallment(amount: 500, method: 'cash'),
      ],
    );
    expect(p.historyChronological.map((i) => i.method).toList(),
        ['upi', 'cash']);
    expect(p.lastPaymentMethod, 'cash');
  });

  test('legacy paid docs without paidAmount are treated as fully paid', () {
    const p = PaymentModel(
      id: '1',
      tenantId: 't1',
      tenantName: 'Lokesh',
      roomNo: 'B1',
      monthKey: '2026-09',
      amount: 3000,
      paidAmount: 3000,
      status: 'paid',
    );
    expect(p.remaining, 0);
    expect(p.isFullyPaid, isTrue);
  });
}
