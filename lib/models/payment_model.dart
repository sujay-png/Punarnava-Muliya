import 'package:cloud_firestore/cloud_firestore.dart';

int firestoreInt(dynamic value) {
  if (value is int) return value;
  if (value is num) return value.round();
  return 0;
}

class PaymentModel {
  final String id;
  final String tenantId;
  final String tenantName;
  final String roomNo;
  final String monthKey; // "2026-07" — matches Cloud Function key
  final int amount; // monthly rent due
  final int paidAmount; // collected so far this month
  final String status; // paid | partial | pending | overdue
  final DateTime? paidAt;
  final String? couponUsed; // EARLY10 — shop products only, if fully paid by 5th

  const PaymentModel({
    required this.id,
    required this.tenantId,
    required this.tenantName,
    required this.roomNo,
    required this.monthKey,
    required this.amount,
    this.paidAmount = 0,
    required this.status,
    this.paidAt,
    this.couponUsed,
  });

  int get remaining {
    final left = amount - paidAmount;
    if (left < 0) return 0;
    return left;
  }

  bool get isFullyPaid => remaining <= 0;

  factory PaymentModel.fromDoc(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>;
    final amount = firestoreInt(d['amount']);
    final status = (d['status'] ?? 'pending') as String;
    final storedPaid = d['paidAmount'];
    final paidAmount = storedPaid != null
        ? firestoreInt(storedPaid)
        : (status == 'paid' ? amount : 0);
    return PaymentModel(
      id: doc.id,
      tenantId: d['tenantId'] ?? '',
      tenantName: d['tenantName'] ?? '',
      roomNo: d['roomNo'] ?? '',
      monthKey: d['monthKey'] ?? '',
      amount: amount,
      paidAmount: paidAmount,
      status: status,
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
        'paidAmount': paidAmount,
        'status': status,
        'paidAt': paidAt == null ? null : Timestamp.fromDate(paidAt!),
        'couponUsed': couponUsed,
      };

  PaymentModel copyWith({
    String? id,
    String? tenantId,
    String? tenantName,
    String? roomNo,
    String? monthKey,
    int? amount,
    int? paidAmount,
    String? status,
    DateTime? paidAt,
    String? couponUsed,
  }) {
    return PaymentModel(
      id: id ?? this.id,
      tenantId: tenantId ?? this.tenantId,
      tenantName: tenantName ?? this.tenantName,
      roomNo: roomNo ?? this.roomNo,
      monthKey: monthKey ?? this.monthKey,
      amount: amount ?? this.amount,
      paidAmount: paidAmount ?? this.paidAmount,
      status: status ?? this.status,
      paidAt: paidAt ?? this.paidAt,
      couponUsed: couponUsed ?? this.couponUsed,
    );
  }
}
