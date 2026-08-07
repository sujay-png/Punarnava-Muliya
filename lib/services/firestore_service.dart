import 'dart:typed_data';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_storage/firebase_storage.dart';
import '../core/constants/app_constants.dart';
import '../models/maintenance_model.dart';
import '../models/notice_model.dart';
import '../models/payment_model.dart';
import '../models/tenant_model.dart';

/// Single data-access layer. Controllers call this; views never touch Firestore.
class FirestoreService {
   final _storage = FirebaseStorage.instance;
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final FirebaseFunctions _functions =FirebaseFunctions.instanceFor(region: 'asia-south1');

  // ---------- Tenants ----------
  Stream<List<TenantModel>> watchTenants() => _db
      .collection(FirestoreCollections.tenants)
      .orderBy('roomNo')
      .snapshots()
      .map((s) => s.docs.map(TenantModel.fromDoc).toList());

 Future<void> addTenant(TenantModel tenant, {String? photoUrl}) {
  final data = tenant.toMap();
  if (photoUrl != null) {
    data['photoUrl'] = photoUrl;
  }
  return _db.collection(FirestoreCollections.tenants).add(data);
}



// Add this method to your FirestoreService class
Future<void> updateTenant(TenantModel tenant) async {
  await FirebaseFirestore.instance
      .collection('tenants')
      .doc(tenant.id)
      .update(tenant.toMap());
}

Future<void> deleteTenant(String tenantId) async {
  await FirebaseFirestore.instance
      .collection('tenants')
      .doc(tenantId)
      .delete();
}

  Future<void> updateTenantStatus(String tenantId, String status) => _db
      .collection(FirestoreCollections.tenants)
      .doc(tenantId)
      .update({'status': status});

  // ---------- Payments ----------
  Stream<List<PaymentModel>> watchPayments(String monthKey) => _db
      .collection(FirestoreCollections.payments)
      .where('monthKey', isEqualTo: monthKey)
      .snapshots()
      .map((s) => s.docs.map(PaymentModel.fromDoc).toList());

  /// Doc id `tenantId_monthKey` = one payment per tenant per month, no dupes.
  Future<void> markPaid(PaymentModel payment) => _db
      .collection(FirestoreCollections.payments)
      .doc('${payment.tenantId}_${payment.monthKey}')
      .set({
        ...payment.toMap(),
        'status': PaymentStatus.paid,
        'paidAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));

  // ---------- Maintenance ----------
  Stream<List<MaintenanceModel>> watchMaintenance() => _db
      .collection(FirestoreCollections.maintenance)
      .orderBy('createdAt', descending: true)
      .snapshots()
      .map((s) => s.docs.map(MaintenanceModel.fromDoc).toList());

  Future<void> addMaintenance(MaintenanceModel request) =>
      _db.collection(FirestoreCollections.maintenance).add(request.toMap());

  Future<void> updateMaintenanceStatus(String id, String status) => _db
      .collection(FirestoreCollections.maintenance)
      .doc(id)
      .update({'status': status});

  // ---------- Notices ----------
  Stream<List<NoticeModel>> watchNotices() => _db
      .collection(FirestoreCollections.notices)
      .orderBy('createdAt', descending: true)
      .snapshots()
      .map((s) => s.docs.map(NoticeModel.fromDoc).toList());

  /// Creating the doc is all it takes — the Cloud Function trigger
  /// broadcasts it to every tenant on WhatsApp.
  Future<void> sendNotice(NoticeModel notice) =>
      _db.collection(FirestoreCollections.notices).add(notice.toMap());

  // ---------- Product promo (callable Cloud Function) ----------
  Future<int> sendProductPromo({
    required String productName,
    required int price,
    String? offerText,
    String? orderLink,
  }) async {
    final result =
        await _functions.httpsCallable('sendProductPromo').call({
      'productName': productName,
      'price': price,
      'offerText': offerText,
      'orderLink': orderLink,
    });
    return (result.data['sentTo'] ?? 0) as int;
  }


  //upload tenant image
 Future<String> uploadTenantPhotoBytes(
  Uint8List bytes,
  String tenantIdOrTemp,
) async {
  final ref = _storage.ref().child('tenant_photos/$tenantIdOrTemp.jpg');
  final uploadTask = await ref.putData(
    bytes,
    SettableMetadata(contentType: 'image/jpeg'),
  );
  return await uploadTask.ref.getDownloadURL();
}
}
