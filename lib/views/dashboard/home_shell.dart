import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../controllers/auth_controller.dart';
import '../../core/theme/app_theme.dart';
import '../fees/fee_collection_view.dart';
import '../maintenance/maintenance_view.dart';
import '../notices/notice_board_view.dart';
import '../tenants/tenants_view.dart';
import 'dashboard_view.dart';

/// App shell with bottom navigation (mobile) — mirrors the sidebar sections
/// in the desktop design: Dashboard, Tenants, Fees, Maintenance, Notices.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;
  final double _mobileBreakpoint = 600;
  bool _isexpanded = false;
  static const _pages = [
    DashboardView(),
    TenantsView(),
    FeeCollectionView(),
    MaintenanceView(),
    NoticeBoardView(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Row(children: [
          Icon(Icons.home_rounded, color: AppColors.accent),
          SizedBox(width: 8),
          Text('PGMASTER', style: TextStyle(fontWeight: FontWeight.w800)),
        ]),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Sign out',
            onPressed: () => context.read<AuthController>().signOut(),
          ),
        ],
      ),
      body: LayoutBuilder(
  builder: (context, constraints) {
    final isMobileLayout = constraints.maxWidth < _mobileBreakpoint;

    if (isMobileLayout) {
      return _pages[_index];
    }

    return Row(
      children: [
        MouseRegion(
          onEnter: (_) => setState(() => _isexpanded = true),
          onExit: (_) => setState(() => _isexpanded = false),
          child: NavigationRail(
            extended:_isexpanded,
            minWidth: 72,
            minExtendedWidth: 200,
            selectedIndex: _index,
            onDestinationSelected: (i) => setState(() => _index = i),
            labelType: NavigationRailLabelType.none,
            backgroundColor: AppColors.surface,
            indicatorColor: AppColors.accent.withValues(alpha: 0.2),
            destinations: const [
              NavigationRailDestination(
                icon: Icon(Icons.dashboard_outlined),
                selectedIcon: Icon(Icons.dashboard),
                label: Text('Dashboard'),
              ),
              NavigationRailDestination(
                icon: Icon(Icons.people_outline),
                selectedIcon: Icon(Icons.people),
                label: Text('Tenants'),
              ),
              NavigationRailDestination(
                icon: Icon(Icons.payments_outlined),
                selectedIcon: Icon(Icons.payments),
                label: Text('Fees'),
              ),
              NavigationRailDestination(
                icon: Icon(Icons.build_outlined),
                selectedIcon: Icon(Icons.build),
                label: Text('Maintenance'),
              ),
              NavigationRailDestination(
                icon: Icon(Icons.campaign_outlined),
                selectedIcon: Icon(Icons.campaign),
                label: Text('Notices'),
              ),
            ],
          ),
        ),
        const VerticalDivider(width: 1),
        Expanded(child: _pages[_index]),
      ],
    );
  },
),
bottomNavigationBar: MediaQuery.sizeOf(context).width < _mobileBreakpoint
    ? NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        backgroundColor: AppColors.surface,
        indicatorColor: AppColors.accent.withValues(alpha: 0.2),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outline),
            label: 'Tenants',
          ),
          NavigationDestination(
            icon: Icon(Icons.payments_outlined),
            label: 'Fees',
          ),
          NavigationDestination(
            icon: Icon(Icons.build_outlined),
            label: 'Maintenance',
          ),
          NavigationDestination(
            icon: Icon(Icons.campaign_outlined),
            label: 'Notices',
          ),
        ],
      )
    : null,
    );
  }
}
