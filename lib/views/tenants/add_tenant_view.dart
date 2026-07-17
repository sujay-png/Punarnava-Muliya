import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../controllers/tenant_controller.dart';
import '../../models/tenant_model.dart';

/// "New Tenant" form — mirrors the shared modal design.
class AddTenantView extends StatefulWidget {
  const AddTenantView({super.key});

  @override
  State<AddTenantView> createState() => _AddTenantViewState();
}

class _AddTenantViewState extends State<AddTenantView> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _room = TextEditingController();
  final _phone = TextEditingController();
  final _rent = TextEditingController();
  final _idNumber = TextEditingController();
  final _emergency = TextEditingController();
  String? _gender;
  String? _idProofType;
  DateTime _joinDate = DateTime.now();
  bool _saving = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('New Tenant')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _name,
              decoration: const InputDecoration(labelText: 'Full name'),
              validator: (v) => v!.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(
                child: TextFormField(
                  controller: _room,
                  decoration:
                      const InputDecoration(labelText: 'Room no. (e.g. A-101)'),
                  validator: (v) => v!.trim().isEmpty ? 'Required' : null,
                ),
              ),
              const SizedBox(width: 12),
              // Expanded(
              //   child: DropdownButtonFormField<String>(
              //     initialValue: _gender,
              //     decoration: const InputDecoration(labelText: 'Gender'),
              //     items: const [
              //       DropdownMenuItem(value: 'male', child: Text('Male')),
              //       DropdownMenuItem(value: 'female', child: Text('Female')),
              //     ],
              //     onChanged: (v) => setState(() => _gender = v),
              //     validator: (v) => v == null ? 'Required' : null,
              //   ),
              // ),
            ]),
            const SizedBox(height: 12),
            TextFormField(
              controller: _phone,
              decoration: const InputDecoration(
                  labelText: 'Phone (10-digit, WhatsApp number)'),
              keyboardType: TextInputType.phone,
              validator: (v) =>
                  (v == null || v.replaceAll(RegExp(r'\D'), '').length != 10)
                      ? 'Enter a 10-digit mobile number'
                      : null,
            ),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(
                child: TextFormField(
                  controller: _rent,
                  decoration:
                      const InputDecoration(labelText: 'Monthly rent (₹)'),
                  keyboardType: TextInputType.number,
                  validator: (v) =>
                      (int.tryParse(v ?? '') == null) ? 'Enter amount' : null,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.calendar_today, size: 16),
                  label: Text(DateFormat('dd/MM/yyyy').format(_joinDate)),
                  onPressed: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: _joinDate,
                      firstDate: DateTime(2020),
                      lastDate: DateTime.now().add(const Duration(days: 60)),
                    );
                    if (picked != null) setState(() => _joinDate = picked);
                  },
                ),
              ),
            ]),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  initialValue: _idProofType,
                  decoration: const InputDecoration(labelText: 'ID proof type'),
                  items: const [
                    DropdownMenuItem(value: 'aadhaar', child: Text('Aadhaar')),
                    DropdownMenuItem(value: 'pan', child: Text('PAN')),
                    DropdownMenuItem(
                        value: 'driving_license',
                        child: Text('Driving license')),
                    DropdownMenuItem(
                        value: 'passport', child: Text('Passport')),
                  ],
                  onChanged: (v) => setState(() => _idProofType = v),
                  validator: (v) => v == null ? 'Required' : null,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextFormField(
                  controller: _idNumber,
                  decoration: const InputDecoration(labelText: 'ID number'),
                  validator: (v) => v!.trim().isEmpty ? 'Required' : null,
                ),
              ),
            ]),
            const SizedBox(height: 12),
            TextFormField(
              controller: _emergency,
              decoration: const InputDecoration(
                  labelText: 'Emergency contact (name & phone)'),
              validator: (v) => v!.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _saving ? null : _save,
              child: _saving
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Register Tenant'),
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
      await context.read<TenantController>().addTenant(TenantModel(
            id: '',
            name: _name.text.trim(),
            roomNo: _room.text.trim().toUpperCase(),
            phone: _phone.text.replaceAll(RegExp(r'\D'), ''),
          
            joinDate: _joinDate,
            monthlyRent: int.parse(_rent.text),
            idProofType: _idProofType!,
            idNumber: _idNumber.text.trim(),
            emergencyContact: _emergency.text.trim(),
            status: 'active',
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
}
