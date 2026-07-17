import 'package:cloud_firestore/cloud_firestore.dart';

class TenantModel {
  final String id;
  final String name;
  final String roomNo;
  final String phone; // 10-digit; country code added by Cloud Function
  final DateTime joinDate;
  final int monthlyRent;
  final String idProofType;
  final String idNumber;
  final String emergencyContact;
  final String status; // active | notice | vacated

  const TenantModel({
    required this.id,
    required this.name,
    required this.roomNo,
    required this.phone,
    required this.joinDate,
    required this.monthlyRent,
    required this.idProofType,
    required this.idNumber,
    required this.emergencyContact,
    required this.status,
  });

  factory TenantModel.fromDoc(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>;
    return TenantModel(
      id: doc.id,
      name: d['name'] ?? '',
      roomNo: d['roomNo'] ?? '',
      phone: d['phone'] ?? '',
      joinDate: (d['joinDate'] as Timestamp?)?.toDate() ?? DateTime.now(),
      monthlyRent: (d['monthlyRent'] ?? 0) as int,
      idProofType: d['idProofType'] ?? '',
      idNumber: d['idNumber'] ?? '',
      emergencyContact: d['emergencyContact'] ?? '',
      status: d['status'] ?? 'active',
    );
  }

  Map<String, dynamic> toMap() => {
        'name': name,
        'roomNo': roomNo,
        'phone': phone,
        'joinDate': Timestamp.fromDate(joinDate),
        'monthlyRent': monthlyRent,
        'idProofType': idProofType,
        'idNumber': idNumber,
        'emergencyContact': emergencyContact,
        'status': status,
        'createdAt': FieldValue.serverTimestamp(),
      };
}
