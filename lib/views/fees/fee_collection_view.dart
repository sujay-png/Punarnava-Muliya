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
        .fold(0, (s, p) => s + p.remaining);
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
                  value: '₹${fmt.format(rows.fold(0, (s, p) => s + p.paidAmount))}',
                  valueColor: AppColors.paid)),
          const SizedBox(width: 12),
          Expanded(
              child: StatCard(
                  label: 'Yet to pay',
                  value: '₹${fmt.format(pending)}',
                  valueColor: AppColors.pending)),
        ]),
        const SizedBox(height: 16),
        Wrap(
          spacing: 8,
          children: [
            for (final f in [
              'all',
              PaymentStatus.paid,
              PaymentStatus.partial,
              PaymentStatus.pending,
              PaymentStatus.overdue,
            ])
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
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Text(p.roomNo,
                          style: const TextStyle(
                              color: AppColors.accent,
                              fontWeight: FontWeight.w700)),
                      const SizedBox(width: 10),
                      StatusChip(p.status),
                    ]),
                    const SizedBox(height: 4),
                    Text(
                      p.isFullyPaid
                          ? '₹${fmt.format(p.amount)} received'
                          : 'Paid ₹${fmt.format(p.paidAmount)} of ₹${fmt.format(p.amount)}  ·  due ₹${fmt.format(p.remaining)}',
                      style: const TextStyle(
                          color: AppColors.textSecondary, fontSize: 12),
                    ),
                    if (p.couponUsed != null && p.isFullyPaid)
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Text(
                          '${p.couponUsed} — 10% off shop products',
                          style: const TextStyle(
                              color: AppColors.accent, fontSize: 11),
                        ),
                      ),
                  ],
                ),
              ),
              isThreeLine: true,
              trailing: p.isFullyPaid
                  ? Text('₹${fmt.format(p.amount)}',
                      style: const TextStyle(
                          color: AppColors.paid, fontWeight: FontWeight.w700))
                  : OutlinedButton(
                      onPressed: () => _recordPayment(context, p),
                      child: Text('Record ₹${fmt.format(p.remaining)}'),
                    ),
            ),
          ),
      ],
    );
  }

  void _recordPayment(BuildContext context, PaymentModel p) {
    final fmt = NumberFormat.decimalPattern('en_IN');
    final controller = TextEditingController(text: '${p.remaining}');
    showDialog(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          backgroundColor: AppColors.surface,
          title: const Text('Record payment'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('${p.tenantName} (${p.roomNo})'),
              const SizedBox(height: 12),
              Text('Rent: ₹${fmt.format(p.amount)}'),
              Text('Already paid: ₹${fmt.format(p.paidAmount)}'),
              Text(
                'Yet to pay: ₹${fmt.format(p.remaining)}',
                style: const TextStyle(
                    color: AppColors.pending, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: controller,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Amount received now',
                  prefixText: '₹ ',
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Use a smaller amount if UPI bank limits block the full rent. '
                'EARLY10 (10% off shop products, not rent) applies only when '
                'the full rent is cleared on or before the 5th.',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
              ),
            ],
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(dialogContext),
                child: const Text('Cancel')),
            OutlinedButton(
              onPressed: () {
                context.read<FeeController>().markPaid(p);
                Navigator.pop(dialogContext);
              },
              child: const Text('Mark fully paid'),
            ),
            ElevatedButton(
              onPressed: () {
                final raw =
                    int.tryParse(controller.text.replaceAll(',', '').trim());
                if (raw == null || raw <= 0) return;
                context.read<FeeController>().recordPayment(p, raw);
                Navigator.pop(dialogContext);
              },
              child: const Text('Save'),
            ),
          ],
        );
      },
    ).whenComplete(controller.dispose);
  }
}
