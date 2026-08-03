import 'package:cloud_firestore/cloud_firestore.dart';

class TenantModel {
  final String id;
  final String name;
  final String roomNo;
  final String phone; 
  final DateTime joinDate;
  final int monthlyRent;
  final String idProofType;
  final String idNumber;
  final String emergencyContact;
  final String status;
  final String? photourl; // active | notice | vacated

  // ---- additional fields captured on the application form ----
  final String? email;
  final DateTime? dob;
  final int? age;
  final String? permanentAddress;
  final String? nationality;
  final String? fatherName;
  final String? fatherPhone;
  final String? motherName;
  final String? motherPhone;
  final String? guardianName;
  final String? guardianPhone;
  final String? maritalStatus;
  final String? companyName;
  final String? companyAddress;
  final String? companyPhone;
  final String? occupationStatus; // Student | Working Professional | Business Owner
  final String? appointmentLetterRef;
  final String? expectedStay;
  final String? vehicleModel;
  final String? vehicleNumber;
  final String? bloodGroup;
  final String? healthCondition;
  final String? signature;
  final DateTime? declarationDate;
  // final String? photourl;

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
    this.email,
    this.dob,
    this.age,
    this.permanentAddress,
    this.nationality,
    this.fatherName,
    this.fatherPhone,
    this.motherName,
    this.motherPhone,
    this.guardianName,
    this.guardianPhone,
    this.maritalStatus,
    this.companyName,
    this.companyAddress,
    this.companyPhone,
    this.occupationStatus,
    this.appointmentLetterRef,
    this.expectedStay,
    this.vehicleModel,
    this.vehicleNumber,
    this.bloodGroup,
    this.healthCondition,
    this.signature,
    this.declarationDate,
    this.photourl,
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
      email: d['email'],
      dob: (d['dob'] as Timestamp?)?.toDate(),
      age: d['age'] as int?,
      permanentAddress: d['permanentAddress'],
      nationality: d['nationality'],
      fatherName: d['fatherName'],
      fatherPhone: d['fatherPhone'],
      motherName: d['motherName'],
      motherPhone: d['motherPhone'],
      guardianName: d['guardianName'],
      guardianPhone: d['guardianPhone'],
      maritalStatus: d['maritalStatus'],
      companyName: d['companyName'],
      companyAddress: d['companyAddress'],
      companyPhone: d['companyPhone'],
      occupationStatus: d['occupationStatus'],
      appointmentLetterRef: d['appointmentLetterRef'],
      expectedStay: d['expectedStay'],
      vehicleModel: d['vehicleModel'],
      vehicleNumber: d['vehicleNumber'],
      bloodGroup: d['bloodGroup'],
      healthCondition: d['healthCondition'],
      signature: d['signature'],
      declarationDate: (d['declarationDate'] as Timestamp?)?.toDate(),
      photourl: d['photoUrl'],
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
        'email': email,
        'dob': dob != null ? Timestamp.fromDate(dob!) : null,
        'age': age,
        'permanentAddress': permanentAddress,
        'nationality': nationality,
        'fatherName': fatherName,
        'fatherPhone': fatherPhone,
        'motherName': motherName,
        'motherPhone': motherPhone,
        'guardianName': guardianName,
        'guardianPhone': guardianPhone,
        'maritalStatus': maritalStatus,
        'companyName': companyName,
        'companyAddress': companyAddress,
        'companyPhone': companyPhone,
        'occupationStatus': occupationStatus,
        'appointmentLetterRef': appointmentLetterRef,
        'expectedStay': expectedStay,
        'vehicleModel': vehicleModel,
        'vehicleNumber': vehicleNumber,
        'bloodGroup': bloodGroup,
        'healthCondition': healthCondition,
        'signature': signature,
         'photoUrl': photourl,
        'declarationDate': declarationDate != null
            ? Timestamp.fromDate(declarationDate!)
            : null,
        'createdAt': FieldValue.serverTimestamp(),
      };
}