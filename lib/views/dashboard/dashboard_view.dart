import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../controllers/fee_controller.dart';
import '../../controllers/maintenance_controller.dart';
import '../../controllers/tenant_controller.dart';
import '../../core/constants/app_constants.dart';
import '../../core/theme/app_theme.dart';
import '../widgets/stat_card.dart';

class DashboardView extends StatelessWidget {
  const DashboardView({super.key});

  @override
  Widget build(BuildContext context) {
    final tenants = context.watch<TenantController>();
    final fees = context.watch<FeeController>();
    final maintenance = context.watch<MaintenanceController>();

    final rows = fees.billingRows(tenants.tenants);
    final pending = rows
        .where((p) => p.status != PaymentStatus.paid)
        .fold(0, (s, p) => s + p.remaining);
    final collected = rows.fold(0, (s, p) => s + p.paidAmount);
    final monthName = DateFormat('MMMM yyyy').format(DateTime.now());

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Dashboard',
            style: Theme.of(context)
                .textTheme
                .headlineSmall
                ?.copyWith(fontWeight: FontWeight.w800)),
        Text('$monthName — ${tenants.activeCount} active members',
            style: const TextStyle(color: AppColors.textSecondary)),
        const SizedBox(height: 16),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.5,
          children: [
            StatCard(
              label: 'Total tenants',
              value: '${tenants.activeCount}',
              subtitle: 'registered members',
              highlighted: true,
            ),
            StatCard(
              label: 'Collected',
              value: '₹${NumberFormat.decimalPattern('en_IN').format(collected)}',
              subtitle: 'this month',
              valueColor: AppColors.paid,
            ),
            StatCard(
              label: 'Pending / due',
              value: '₹${NumberFormat.decimalPattern('en_IN').format(pending)}',
              subtitle: 'this month',
              valueColor: AppColors.pending,
            ),
            StatCard(
              label: 'Maintenance',
              value: '${maintenance.openCount}',
              subtitle: 'open requests',
            ),
          ],
        ),
        const SizedBox(height: 20),
        const Text('AUTOMATED REMINDERS',
            style: TextStyle(
                fontSize: 11,
                letterSpacing: 1.2,
                color: AppColors.textSecondary)),
        const SizedBox(height: 8),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'WhatsApp reminders go out automatically on the '
                  '${ReminderConfig.reminderDays.join(", ")} of every month.',
                ),
                const SizedBox(height: 8),
                const Text(
                  'Pay rent in full on or before the 5th to get code '
                  '${ReminderConfig.earlyBirdCoupon} for '
                  '${ReminderConfig.productDiscountPercent}% off shop products '
                  '(not rent). Offer is sent on the 1st, 3rd and 5th.',
                  style: TextStyle(color: AppColors.accent),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
