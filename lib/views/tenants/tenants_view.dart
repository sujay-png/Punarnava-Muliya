import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../controllers/tenant_controller.dart';
import '../../core/routes/app_routes.dart';
import '../../core/theme/app_theme.dart';
import '../widgets/status_chip.dart';

class TenantsView extends StatelessWidget {
  const TenantsView({super.key});

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
                              CircleAvatar(
                                radius: 20,
                                backgroundImage:
                                    t.photourl != null && t.photourl!.isNotEmpty
                                        ? NetworkImage(t.photourl!)
                                        : null,
                                child:
                                    (t.photourl == null || t.photourl!.isEmpty)
                                        ? Text(
                                            t.name.isNotEmpty
                                                ? t.name[0].toUpperCase()
                                                : '?',
                                            style: const TextStyle(
                                                fontWeight: FontWeight.w600,
                                                fontSize: 20),
                                          )
                                        : null,
                              ),
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
                          trailing: Column(
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
