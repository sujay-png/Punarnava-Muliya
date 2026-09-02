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
              onTap: () => _recordPayment(context, p),
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
                    if (p.installments.isNotEmpty ||
                        (p.lastPaymentMethod != null &&
                            p.lastPaymentMethod!.isNotEmpty))
                      Padding(
                        padding: const EdgeInsets.only(top: 2),
                        child: Text(
                          p.installments.isEmpty
                              ? 'Paid via ${PaymentMethod.label(p.lastPaymentMethod!)}'
                              : p.historyChronological
                                  .map((i) => PaymentMethod.label(i.method))
                                  .toSet()
                                  .join(' · '),
                          style: const TextStyle(
                              color: AppColors.textSecondary, fontSize: 11),
                        ),
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
    showDialog(
      context: context,
      builder: (_) => _RecordPaymentDialog(payment: p),
    );
  }
}

class _RecordPaymentDialog extends StatefulWidget {
  final PaymentModel payment;
  const _RecordPaymentDialog({required this.payment});

  @override
  State<_RecordPaymentDialog> createState() => _RecordPaymentDialogState();
}

class _RecordPaymentDialogState extends State<_RecordPaymentDialog> {
  late final TextEditingController _amount;
  late String _method;

  @override
  void initState() {
    super.initState();
    final p = widget.payment;
    _amount = TextEditingController(text: '${p.remaining}');
    _method = PaymentMethod.all.contains(p.lastPaymentMethod)
        ? p.lastPaymentMethod!
        : PaymentMethod.upi;
  }

  @override
  void dispose() {
    _amount.dispose();
    super.dispose();
  }

  String _who() {
    final p = widget.payment;
    if (p.roomNo.trim().isEmpty) return p.tenantName;
    return '${p.tenantName} (${p.roomNo})';
  }

  void _save({required bool fullyPaid}) {
    final p = widget.payment;
    final fees = context.read<FeeController>();
    if (fullyPaid) {
      fees.markPaid(p, _method);
    } else {
      final raw = int.tryParse(_amount.text.replaceAll(',', '').trim());
      if (raw == null || raw <= 0) return;
      fees.recordPayment(p, raw, _method);
    }
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.payment;
    final fmt = NumberFormat.decimalPattern('en_IN');
    final dateFmt = DateFormat('d MMM, h:mm a');
    final history = p.historyChronological;

    return AlertDialog(
      backgroundColor: AppColors.surface,
      title: const Text('Record payment'),
      content: SizedBox(
        width: 420,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(_who()),
              const SizedBox(height: 12),
              Text('Rent: ₹${fmt.format(p.amount)}'),
              Text('Already paid: ₹${fmt.format(p.paidAmount)}'),
              Text(
                'Yet to pay: ₹${fmt.format(p.remaining)}',
                style: const TextStyle(
                    color: AppColors.pending, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 16),
              Text('HOW THEY PAID EARLIER',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: AppColors.textSecondary, letterSpacing: 1.1)),
              const SizedBox(height: 8),
              if (history.isEmpty && p.paidAmount == 0)
                const Text(
                  'No earlier payments this month.',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                )
              else if (history.isEmpty)
                Text(
                  '₹${fmt.format(p.paidAmount)} recorded earlier'
                  '${p.lastPaymentMethod != null && p.lastPaymentMethod!.isNotEmpty ? ' via ${PaymentMethod.label(p.lastPaymentMethod!)}' : ' (method not saved)'}',
                  style: const TextStyle(
                      color: AppColors.textSecondary, fontSize: 12),
                )
              else
                for (final i in history)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: Row(
                      children: [
                        StatusChip(PaymentMethod.label(i.method)),
                        const SizedBox(width: 8),
                        Text('₹${fmt.format(i.amount)}',
                            style:
                                const TextStyle(fontWeight: FontWeight.w700)),
                        if (i.recordedAt != null) ...[
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              dateFmt.format(i.recordedAt!),
                              style: const TextStyle(
                                  color: AppColors.textSecondary, fontSize: 11),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
              const SizedBox(height: 16),
              if (!p.isFullyPaid) ...[
              Text('HOW THEY ARE PAYING NOW',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: AppColors.textSecondary, letterSpacing: 1.1)),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: _method,
                dropdownColor: AppColors.surfaceAlt,
                decoration: const InputDecoration(
                  labelText: 'Payment method',
                ),
                items: [
                  for (final m in PaymentMethod.all)
                    DropdownMenuItem(
                      value: m,
                      child: Text(PaymentMethod.label(m)),
                    ),
                ],
                onChanged: (v) {
                  if (v == null) return;
                  setState(() => _method = v);
                },
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _amount,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Amount received now',
                  prefixText: '₹ ',
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'EARLY10 (10% off shop products, not rent) applies only when '
                'the full rent is cleared on or before the 5th.',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
              ),
              ],
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel')),
        if (!p.isFullyPaid) ...[
        OutlinedButton(
          onPressed: () => _save(fullyPaid: true),
          child: const Text('Mark fully paid'),
        ),
        ElevatedButton(
          onPressed: () => _save(fullyPaid: false),
          child: const Text('Save'),
        ),
        ],
      ],
    );
  }
}
