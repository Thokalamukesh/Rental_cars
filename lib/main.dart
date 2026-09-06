import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'core/routing/app_router.dart';
import 'core/theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  await Supabase.initialize(
    url: 'https://zyieqcoyprplbzshohfd.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5aWVxY295cHJwbGJ6c2hvaGZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2NzI5NzQsImV4cCI6MjEwNDI0ODk3NH0.7qPLNdoP85GaIJByMyIRoQZmzMvtqhRXVetv4Fxno9Q',
  );

  runApp(
    const ProviderScope(
      child: SelfDriveCarApp(),
    ),
  );
}

class SelfDriveCarApp extends StatelessWidget {
  const SelfDriveCarApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'DriveNow',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.light, // Change to system or dark later
      routerConfig: goRouter,
      debugShowCheckedModeBanner: false,
    );
  }
}
