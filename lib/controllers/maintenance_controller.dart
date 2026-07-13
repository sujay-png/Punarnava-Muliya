import 'dart:async';
import 'package:flutter/foundation.dart';
import '../core/constants/app_constants.dart';
import '../models/maintenance_model.dart';
import '../services/firestore_service.dart';

class MaintenanceController extends ChangeNotifier {
  final FirestoreService _service = FirestoreService();
  StreamSubscription? _sub;

  List<MaintenanceModel> _all = [];
  String filter = 'all';
  bool _loading = true;

  bool get loading => _loading;
  List<MaintenanceModel> get requests =>
      filter == 'all' ? _all : _all.where((r) => r.status == filter).toList();

  int count(String status) => _all.where((r) => r.status == status).length;
  int get openCount =>
      count(MaintenanceStatus.open) + count(MaintenanceStatus.inProgress);

  MaintenanceController() {
    _sub = _service.watchMaintenance().listen((list) {
      _all = list;
      _loading = false;
      notifyListeners();
    });
  }

  void setFilter(String f) {
    filter = f;
    notifyListeners();
  }

  Future<void> add(MaintenanceModel request) => _service.addMaintenance(request);

  Future<void> setStatus(String id, String status) =>
      _service.updateMaintenanceStatus(id, status);

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}
