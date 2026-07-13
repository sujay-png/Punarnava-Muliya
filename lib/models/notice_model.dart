import 'package:cloud_firestore/cloud_firestore.dart';

class NoticeModel {
  final String id;
  final String title;
  final String message;
  final String broadcastStatus; // queued | sent | failed
  final int recipientCount;
  final DateTime createdAt;

  const NoticeModel({
    required this.id,
    required this.title,
    required this.message,
    required this.broadcastStatus,
    required this.recipientCount,
    required this.createdAt,
  });

  factory NoticeModel.fromDoc(DocumentSnapshot doc) {
    final d = doc.data() as Map<String, dynamic>;
    return NoticeModel(
      id: doc.id,
      title: d['title'] ?? '',
      message: d['message'] ?? '',
      broadcastStatus: d['broadcastStatus'] ?? 'queued',
      recipientCount: (d['recipientCount'] ?? 0) as int,
      createdAt: (d['createdAt'] as Timestamp?)?.toDate() ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() => {
        'title': title,
        'message': message,
        'broadcastStatus': 'queued',
        'createdAt': FieldValue.serverTimestamp(),
      };
}
