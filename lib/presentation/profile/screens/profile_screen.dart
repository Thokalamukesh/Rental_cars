import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final hostCarsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final supabase = Supabase.instance.client;
  final user = supabase.auth.currentUser;
  
  if (user == null) return [];

  final response = await supabase
      .from('cars')
      .select('*, bookings(id, status, total_price)')
      .eq('shop_id', user.id);
      
  return List<Map<String, dynamic>>.from(response);
});

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  Future<void> _signOut(BuildContext context) async {
    await Supabase.instance.client.auth.signOut();
    if (context.mounted) {
      context.go('/auth');
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = Supabase.instance.client.auth.currentUser;

    if (user == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Profile & Hosting')),
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

    final hostedCarsAsync = ref.watch(hostCarsProvider);

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Profile & Hosting', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.red),
            onPressed: () => _signOut(context),
            tooltip: 'Sign Out',
          ),
        ],
      ),
      body: hostedCarsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFF4F46E5))),
        error: (err, stack) => Center(child: Text('Error: $err')),
        data: (cars) {
          final isHost = cars.isNotEmpty;
          
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // User Info Card
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
              
              const SizedBox(height: 24),
              const Text('Hosting Dashboard', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              
              if (!isHost) ...[
                // Ad Banner for becoming a host
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.directions_car, color: Colors.white, size: 48),
                      const SizedBox(height: 16),
                      const Text(
                        'Want to host your car?',
                        style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Turn your idle car into extra income. List your car on DriveNow today!',
                        style: TextStyle(color: Colors.white70, fontSize: 16),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () {
                          // Simple action for contact us
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Contact support@drivenow.app to become a host!')),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: const Color(0xFF4F46E5),
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                        ),
                        child: const Text('Contact Us to Host', style: TextStyle(fontWeight: FontWeight.bold)),
                      )
                    ],
                  ),
                )
              ] else ...[
                // Host Stats
                ...cars.map((car) {
                  final bookings = List<Map<String, dynamic>>.from(car['bookings'] ?? []);
                  final completedBookings = bookings.where((b) => b['status'] == 'APPROVED' || b['status'] == 'COMPLETED').toList();
                  final totalEarned = completedBookings.fold(0.0, (sum, b) => sum + (b['total_price'] as num).toDouble());
                  
                  return Card(
                    margin: const EdgeInsets.only(bottom: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '${car['brand']} ${car['model']}',
                                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: car['availability_status'] == 'AVAILABLE' ? Colors.green[50] : Colors.red[50],
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  car['availability_status'],
                                  style: TextStyle(
                                    color: car['availability_status'] == 'AVAILABLE' ? Colors.green : Colors.red,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const Divider(height: 24),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              _HostStat(title: 'Total Bookings', value: '${bookings.length}'),
                              _HostStat(title: 'Approved', value: '${completedBookings.length}'),
                              _HostStat(title: 'Earnings', value: '\$$totalEarned', isMoney: true),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                }),
              ],
            ],
          );
        },
      ),
    );
  }
}

class _HostStat extends StatelessWidget {
  final String title;
  final String value;
  final bool isMoney;

  const _HostStat({required this.title, required this.value, this.isMoney = false});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(title, style: TextStyle(color: Colors.grey[600], fontSize: 12)),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 20, 
            fontWeight: FontWeight.bold, 
            color: isMoney ? Colors.green : Colors.black87
          ),
        ),
      ],
    );
  }
}
