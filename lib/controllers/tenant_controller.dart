import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/tenant_model.dart';
import '../services/firestore_service.dart';

class TenantController extends ChangeNotifier {
  final FirestoreService _service = FirestoreService();
  StreamSubscription? _sub;

  List<TenantModel> _tenants = [];
  String _search = '';
  bool _loading = true;

  List<TenantModel> get tenants => _search.isEmpty
      ? _tenants
      : _tenants
          .where((t) =>
              t.name.toLowerCase().contains(_search) ||
              t.roomNo.toLowerCase().contains(_search))
          .toList();
  bool get loading => _loading;
  int get activeCount => _tenants.where((t) => t.status != 'vacated').length;

  TenantController() {
    _sub = _service.watchTenants().listen((list) {
      _tenants = list;
      _loading = false;
      notifyListeners();
    });
  }

  void search(String query) {
    _search = query.toLowerCase();
    notifyListeners();
  }

  Future<void> addTenant(TenantModel tenant) => _service.addTenant(tenant);

  Future<void> setStatus(String tenantId, String status) =>
      _service.updateTenantStatus(tenantId, status);

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}
