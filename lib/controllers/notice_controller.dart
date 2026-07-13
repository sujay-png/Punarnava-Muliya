import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/notice_model.dart';
import '../services/firestore_service.dart';

class NoticeController extends ChangeNotifier {
  final FirestoreService _service = FirestoreService();
  StreamSubscription? _sub;

  List<NoticeModel> _notices = [];
  bool _loading = true;
  bool _sending = false;

  List<NoticeModel> get notices => _notices;
  bool get loading => _loading;
  bool get sending => _sending;

  NoticeController() {
    _sub = _service.watchNotices().listen((list) {
      _notices = list;
      _loading = false;
      notifyListeners();
    });
  }

  /// Writes to Firestore; the onNoticeCreated Cloud Function does the
  /// WhatsApp broadcast to all tenants.
  Future<void> send(String title, String message) async {
    _sending = true;
    notifyListeners();
    try {
      await _service.sendNotice(NoticeModel(
        id: '',
        title: title,
        message: message,
        broadcastStatus: 'queued',
        recipientCount: 0,
        createdAt: DateTime.now(),
      ));
    } finally {
      _sending = false;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}
