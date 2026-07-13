import 'package:cloud_firestore/cloud_firestore.dart';

class PaymentModel {
  final String id;
  final String tenantId;
  final String tenantName;
  final String roomNo;
  final String monthKey; // "2026-07" — matches Cloud Function key
  final int amount;
  final String status;   // paid | pending | overdue
  final DateTime? paidAt;
  final String? couponUsed; // e.g. EARLY10

  const PaymentModel({
    required this.id,
    required this.tenantId,
    required this.tenantName,
    required this.roomNo,
    required this.monthKey,
    required this.amount,
    required this.status,
    this.paidAt,
    this.couponUsed,
  });

  factory PaymentModel.fromDoc(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>;
    return PaymentModel(
      id: doc.id,
      tenantId: d['tenantId'] ?? '',
      tenantName: d['tenantName'] ?? '',
      roomNo: d['roomNo'] ?? '',
      monthKey: d['monthKey'] ?? '',
      amount: (d['amount'] ?? 0) as int,
      status: d['status'] ?? 'pending',
      paidAt: (d['paidAt'] as Timestamp?)?.toDate(),
      couponUsed: d['couponUsed'],
    );
  }

  Map<String, dynamic> toMap() => {
        'tenantId': tenantId,
        'tenantName': tenantName,
        'roomNo': roomNo,
        'monthKey': monthKey,
        'amount': amount,
        'status': status,
        'paidAt': paidAt == null ? null : Timestamp.fromDate(paidAt!),
        'couponUsed': couponUsed,
      };
}
