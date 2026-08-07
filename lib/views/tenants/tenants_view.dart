import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:pgmaster/models/tenant_model.dart';
import 'package:pgmaster/views/tenants/add_tenant_form.dart';
import 'package:provider/provider.dart';
import '../../controllers/tenant_controller.dart';
import '../../core/routes/app_routes.dart';
import '../../core/theme/app_theme.dart';
import '../widgets/status_chip.dart';

class TenantsView extends StatefulWidget {
  const TenantsView({
    super.key,
  });

  @override
  State<TenantsView> createState() => _TenantsViewState();
}

class _TenantsViewState extends State<TenantsView> {
  @override
  Widget build(BuildContext context) {
    final controller = context.watch<TenantController>();

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.accent,
        onPressed: () => Navigator.pushNamed(context, AppRoutes.addTenant),
        icon: const Icon(Icons.add),
        label: const Text('Add Tenant'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              onChanged: controller.search,
              decoration: const InputDecoration(
                hintText: 'Search by name or room…',
                prefixIcon: Icon(Icons.search),
              ),
            ),
          ),
          Expanded(
            child: controller.loading
                ? const Center(child: CircularProgressIndicator())
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 80),
                    itemCount: controller.tenants.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, i) {
                      final t = controller.tenants[i];
                      return Card(
                        child: ListTile(
                          title: Row(
                            children: [
                              tenantAvatar(t),
                              const SizedBox(width: 15),
                              Expanded(
                                child: Text(
                                  t.name,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w600),
                                ),
                              ),
                            ],
                          ),
                          subtitle: Padding(
                            padding: const EdgeInsets.only(top: 4),
                            child: Row(children: [
                              StatusChip(t.status),
                              const SizedBox(width: 8),
                              Text(
                                'Since ${DateFormat('MMM yyyy').format(t.joinDate)}',
                                style: const TextStyle(
                                    color: AppColors.textSecondary,
                                    fontSize: 12),
                              ),
                            ]),
                          ),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(t.roomNo,
                                      style: const TextStyle(
                                          color: AppColors.accent,
                                          fontWeight: FontWeight.w700)),
                                  Text('₹${t.monthlyRent}/mo',
                                      style: const TextStyle(fontSize: 12)),
                                ],
                              ),
                              Row(
                                children: [
                                  IconButton(
                                    icon: const Icon(
                                      Icons.edit,
                                      size: 18,
                                      color: AppColors.textSecondary,
                                    ),
                                    onPressed: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) => AddTenantView(
                                            tenant: t,
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                  IconButton(
                                    icon: const 
                                    Icon(Icons.delete), 
                                    onPressed: () 
                                    {
                                      showDialog(
                                        context: context,
                                        builder: (dialogContext) => AlertDialog(
                                          backgroundColor: AppColors.surface,
                                          title: const Text('Confirm Delete'),
                                          content: const Text('Are you sure you want to delete this tenant? This action cannot be undone.'),
                                          actions: [
                                            TextButton(
                                              onPressed: () => Navigator.pop(dialogContext),
                                              child: const Text('Cancel'),
                                            ),
                                            ElevatedButton(
                                              onPressed: () {
                                                controller.deleteTenant(t.id);
                                                Navigator.pop(dialogContext);
                                              },
                                              child: const Text('Delete'),
                                            ),
                                          ],
                                        ),
                                      );
                                    }
                                  )
                                ],
                              )
                            ],
                          ),
                          onLongPress: () => _showStatusSheet(context, t.id),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  void _showStatusSheet(BuildContext context, String tenantId) {
    final controller = context.read<TenantController>();
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (final status in ['active', 'notice', 'vacated'])
              ListTile(
                title: Text('Mark as ${status.toUpperCase()}'),
                onTap: () {
                  controller.setStatus(tenantId, status);
                  Navigator.pop(context);
                },
              ),
              
          ],
        ),
      ),
    );
  }
}

  void _showStatusSheet(BuildContext context, String tenantId) {
    final controller = context.read<TenantController>();
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (final status in ['active', 'notice', 'vacated'])
              ListTile(
                title: Text('Mark as ${status.toUpperCase()}'),
                onTap: () {
                  controller.setStatus(tenantId, status);
                  Navigator.pop(context);
                },
              ),
          ],
        ),
      ),
    );
  }

//   void _showEditFeeDialog(BuildContext context, String tenantId, int currentRent) {
//   final controller = context.read<TenantController>();
//   final rentController = TextEditingController(text: currentRent.toString());
//   final formKey = GlobalKey<FormState>();
//   bool saving = false;

//   showDialog(
//     context: context,
//     builder: (dialogContext) => StatefulBuilder(
//       builder: (dialogContext, setDialogState) => AlertDialog(
//         backgroundColor: AppColors.surface,
//         title: const Text('Edit Monthly Fee'),
//         content: Form(
//           key: formKey,
//           child: TextFormField(
//             controller: rentController,
//             autofocus: true,
//             keyboardType: TextInputType.number,
//             style: const TextStyle(color: Colors.white),
//             decoration: const InputDecoration(
//               labelText: 'Monthly Rent (₹)',
//               prefixText: '₹ ',
//             ),
//             validator: (v) {
//               final parsed = int.tryParse(v ?? '');
//               if (parsed == null || parsed <= 0) return 'Enter a valid amount';
//               return null;
//             },
//           ),
//         ),
//         actions: [
//           TextButton(
//             onPressed: saving ? null : () => Navigator.pop(dialogContext),
//             child: const Text('Cancel'),
//           ),
//           ElevatedButton(
//             onPressed: saving
//                 ? null
//                 : () async {
//                     if (!formKey.currentState!.validate()) return;
//                     setDialogState(() => saving = true);
//                     try {
//                       final newRent = int.parse(rentController.text.trim());
//                       await controller.updateTenantRent(tenantId, newRent);
//                       if (dialogContext.mounted) {
//                         Navigator.pop(dialogContext);
//                         ScaffoldMessenger.of(context).showSnackBar(
//                           const SnackBar(content: Text('Fee updated')),
//                         );
//                       }
//                     } catch (e) {
//                       setDialogState(() => saving = false);
//                       if (dialogContext.mounted) {
//                         ScaffoldMessenger.of(dialogContext).showSnackBar(
//                           SnackBar(content: Text('Failed to update: $e')),
//                         );
//                       }
//                     }
//                   },
//             child: saving
//                 ? const SizedBox(
//                     height: 16,
//                     width: 16,
//                     child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
//                   )
//                 : const Text('Save'),
//           ),
//         ],
//       ),
//     ),
//   );
// }

  Widget tenantAvatar(t) {
    final photoPath = t.photourl;

    Widget fallbackAvatar() {
      return CircleAvatar(
        radius: 20,
        child: Text(
          t.name.isNotEmpty ? t.name[0].toUpperCase() : '?',
          style: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 20,
          ),
        ),
      );
    }

    if (photoPath == null || photoPath.trim().isEmpty) {
      return fallbackAvatar();
    }

    return FutureBuilder<String>(
      future: FirebaseStorage.instance.ref(photoPath).getDownloadURL(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return fallbackAvatar();
        }

        return CircleAvatar(
          radius: 20,
          backgroundImage: NetworkImage(snapshot.data!),
        );
      },
    );
  }

