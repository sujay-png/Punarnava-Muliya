import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class StatusChip extends StatelessWidget {
  final String label;
  const StatusChip(this.label, {super.key});

  Color get _color => switch (label.toLowerCase()) {
        'paid' || 'active' || 'resolved' => AppColors.paid,
        'pending' || 'notice' || 'open' || 'queued' => AppColors.pending,
        'overdue' || 'failed' || 'high' => AppColors.overdue,
        _ => AppColors.textSecondary,
      };

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: _color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        '• ${label.toUpperCase().replaceAll('_', ' ')}',
        style: TextStyle(color: _color, fontSize: 11, fontWeight: FontWeight.w700),
      ),
    );
  }
}
