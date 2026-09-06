import 'package:go_router/go_router.dart';
import 'package:flutter/material.dart';
import '../../presentation/auth/screens/splash_screen.dart';
import '../../presentation/auth/screens/auth_screen.dart';
import '../../presentation/home/screens/home_screen.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'root');
final GlobalKey<NavigatorState> _shellNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'shell');

final goRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const PlaceholderScreen(title: 'Login'),
    ),
    ShellRoute(
      navigatorKey: _shellNavigatorKey,
      builder: (context, state, child) {
        return ScaffoldWithBottomNavBar(child: child);
      },
      routes: [
        GoRoute(
          path: '/home',
          builder: (context, state) => const HomeScreen(),
        ),
        GoRoute(
          path: '/explore',
          builder: (context, state) => const PlaceholderScreen(title: 'Explore / Map'),
        ),
        GoRoute(
          path: '/bookings',
          builder: (context, state) => const PlaceholderScreen(title: 'My Bookings'),
        ),
        GoRoute(
          path: '/host',
          builder: (context, state) => const PlaceholderScreen(title: 'Host Dashboard'),
        ),
        GoRoute(
          path: '/profile',
          builder: (context, state) => const PlaceholderScreen(title: 'Profile'),
        ),
      ],
    ),
  ],
);

class ScaffoldWithBottomNavBar extends StatelessWidget {
  const ScaffoldWithBottomNavBar({
    required this.child,
    super.key,
  });
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _calculateSelectedIndex(context),
        onTap: (int idx) => _onItemTapped(idx, context),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), activeIcon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.explore_outlined), activeIcon: Icon(Icons.explore), label: 'Explore'),
          BottomNavigationBarItem(icon: Icon(Icons.directions_car_outlined), activeIcon: Icon(Icons.directions_car), label: 'Bookings'),
          BottomNavigationBarItem(icon: Icon(Icons.key_outlined), activeIcon: Icon(Icons.key), label: 'Host'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }

  static int _calculateSelectedIndex(BuildContext context) {
    final String location = GoRouterState.of(context).uri.path;
    if (location.startsWith('/home')) return 0;
    if (location.startsWith('/explore')) return 1;
    if (location.startsWith('/bookings')) return 2;
    if (location.startsWith('/host')) return 3;
    if (location.startsWith('/profile')) return 4;
    return 0;
  }

  void _onItemTapped(int index, BuildContext context) {
    switch (index) {
      case 0:
        GoRouter.of(context).go('/home');
        break;
      case 1:
        GoRouter.of(context).go('/explore');
        break;
      case 2:
        GoRouter.of(context).go('/bookings');
        break;
      case 3:
        GoRouter.of(context).go('/host');
        break;
      case 4:
        GoRouter.of(context).go('/profile');
        break;
    }
  }
}

class PlaceholderScreen extends StatelessWidget {
  final String title;
  const PlaceholderScreen({super.key, required this.title});
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(child: Text(title, style: Theme.of(context).textTheme.headlineMedium)),
    );
  }
}
