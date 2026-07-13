import 'package:flutter/material.dart';
import '../../views/auth/login_view.dart';
import '../../views/dashboard/home_shell.dart';
import '../../views/tenants/add_tenant_view.dart';

class AppRoutes {
  static const login = '/login';
  static const home = '/home';
  static const addTenant = '/tenants/add';

  static Map<String, WidgetBuilder> get routes => {
        login: (_) => const LoginView(),
        home: (_) => const HomeShell(),
        addTenant: (_) => const AddTenantView(),
      };
}
