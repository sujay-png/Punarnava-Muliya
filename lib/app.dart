import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'controllers/auth_controller.dart';
import 'controllers/fee_controller.dart';
import 'controllers/maintenance_controller.dart';
import 'controllers/notice_controller.dart';
import 'controllers/tenant_controller.dart';
import 'core/routes/app_routes.dart';
import 'core/theme/app_theme.dart';
import 'views/auth/login_view.dart';
import 'views/dashboard/home_shell.dart';

class PgMasterApp extends StatelessWidget {
  const PgMasterApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthController()),
        ChangeNotifierProvider(create: (_) => TenantController()),
        ChangeNotifierProvider(create: (_) => FeeController()),
        ChangeNotifierProvider(create: (_) => MaintenanceController()),
        ChangeNotifierProvider(create: (_) => NoticeController()),
      ],
      child: MaterialApp(
        title: 'PGMaster',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.dark,
        routes: AppRoutes.routes,
        home: Consumer<AuthController>(
          builder: (context, auth, _) =>
              auth.isLoggedIn ? const HomeShell() : const LoginView(),
        ),
      ),
    );
  }
}
