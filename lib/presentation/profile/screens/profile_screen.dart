import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  Future<void> _signOut(BuildContext context) async {
    await Supabase.instance.client.auth.signOut();
    if (context.mounted) {
      context.go('/auth');
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = Supabase.instance.client.auth.currentUser;

    if (user == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Profile')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('Please login to view your profile.', style: TextStyle(fontSize: 16)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => context.push('/auth'),
                child: const Text('Login / Register'),
              )
            ],
          ),
        ),
      );
    }

    final email = user.email ?? '';
    final phoneDisplay = email.endsWith('@drivenow.app') 
        ? email.replaceAll('@drivenow.app', '') 
        : email;

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Host / Profile Settings', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            elevation: 2,
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children: [
                  const CircleAvatar(
                    radius: 40,
                    backgroundColor: Color(0xFF4F46E5),
                    child: Icon(Icons.person, size: 40, color: Colors.white),
                  ),
                  const SizedBox(height: 16),
                  const Text('Logged In As', style: TextStyle(color: Colors.grey)),
                  const SizedBox(height: 4),
                  Text(
                    phoneDisplay,
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 32),
          ElevatedButton.icon(
            onPressed: () => _signOut(context),
            icon: const Icon(Icons.logout, color: Colors.red),
            label: const Text('Sign Out', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 16)),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red[50],
              padding: const EdgeInsets.symmetric(vertical: 16),
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          )
        ],
      ),
    );
  }
}
