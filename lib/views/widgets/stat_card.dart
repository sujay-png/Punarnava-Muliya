import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class StatCard extends StatelessWidget {
  final String label;
  final String value;
  final String subtitle;
  final bool highlighted;
  final Color? valueColor;

  const StatCard({
    super.key,
    required this.label,
    required this.value,
    this.subtitle = '',
    this.highlighted = false,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: highlighted ? AppColors.accent : AppColors.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
            color: highlighted ? AppColors.accent : AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label.toUpperCase(),
              style: TextStyle(
                  fontSize: 11,
                  letterSpacing: 1.2,
                  color: highlighted
                      ? Colors.white.withValues(alpha: 0.85)
                      : AppColors.textSecondary)),
          const SizedBox(height: 8),
          Text(value,
              style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: highlighted
                      ? Colors.white
                      : (valueColor ?? AppColors.textPrimary))),
          if (subtitle.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(subtitle,
                style: TextStyle(
                    fontSize: 12,
                    color: highlighted
                        ? Colors.white.withValues(alpha: 0.85)
                        : AppColors.textSecondary)),
          ],
        ],
      ),
    );
  }
}
