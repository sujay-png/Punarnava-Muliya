import 'package:cloud_firestore/cloud_firestore.dart';

class MaintenanceModel {
  final String id;
  final String title;
  final String category; // Electrical | Plumbing | Furniture | Other
  final String priority; // high | medium | low
  final String status;   // open | in_progress | resolved
  final String roomNo;
  final String tenantName;
  final DateTime createdAt;

  const MaintenanceModel({
    required this.id,
    required this.title,
    required this.category,
    required this.priority,
    required this.status,
    required this.roomNo,
    required this.tenantName,
    required this.createdAt,
  });

  factory MaintenanceModel.fromDoc(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>;
    return MaintenanceModel(
      id: doc.id,
      title: d['title'] ?? '',
      category: d['category'] ?? 'Other',
      priority: d['priority'] ?? 'medium',
      status: d['status'] ?? 'open',
      roomNo: d['roomNo'] ?? '',
      tenantName: d['tenantName'] ?? '',
      createdAt: (d['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() => {
        'title': title,
        'category': category,
        'priority': priority,
        'status': status,
        'roomNo': roomNo,
        'tenantName': tenantName,
        'createdAt': FieldValue.serverTimestamp(),
      };
}
