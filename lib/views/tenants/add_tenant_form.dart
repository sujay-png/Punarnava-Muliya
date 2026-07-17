import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../controllers/tenant_controller.dart';
import '../../models/tenant_model.dart';

class AddTenantView extends StatefulWidget {
  const AddTenantView({super.key});

  @override
  State<AddTenantView> createState() => _AddTenantViewState();
}

class _AddTenantViewState extends State<AddTenantView> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _address = TextEditingController();
  final _phone = TextEditingController();
  final _email = TextEditingController();
  final _dob = TextEditingController();
  final _age = TextEditingController();
  final _fatherName = TextEditingController();
  final _fatherPhone = TextEditingController();
  final _motherName = TextEditingController();
  final _motherPhone = TextEditingController();
  final _guardianName = TextEditingController();
  final _guardianPhone = TextEditingController();
  final _idNumber = TextEditingController();
  final _nationality = TextEditingController();
  final _maritalStatus = TextEditingController();
  final _companyName = TextEditingController();
  final _companyAddress = TextEditingController();
  final _companyPhone = TextEditingController();
  final _occupation = TextEditingController();
  final _appointmentLetter = TextEditingController();
  final _joinDateController = TextEditingController();
  final _expectedStay = TextEditingController();
  final _vehicleModel = TextEditingController();
  final _vehicleNumber = TextEditingController();
  final _bloodGroup = TextEditingController();
  final _healthCondition = TextEditingController();
  final _signature = TextEditingController();
  final _declarationDate = TextEditingController();
  final _roomNo = TextEditingController();
  final _monthlyRent = TextEditingController();
  Uint8List? _profilePhotoBytes;
  String? _gender;
  String? _idProofType;
  DateTime _joinDate = DateTime.now();
  bool _saving = false;

  // ---- shared style tokens for the dark theme ----
  static const _cardColor = Color(0xFF1B1E27);
  static const _borderColor = Color(0xFF30364A);
  static const _sectionTitleStyle = TextStyle(
    fontSize: 18,
    fontWeight: FontWeight.w700,
    color: Colors.white,
  );
  static const _sectionIconSize = 22.0;

  BoxDecoration get _cardDecoration => BoxDecoration(
        color: _cardColor,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: _borderColor),
        boxShadow: const [
          BoxShadow(
            color: Color(0x30000000),
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
      );

  Widget _sectionHeader(IconData icon, String title) {
    return Row(
      children: [
        Icon(icon, color: Colors.white, size: _sectionIconSize),
        const SizedBox(width: 10),
        Text(title, style: _sectionTitleStyle),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF12131A),
      appBar: AppBar(
        title: const Text('New Tenant'),
        backgroundColor: const Color(0xFF12131A),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Center(
              child: Text(
                'Paying guest application form',
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ),
            const SizedBox(height: 20),
            Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1500),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: _cardDecoration,
                  child: Column(
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child:
                                _sectionHeader(Icons.person, 'Basic Details'),
                          ),
                          _photoUpload(),
                        ],
                      ),
                      const SizedBox(height: 15),
                      Row(
                        children: [
                          Expanded(
                            child: _formField(
                              'Full name',
                              _name,
                              hintText: 'Enter full name',
                            ),
                          ),
                          const SizedBox(width: 15),
                          Expanded(
                            child: _formField(
                              'Phone',
                              _phone,
                              hintText: 'Phone (10-digit, WhatsApp number)',
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 15),
                      Row(
                        children: [
                          Expanded(
                            child: _formField(
                              'Email',
                              _email,
                              hintText: 'Enter email address',
                            ),
                          ),
                          const SizedBox(width: 15),
                          Expanded(
                              child:
                                  _dateField('Date Of Birth', _dob, context)),
                        ],
                      )
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 50),
            Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1500),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: _cardDecoration,
                  child: Column(
                    children: [
                      _sectionHeader(Icons.home, 'Residence Details'),
                      const SizedBox(height: 15),
                      Row(
                        children: [
                          Expanded(
                            child: _formField(
                              'Permanent Address',
                              _address,
                              hintText: 'street, city, state',
                              maxLines: 3,
                            ),
                          ),
                          const SizedBox(width: 15),
                          Expanded(
                            child: _formField(
                              'Nationality',
                              _nationality,
                              hintText: 'Eg American',
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 50),
            Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1500),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: _cardDecoration,
                  child: Column(
                    children: [
                      _sectionHeader(Icons.people, 'Personal Details'),
                      const SizedBox(height: 15),
                      Row(
                        children: [
                          Expanded(
                            child: _formField('Age', _age, hintText: ''),
                          ),
                          const SizedBox(width: 15),
                          Expanded(
                            child: _formField(
                              'Fathers Name',
                              _fatherName,
                              hintText: 'Name',
                            ),
                          ),
                          const SizedBox(width: 15),
                          Expanded(
                            child: _formField(
                              'Fathers ContactNo',
                              _fatherPhone,
                              hintText: 'Ph. no',
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 15),
                      Row(
                        children: [
                          const Expanded(child: SizedBox()),
                          const SizedBox(width: 15),
                          Expanded(
                            child: _formField(
                              'Mothers Name',
                              _motherName,
                              hintText: 'Name',
                            ),
                          ),
                          const SizedBox(width: 15),
                          Expanded(
                            child: _formField(
                              'Mothers ContactNo',
                              _motherPhone,
                              hintText: 'Ph. no',
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 15),
                      Row(
                        children: [
                          const Expanded(child: SizedBox()),
                          const SizedBox(width: 15),
                          Expanded(
                            child: _formField(
                              'Guardian Name',
                              _guardianName,
                              hintText: 'Name (Optional)',
                              required: false,
                            ),
                          ),
                          const SizedBox(width: 15),
                          Expanded(
                            child: _formField(
                              'Guardian ContactNo',
                              _guardianPhone,
                              hintText: 'Ph. no',
                              required: false,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 15),
                      Row(
                        children: [
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              initialValue: _idProofType,
                              style: const TextStyle(
                                  fontSize: 14, color: Colors.white),
                              dropdownColor: _cardColor,
                              decoration: InputDecoration(
                                labelText: 'ID Type',
                                labelStyle: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white70),
                                filled: true,
                                fillColor: const Color(0xFF22242F),
                                contentPadding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 12,
                                ),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  borderSide:
                                      const BorderSide(color: _borderColor),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  borderSide:
                                      const BorderSide(color: _borderColor),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  borderSide: const BorderSide(
                                      color: Color(0xFF3D6EF2), width: 1.4),
                                ),
                              ),
                              hint: const Text('Aadhaar / PAN / Other',
                                  style: TextStyle(
                                      fontSize: 13, color: Colors.white38)),
                              items: const [
                                DropdownMenuItem(
                                    value: 'Aadhaar', child: Text('Aadhaar')),
                                DropdownMenuItem(
                                    value: 'PAN', child: Text('PAN')),
                                DropdownMenuItem(
                                    value: 'Other', child: Text('Other')),
                              ],
                              onChanged: (v) =>
                                  setState(() => _idProofType = v),
                              validator: (v) => v == null ? 'Required' : null,
                            ),
                          ),
                          const SizedBox(width: 15),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _formField(
                                  'ID Number',
                                  _idNumber,
                                  hintText: 'Enter ID number',
                                ),
                                const SizedBox(height: 4),
                                const Text(
                                  'Attach photocopy separately',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: Colors.white54,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 50),
            Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1500),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: _cardDecoration,
                  child: Column(
                    children: [
                      _sectionHeader(Icons.work, 'Occupation & Status'),
                      const SizedBox(height: 15),
                      Row(
                        children: [
                          Expanded(
                            child: _formField(
                              'Company/institution Name',
                              _companyName,
                              hintText: 'Organization name',
                            ),
                          ),
                          const SizedBox(width: 15),
                          Expanded(
                            child: FormField<String>(
                              validator: (_) => _maritalStatus.text.isEmpty
                                  ? 'Required'
                                  : null,
                              builder: (field) {
                                return InputDecorator(
                                  decoration: InputDecoration(
                                    labelText: 'Marital status',
                                    labelStyle: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                      color: Colors.white70,
                                    ),
                                    errorText: field.errorText,
                                    filled: true,
                                    fillColor: const Color(0xFF22242F),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(8),
                                      borderSide:
                                          const BorderSide(color: _borderColor),
                                    ),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(8),
                                      borderSide:
                                          const BorderSide(color: _borderColor),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(8),
                                      borderSide: const BorderSide(
                                          color: Color(0xFF3D6EF2), width: 1.4),
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Radio<String>(
                                        value: 'Married',
                                        groupValue: _maritalStatus.text,
                                        onChanged: (value) {
                                          setState(() {
                                            _maritalStatus.text = value!;
                                            field.didChange(value);
                                          });
                                        },
                                      ),
                                      const Text('Married',
                                          style: TextStyle(
                                              fontSize: 13,
                                              color: Colors.white)),
                                      const SizedBox(width: 12),
                                      Radio<String>(
                                        value: 'Unmarried',
                                        groupValue: _maritalStatus.text,
                                        onChanged: (value) {
                                          setState(() {
                                            _maritalStatus.text = value!;
                                            field.didChange(value);
                                          });
                                        },
                                      ),
                                      const Text('Unmarried',
                                          style: TextStyle(
                                              fontSize: 13,
                                              color: Colors.white)),
                                    ],
                                  ),
                                );
                              },
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 15),
                      Row(
                        children: [
                          Expanded(
                            child: _formField(
                              'Company/institution Address',
                              _companyAddress,
                              hintText: 'Work Location',
                            ),
                          ),
                          const SizedBox(width: 15),
                          Expanded(
                            child: DropdownButtonFormField<String>(
                              initialValue: _gender,
                              style: const TextStyle(
                                  fontSize: 14, color: Colors.white),
                              dropdownColor: _cardColor,
                              decoration: InputDecoration(
                                labelText: 'Select Status',
                                labelStyle: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white70),
                                filled: true,
                                fillColor: const Color(0xFF22242F),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  borderSide:
                                      const BorderSide(color: _borderColor),
                                ),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  borderSide:
                                      const BorderSide(color: _borderColor),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                  borderSide: const BorderSide(
                                      color: Color(0xFF3D6EF2), width: 1.4),
                                ),
                              ),
                              items: const [
                                DropdownMenuItem(
                                    value: 'Student', child: Text('Student')),
                                DropdownMenuItem(
                                    value: 'Working Professional',
                                    child: Text('Working Professional')),
                                DropdownMenuItem(
                                    value: 'Business Owner',
                                    child: Text('Business Owner')),
                              ],
                              onChanged: (v) => setState(() => _gender = v),
                              validator: (v) => v == null ? 'Required' : null,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 15),
                      Row(
                        children: [
                          Expanded(
                            child: _formField(
                              'Company/institution Contact Number',
                              _companyPhone,
                              hintText: 'Official Contact',
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 50),
            Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1500),
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: _cardDecoration,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _sectionHeader(
                          Icons.event_available_outlined, 'Stay Details'),
                      const SizedBox(height: 10),
                      const Divider(color: _borderColor),
                      const SizedBox(height: 14),
                      LayoutBuilder(
                        builder: (context, constraints) {
                          final isMobile = constraints.maxWidth < 600;

                          final joinDateField = Expanded(
                            child: _dateField(
                                'Join Date', _joinDateController, context),
                          );

                          final expectedStayField = Expanded(
                            child: _formField(
                              'Expected Period of Stay',
                              _expectedStay,
                              hintText: 'e.g., 12 months',
                            ),
                          );

                          final letterField = Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _formField(
                                  'Appointment / Admission Letter Ref.',
                                  _appointmentLetter,
                                  hintText: 'Enter reference ID',
                                  required: false,
                                ),
                                const SizedBox(height: 4),
                                const Text(
                                  'Attach photocopy separately',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: Colors.white54,
                                  ),
                                ),
                              ],
                            ),
                          );

                          if (isMobile) {
                            return Column(
                              children: [
                                joinDateField,
                                const SizedBox(height: 16),
                                expectedStayField,
                                const SizedBox(height: 16),
                                letterField,
                              ],
                            );
                          }

                          return Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              joinDateField,
                              const SizedBox(width: 12),
                              expectedStayField,
                              const SizedBox(width: 12),
                              letterField,
                            ],
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 50),
            Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1500),
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: _cardDecoration,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _sectionHeader(
                          Icons.meeting_room_outlined, 'Room Allocation'),
                      const SizedBox(height: 10),
                      const Divider(color: _borderColor),
                      const SizedBox(height: 14),
                      LayoutBuilder(
                        builder: (context, constraints) {
                          final isMobile = constraints.maxWidth < 600;

                          final roomNoField = Expanded(
                            child: _formField(
                              'Room No',
                              _roomNo,
                              hintText: 'e.g., A-101',
                            ),
                          );

                          final rentField = Expanded(
                            child: _formField(
                              'Monthly Rent',
                              _monthlyRent,
                              hintText: 'e.g., 8000',
                              keyboardType: TextInputType.number,
                            ),
                          );

                          if (isMobile) {
                            return Column(
                              children: [
                                roomNoField,
                                const SizedBox(height: 16),
                                rentField,
                              ],
                            );
                          }

                          return Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              roomNoField,
                              const SizedBox(width: 12),
                              rentField,
                            ],
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 50),
            Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1500),
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: _cardDecoration,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _sectionHeader(
                          Icons.medical_services_outlined, 'Vehicle & Health'),
                      const SizedBox(height: 10),
                      const Divider(color: _borderColor),
                      const SizedBox(height: 14),
                      LayoutBuilder(
                        builder: (context, constraints) {
                          final isMobile = constraints.maxWidth < 600;

                          final vehicleModel = _formField(
                            'Vehicle Model',
                            _vehicleModel,
                            hintText: 'e.g., Honda Civic',
                            required: false,
                          );

                          final bloodGroup = DropdownButtonFormField<String>(
                            value: _bloodGroup.text.isEmpty
                                ? null
                                : _bloodGroup.text,
                            style: const TextStyle(
                                fontSize: 14, color: Colors.white),
                            dropdownColor: _cardColor,
                            decoration: InputDecoration(
                              labelText: 'Blood Group',
                              labelStyle: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white70),
                              filled: true,
                              fillColor: const Color(0xFF22242F),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                                borderSide:
                                    const BorderSide(color: _borderColor),
                              ),
                              enabledBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                                borderSide:
                                    const BorderSide(color: _borderColor),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(8),
                                borderSide: const BorderSide(
                                    color: Color(0xFF3D6EF2), width: 1.4),
                              ),
                              contentPadding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 12,
                              ),
                            ),
                            hint: const Text('Select',
                                style: TextStyle(
                                    fontSize: 13, color: Colors.white38)),
                            items: const [
                              DropdownMenuItem(value: 'A+', child: Text('A+')),
                              DropdownMenuItem(value: 'A-', child: Text('A-')),
                              DropdownMenuItem(value: 'B+', child: Text('B+')),
                              DropdownMenuItem(value: 'B-', child: Text('B-')),
                              DropdownMenuItem(
                                  value: 'AB+', child: Text('AB+')),
                              DropdownMenuItem(
                                  value: 'AB-', child: Text('AB-')),
                              DropdownMenuItem(value: 'O+', child: Text('O+')),
                              DropdownMenuItem(value: 'O-', child: Text('O-')),
                            ],
                            onChanged: (value) {
                              setState(() => _bloodGroup.text = value ?? '');
                            },
                            validator: (value) =>
                                value == null ? 'Required' : null,
                          );

                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (isMobile) ...[
                                vehicleModel,
                                const SizedBox(height: 16),
                                bloodGroup,
                              ] else
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Expanded(child: vehicleModel),
                                    const SizedBox(width: 12),
                                    Expanded(child: bloodGroup),
                                  ],
                                ),
                              const SizedBox(height: 16),
                              _formField(
                                'Vehicle Registration Number',
                                _vehicleNumber,
                                hintText: 'Reg. ID',
                                required: false,
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                'Attach RC and licence photocopy',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.white54,
                                ),
                              ),
                              const SizedBox(height: 16),
                              _formField(
                                'Health Condition',
                                _healthCondition,
                                hintText: 'List any existing conditions...',
                                maxLines: 3,
                                required: false,
                              ),
                              const SizedBox(height: 10),
                              Container(
                                width: double.infinity,
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF3A1F22),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(
                                      color: const Color(0xFF632B2E)),
                                ),
                                child: const Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Icon(
                                      Icons.info_outline,
                                      color: Color(0xFFEF9A9A),
                                      size: 17,
                                    ),
                                    SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        'Note: Please mention any illness and long-term '
                                        'medicine names so that we can help you in an '
                                        'emergency situation.',
                                        style: TextStyle(
                                          fontSize: 13,
                                          height: 1.35,
                                          color: Color(0xFFFFCDD2),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 50),
            Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 1500),
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: _cardDecoration,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _sectionHeader(Icons.fact_check_outlined, 'Declaration'),
                      const SizedBox(height: 10),
                      const Divider(color: _borderColor),
                      const SizedBox(height: 14),
                      const Text(
                        'I hereby declare that the information provided above is true '
                        'and correct to the best of my knowledge. I agree to abide by '
                        'all the rules and regulations of the PG. I understand that '
                        'violation of PG rules may lead to eviction without refund.',
                        style: TextStyle(
                          fontSize: 13,
                          height: 1.4,
                          color: Colors.white70,
                        ),
                      ),
                      const SizedBox(height: 20),
                      LayoutBuilder(
                        builder: (context, constraints) {
                          final isMobile = constraints.maxWidth < 600;

                          final signatureField = Expanded(
                            child: _formField(
                              'Signature of Applicant',
                              _signature,
                              hintText: 'Type full name as signature',
                            ),
                          );

                          final dateField = Expanded(
                            child:
                                _dateField('Date', _declarationDate, context),
                          );

                          if (isMobile) {
                            return Column(
                              children: [
                                signatureField,
                                const SizedBox(height: 16),
                                dateField,
                              ],
                            );
                          }

                          return Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              signatureField,
                              const SizedBox(width: 15),
                              dateField,
                            ],
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: 700,
              child: Center(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF3D6EF2),
                    foregroundColor: Colors.white,
                    minimumSize: const Size(220, 48),
                    textStyle: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  onPressed: _saving ? null : _save,
                  child: _saving
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Register Tenant'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      final emergencyContact = _guardianPhone.text.trim().isNotEmpty
          ? _guardianPhone.text.trim()
          : _fatherPhone.text.trim();

      DateTime? _parseDate(String text) {
        if (text.trim().isEmpty) return null;
        try {
          return DateFormat('dd-MM-yyyy').parseStrict(text.trim());
        } catch (_) {
          return null;
        }
      }

      await context.read<TenantController>().addTenant(TenantModel(
            id: '',
            name: _name.text.trim(),
            roomNo: _roomNo.text.trim().toUpperCase(),
            phone: _phone.text.replaceAll(RegExp(r'\D'), ''),
            joinDate: _joinDate,
            monthlyRent: int.tryParse(_monthlyRent.text.trim()) ?? 0,
            idProofType: _idProofType!,
            idNumber: _idNumber.text.trim(),
            emergencyContact: emergencyContact,
            status: 'active',
            email: _email.text.trim(),
            dob: _parseDate(_dob.text),
            age: int.tryParse(_age.text.trim()),
            permanentAddress: _address.text.trim(),
            nationality: _nationality.text.trim(),
            fatherName: _fatherName.text.trim(),
            fatherPhone: _fatherPhone.text.trim(),
            motherName: _motherName.text.trim(),
            motherPhone: _motherPhone.text.trim(),
            guardianName: _guardianName.text.trim(),
            guardianPhone: _guardianPhone.text.trim(),
            maritalStatus: _maritalStatus.text.trim(),
            companyName: _companyName.text.trim(),
            companyAddress: _companyAddress.text.trim(),
            companyPhone: _companyPhone.text.trim(),
            occupationStatus: _gender,
            appointmentLetterRef: _appointmentLetter.text.trim(),
            expectedStay: _expectedStay.text.trim(),
            vehicleModel: _vehicleModel.text.trim(),
            vehicleNumber: _vehicleNumber.text.trim(),
            bloodGroup: _bloodGroup.text.trim(),
            healthCondition: _healthCondition.text.trim(),
            signature: _signature.text.trim(),
            declarationDate: _parseDate(_declarationDate.text),
          ));
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Tenant registered')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  //============================ Helper methods ==========================
  Widget _formField(
    String? label,
    TextEditingController controller, {
    String? hintText,
    TextInputType? keyboardType,
    int maxLines = 1,
    bool required = true,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label!,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: Colors.white70,
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          maxLines: maxLines,
          style: const TextStyle(fontSize: 14, color: Colors.white),
          decoration: InputDecoration(
            hintText: hintText,
            hintStyle: const TextStyle(fontSize: 13, color: Colors.white38),
            filled: true,
            fillColor: const Color(0xFF22242F),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: _borderColor),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: _borderColor),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide:
                  const BorderSide(color: Color(0xFF3D6EF2), width: 1.4),
            ),
          ),
          validator: required
              ? (value) =>
                  value == null || value.trim().isEmpty ? 'Required' : null
              : null,
        ),
      ],
    );
  }

  Widget _dateField(
    String label,
    TextEditingController controller,
    BuildContext context, {
    bool required = true,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: Colors.white70,
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          readOnly: true,
          style: const TextStyle(fontSize: 14, color: Colors.white),
          onTap: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: DateTime.now(),
              firstDate: DateTime(1900),
              lastDate: DateTime(2100),
            );
            if (picked != null) {
              final dd = picked.day.toString().padLeft(2, '0');
              final mm = picked.month.toString().padLeft(2, '0');
              final yyyy = picked.year.toString();
              controller.text = '$dd-$mm-$yyyy';
              if (label == 'Join Date') {
                _joinDate = picked;
              }
            }
          },
          decoration: InputDecoration(
            hintText: 'DD-MM-YYYY',
            hintStyle: const TextStyle(fontSize: 13, color: Colors.white38),
            suffixIcon: const Icon(
              Icons.calendar_today_outlined,
              size: 18,
              color: Colors.white70,
            ),
            isDense: true,
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            filled: true,
            fillColor: const Color(0xFF22242F),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: _borderColor),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: _borderColor),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide:
                  const BorderSide(color: Color(0xFF3D6EF2), width: 1.4),
            ),
          ),
          validator: required
              ? (value) =>
                  value == null || value.trim().isEmpty ? 'Required' : null
              : null,
        ),
      ],
    );
  }

  Future<void> _pickPhoto() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.image,
        allowMultiple: false,
        withData: true,
      );

      if (result == null) return;

      final bytes = result.files.single.bytes;

      if (bytes != null && mounted) {
        setState(() => _profilePhotoBytes = bytes);
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Unable to select photo: $error')),
        );
      }
    }
  }

  Widget _photoUpload() {
    return Column(
      children: [
        InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: _pickPhoto,
          child: Container(
            height: 96,
            width: 96,
            decoration: BoxDecoration(
              color: const Color(0xFF202B3D),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: const Color(0xFF60A5FA),
                width: 1.2,
              ),
            ),
            child: _profilePhotoBytes != null
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(11),
                    child: Image.memory(
                      _profilePhotoBytes!,
                      fit: BoxFit.cover,
                    ),
                  )
                : const Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.add_a_photo_outlined,
                        color: Color(0xFF60A5FA),
                      ),
                      SizedBox(height: 6),
                      Text(
                        'Upload photo',
                        style: TextStyle(
                          color: Color(0xFFF1F5F9),
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Passport-size photo',
          style: TextStyle(
            color: Color(0xFFB6C2D2),
            fontSize: 11,
          ),
        ),
      ],
    );
  }
}
