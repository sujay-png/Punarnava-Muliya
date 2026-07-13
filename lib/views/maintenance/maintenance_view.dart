import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../controllers/maintenance_controller.dart';
import '../../core/constants/app_constants.dart';
import '../../core/theme/app_theme.dart';
import '../../models/maintenance_model.dart';
import '../widgets/stat_card.dart';
import '../widgets/status_chip.dart';

class MaintenanceView extends StatelessWidget {
  const MaintenanceView({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<MaintenanceController>();

    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.accent,
        onPressed: () => _showNewRequestSheet(context),
        icon: const Icon(Icons.add),
        label: const Text('New Request'),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
        children: [
          Text('Maintenance',
              style: Theme.of(context)
                  .textTheme
                  .headlineSmall
                  ?.copyWith(fontWeight: FontWeight.w800)),
          Text('${controller.openCount} open requests',
              style: const TextStyle(color: AppColors.textSecondary)),
          const SizedBox(height: 16),
          Row(children: [
            Expanded(
                child: StatCard(
                    label: 'Open',
                    value: '${controller.count(MaintenanceStatus.open)}',
                    valueColor: AppColors.pending)),
            const SizedBox(width: 8),
            Expanded(
                child: StatCard(
                    label: 'In progress',
                    value: '${controller.count(MaintenanceStatus.inProgress)}',
                    valueColor: AppColors.accent)),
            const SizedBox(width: 8),
            Expanded(
                child: StatCard(
                    label: 'Resolved',
                    value: '${controller.count(MaintenanceStatus.resolved)}',
                    valueColor: AppColors.paid)),
          ]),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            children: [
              for (final f in [
                ('all', 'ALL'),
                (MaintenanceStatus.open, 'OPEN'),
                (MaintenanceStatus.inProgress, 'IN PROGRESS'),
                (MaintenanceStatus.resolved, 'RESOLVED'),
              ])
                ChoiceChip(
                  label: Text(f.$2),
                  selected: controller.filter == f.$1,
                  selectedColor: AppColors.accent,
                  onSelected: (_) => controller.setFilter(f.$1),
                ),
            ],
          ),
          const SizedBox(height: 12),
          for (final r in controller.requests)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      StatusChip(r.priority),
                      const SizedBox(width: 8),
                      StatusChip(r.status),
                      const Spacer(),
                      Text(r.category,
                          style: const TextStyle(
                              color: AppColors.textSecondary, fontSize: 12)),
                    ]),
                    const SizedBox(height: 8),
                    Text(r.title,
                        style: const TextStyle(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Text(
                        '${r.roomNo} · ${r.tenantName} · ${DateFormat('yyyy-MM-dd').format(r.createdAt)}',
                        style: const TextStyle(
                            color: AppColors.textSecondary, fontSize: 12)),
                    const SizedBox(height: 8),
                    if (r.status != MaintenanceStatus.resolved)
                      Align(
                        alignment: Alignment.centerRight,
                        child: OutlinedButton(
                          onPressed: () => context
                              .read<MaintenanceController>()
                              .setStatus(
                                  r.id,
                                  r.status == MaintenanceStatus.open
                                      ? MaintenanceStatus.inProgress
                                      : MaintenanceStatus.resolved),
                          child: Text(r.status == MaintenanceStatus.open
                              ? 'Start'
                              : 'Resolve'),
                        ),
                      ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  void _showNewRequestSheet(BuildContext context) {
    final title = TextEditingController();
    final room = TextEditingController();
    final tenant = TextEditingController();
    String category = 'Electrical';
    String priority = 'medium';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      builder: (sheetContext) => Padding(
        padding: EdgeInsets.fromLTRB(
            16, 16, 16, MediaQuery.of(sheetContext).viewInsets.bottom + 16),
        child: StatefulBuilder(
          builder: (context, setState) => Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('New Maintenance Request',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
              const SizedBox(height: 12),
              TextField(
                  controller: title,
                  decoration: const InputDecoration(labelText: 'Issue')),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(
                    child: TextField(
                        controller: room,
                        decoration:
                            const InputDecoration(labelText: 'Room no.'))),
                const SizedBox(width: 12),
                Expanded(
                    child: TextField(
                        controller: tenant,
                        decoration:
                            const InputDecoration(labelText: 'Tenant'))),
              ]),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: category,
                    decoration: const InputDecoration(labelText: 'Category'),
                    items: const [
                      DropdownMenuItem(
                          value: 'Electrical', child: Text('Electrical')),
                      DropdownMenuItem(
                          value: 'Plumbing', child: Text('Plumbing')),
                      DropdownMenuItem(
                          value: 'Furniture', child: Text('Furniture')),
                      DropdownMenuItem(value: 'Other', child: Text('Other')),
                    ],
                    onChanged: (v) => setState(() => category = v!),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: priority,
                    decoration: const InputDecoration(labelText: 'Priority'),
                    items: const [
                      DropdownMenuItem(value: 'high', child: Text('High')),
                      DropdownMenuItem(value: 'medium', child: Text('Medium')),
                      DropdownMenuItem(value: 'low', child: Text('Low')),
                    ],
                    onChanged: (v) => setState(() => priority = v!),
                  ),
                ),
              ]),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  if (title.text.trim().isEmpty) return;
                  context.read<MaintenanceController>().add(MaintenanceModel(
                        id: '',
                        title: title.text.trim(),
                        category: category,
                        priority: priority,
                        status: MaintenanceStatus.open,
                        roomNo: room.text.trim().toUpperCase(),
                        tenantName: tenant.text.trim(),
                        createdAt: DateTime.now(),
                      ));
                  Navigator.pop(sheetContext);
                },
                child: const Text('Create Request'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
