import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../controllers/notice_controller.dart';
import '../../core/theme/app_theme.dart';
import '../widgets/status_chip.dart';

/// Notice board — hitting SEND writes the notice to Firestore; the
/// onNoticeCreated Cloud Function broadcasts it to every member on WhatsApp.
class NoticeBoardView extends StatefulWidget {
  const NoticeBoardView({super.key});

  @override
  State<NoticeBoardView> createState() => _NoticeBoardViewState();
}

class _NoticeBoardViewState extends State<NoticeBoardView> {
  final _title = TextEditingController();
  final _message = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<NoticeController>();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Notice Board',
            style: Theme.of(context)
                .textTheme
                .headlineSmall
                ?.copyWith(fontWeight: FontWeight.w800)),
        const Text('Sends to all members on WhatsApp',
            style: TextStyle(color: AppColors.textSecondary)),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextField(
                    controller: _title,
                    decoration: const InputDecoration(labelText: 'Title')),
                const SizedBox(height: 12),
                TextField(
                  controller: _message,
                  maxLines: 4,
                  decoration:
                      const InputDecoration(labelText: 'Notice message'),
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  icon: const Icon(Icons.send),
                  label: Text(controller.sending
                      ? 'Sending…'
                      : 'Send to All Members'),
                  onPressed: controller.sending
                      ? null
                      : () async {
                          if (_title.text.trim().isEmpty ||
                              _message.text.trim().isEmpty) {
                            return;
                          }
                          await controller.send(
                              _title.text.trim(), _message.text.trim());
                          _title.clear();
                          _message.clear();
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content: Text(
                                        'Notice queued — WhatsApp broadcast in progress')));
                          }
                        },
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),
        const Text('SENT NOTICES',
            style: TextStyle(
                fontSize: 11,
                letterSpacing: 1.2,
                color: AppColors.textSecondary)),
        const SizedBox(height: 8),
        for (final n in controller.notices)
          Card(
            child: ListTile(
              title: Text(n.title,
                  style: const TextStyle(fontWeight: FontWeight.w700)),
              subtitle: Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(n.message, maxLines: 2, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 6),
                    Row(children: [
                      StatusChip(n.broadcastStatus),
                      const SizedBox(width: 8),
                      Text(
                        '${n.recipientCount > 0 ? "${n.recipientCount} members · " : ""}${DateFormat('dd MMM, hh:mm a').format(n.createdAt)}',
                        style: const TextStyle(
                            color: AppColors.textSecondary, fontSize: 12),
                      ),
                    ]),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}
