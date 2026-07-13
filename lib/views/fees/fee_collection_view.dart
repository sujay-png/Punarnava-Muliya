import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../controllers/fee_controller.dart';
import '../../controllers/tenant_controller.dart';
import '../../core/constants/app_constants.dart';
import '../../core/theme/app_theme.dart';
import '../../models/payment_model.dart';
import '../widgets/stat_card.dart';
import '../widgets/status_chip.dart';

class FeeCollectionView extends StatefulWidget {
  const FeeCollectionView({super.key});

  @override
  State<FeeCollectionView> createState() => _FeeCollectionViewState();
}

class _FeeCollectionViewState extends State<FeeCollectionView> {
  String _filter = 'all';

  @override
  Widget build(BuildContext context) {
    final fees = context.watch<FeeController>();
    final tenants = context.watch<TenantController>();
    final rows = fees.billingRows(tenants.tenants);
    final filtered =
        _filter == 'all' ? rows : rows.where((p) => p.status == _filter).toList();
    final pending = rows
        .where((p) => p.status != PaymentStatus.paid)
        .fold(0, (s, p) => s + p.amount);
    final fmt = NumberFormat.decimalPattern('en_IN');

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Fee Collection',
            style: Theme.of(context)
                .textTheme
                .headlineSmall
                ?.copyWith(fontWeight: FontWeight.w800)),
        Text(
            '${DateFormat('MMMM yyyy').format(DateTime.now())} billing cycle · due 15th',
            style: const TextStyle(color: AppColors.textSecondary)),
        const SizedBox(height: 16),
        Row(children: [
          Expanded(
              child: StatCard(
                  label: 'Collected',
                  value: '₹${fmt.format(fees.collected)}',
                  valueColor: AppColors.paid)),
          const SizedBox(width: 12),
          Expanded(
              child: StatCard(
                  label: 'Pending',
                  value: '₹${fmt.format(pending)}',
                  valueColor: AppColors.pending)),
        ]),
        const SizedBox(height: 16),
        Wrap(
          spacing: 8,
          children: [
            for (final f in ['all', 'paid', 'pending', 'overdue'])
              ChoiceChip(
                label: Text(f.toUpperCase()),
                selected: _filter == f,
                selectedColor: AppColors.accent,
                onSelected: (_) => setState(() => _filter = f),
              ),
          ],
        ),
        const SizedBox(height: 12),
        for (final p in filtered)
          Card(
            child: ListTile(
              title: Text(p.tenantName,
                  style: const TextStyle(fontWeight: FontWeight.w700)),
              subtitle: Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Row(children: [
                  Text(p.roomNo,
                      style: const TextStyle(
                          color: AppColors.accent,
                          fontWeight: FontWeight.w700)),
                  const SizedBox(width: 10),
                  StatusChip(p.status),
                ]),
              ),
              trailing: p.status == PaymentStatus.paid
                  ? Text('₹${fmt.format(p.amount)}',
                      style: const TextStyle(
                          color: AppColors.paid, fontWeight: FontWeight.w700))
                  : OutlinedButton(
                      onPressed: () => _confirmMarkPaid(context, p),
                      child: Text('Mark Paid ₹${fmt.format(p.amount)}'),
                    ),
            ),
          ),
      ],
    );
  }

  void _confirmMarkPaid(BuildContext context, PaymentModel p) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Record payment'),
        content: Text('${p.tenantName} (${p.roomNo}) — ₹${p.amount}?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              context.read<FeeController>().markPaid(p);
              Navigator.pop(context);
            },
            child: const Text('Confirm Paid'),
          ),
        ],
      ),
    );
  }
}
