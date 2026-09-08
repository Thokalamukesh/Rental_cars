import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';

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

final hostRequestProvider = FutureProvider<Map<String, dynamic>?>((ref) async {
  final supabase = Supabase.instance.client;
  final user = supabase.auth.currentUser;
  
  if (user == null) return null;

  final response = await supabase
      .from('host_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', ascending: false)
      .limit(1)
      .maybeSingle();
      
  return response;
});

class HostDashboardScreen extends ConsumerWidget {
  const HostDashboardScreen({super.key});

  Future<void> _applyToHost(BuildContext context, WidgetRef ref) async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) return;
      
      await Supabase.instance.client.from('host_requests').insert({
        'user_id': user.id,
        'status': 'PENDING'
      });
      
      ref.invalidate(hostRequestProvider);
      
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Hosting request submitted successfully!'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to submit: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = Supabase.instance.client.auth.currentUser;

    if (user == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Host Dashboard')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('Please login to view host dashboard.', style: TextStyle(fontSize: 16)),
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

    final hostedCarsAsync = ref.watch(hostCarsProvider);
    final requestAsync = ref.watch(hostRequestProvider);

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('Host Dashboard', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: hostedCarsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFF4F46E5))),
        error: (err, stack) => Center(child: Text('Error: $err')),
        data: (cars) {
          final isHost = cars.isNotEmpty;
          
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (!isHost) ...[
                // Ad Banner for becoming a host
                requestAsync.when(
                  loading: () => const CircularProgressIndicator(),
                  error: (err, stack) => Text('Error: $err'),
                  data: (request) {
                    final status = request?['status'];
                    
                    if (status == 'PENDING') {
                      return _buildStatusBanner(
                        title: 'Application Under Review',
                        description: 'Your request to become a host is currently being reviewed by an admin. Please wait.',
                        icon: Icons.hourglass_empty,
                        colors: [Colors.orange[400]!, Colors.orange[600]!]
                      );
                    } else if (status == 'REJECTED') {
                      return _buildStatusBanner(
                        title: 'Application Rejected',
                        description: 'Unfortunately, your request was rejected. Contact support for details.',
                        icon: Icons.cancel,
                        colors: [Colors.red[400]!, Colors.red[600]!]
                      );
                    } else if (status == 'APPROVED') {
                       return _buildStatusBanner(
                        title: 'Application Approved!',
                        description: 'You are a shop admin now! Please upload a car from the admin dashboard.',
                        icon: Icons.check_circle,
                        colors: [Colors.green[400]!, Colors.green[600]!]
                      );
                    }
                    
                    return Container(
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
                            onPressed: () => _applyToHost(context, ref),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: const Color(0xFF4F46E5),
                              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                            ),
                            child: const Text('Apply to Host', style: TextStyle(fontWeight: FontWeight.bold)),
                          ),
                          const SizedBox(height: 16),
                          Row(
                            children: const [
                              Icon(Icons.support_agent, color: Colors.white70, size: 16),
                              SizedBox(width: 8),
                              Text('Contact Us: 8341257923', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                            ],
                          )
                        ],
                      ),
                    );
                  }
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
                              _HostStat(title: 'Earnings', value: '₹$totalEarned', isMoney: true),
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
  
  Widget _buildStatusBanner({required String title, required String description, required IconData icon, required List<Color> colors}) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: colors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Icon(icon, color: Colors.white, size: 48),
          const SizedBox(height: 16),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            description,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white, fontSize: 16),
          ),
        ],
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
