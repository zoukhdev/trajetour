import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../presentation/screens/auth/login_screen.dart';
import '../presentation/screens/auth/splash_screen.dart';
import '../presentation/screens/dashboard/dashboard_screen.dart';
import '../presentation/screens/orders/order_list_screen.dart';
import '../presentation/screens/orders/order_form_screen.dart';
import '../presentation/screens/orders/order_detail_screen.dart';
import '../presentation/screens/clients/client_list_screen.dart';
import '../presentation/screens/clients/client_form_screen.dart';
import '../presentation/screens/payments/payment_screen.dart';
import '../presentation/screens/profile/profile_screen.dart';
import '../presentation/providers/auth_provider.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);
  
  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      final isLoggedIn = authState.isAuthenticated;
      final isSplash = state.matchedLocation == '/splash';
      final isLogin = state.matchedLocation == '/login';
      
      // If on splash, let it load
      if (isSplash) return null;
      
      // If not logged in and not on login page, redirect to login
      if (!isLoggedIn && !isLogin) return '/login';
      
      // If logged in and on login page, redirect to dashboard
      if (isLoggedIn && isLogin) return '/dashboard';
      
      return null;
    },
    routes: [
      // Splash
      GoRoute(
        path: '/splash',
        name: 'splash',
        builder: (context, state) => const SplashScreen(),
      ),
      
      // Auth
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),
      
      // Dashboard
      GoRoute(
        path: '/dashboard',
        name: 'dashboard',
        builder: (context, state) => const DashboardScreen(),
      ),
      
      // Orders
      GoRoute(
        path: '/orders',
        name: 'orders',
        builder: (context, state) => const OrderListScreen(),
        routes: [
          GoRoute(
            path: 'new',
            name: 'order-new',
            builder: (context, state) => const OrderFormScreen(),
          ),
          GoRoute(
            path: ':id',
            name: 'order-detail',
            builder: (context, state) {
              final id = state.pathParameters['id']!;
              return OrderDetailScreen(orderId: id);
            },
          ),
          GoRoute(
            path: ':id/edit',
            name: 'order-edit',
            builder: (context, state) {
              final id = state.pathParameters['id']!;
              return OrderFormScreen(orderId: id);
            },
          ),
        ],
      ),
      
      // Clients
      GoRoute(
        path: '/clients',
        name: 'clients',
        builder: (context, state) => const ClientListScreen(),
        routes: [
          GoRoute(
            path: 'new',
            name: 'client-new',
            builder: (context, state) => const ClientFormScreen(),
          ),
          GoRoute(
            path: ':id/edit',
            name: 'client-edit',
            builder: (context, state) {
              final id = state.pathParameters['id']!;
              return ClientFormScreen(clientId: id);
            },
          ),
        ],
      ),
      
      // Payments
      GoRoute(
        path: '/payments',
        name: 'payments',
        builder: (context, state) => const PaymentScreen(),
      ),
      
      // Profile
      GoRoute(
        path: '/profile',
        name: 'profile',
        builder: (context, state) => const ProfileScreen(),
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              'Page non trouvée',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              state.uri.toString(),
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go('/dashboard'),
              child: const Text('Retour au tableau de bord'),
            ),
          ],
        ),
      ),
    ),
  );
});
