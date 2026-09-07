import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';

final myBookingsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final supabase = Supabase.instance.client;
  final user = supabase.auth.currentUser;
  
  if (user == null) return [];

  final response = await supabase
      .from('bookings')
      .select('*, cars:cars(brand, model, images), shop:users!bookings_shop_id_fkey(shop_name, mobile_number, full_name)')
      .eq('customer_id', user.id)
      .order('created_at', ascending: false);
      
  return List<Map<String, dynamic>>.from(response);
});

class MyBookingsScreen extends ConsumerWidget {
  const MyBookingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingsAsyncValue = ref.watch(myBookingsProvider);
    final user = Supabase.instance.client.auth.currentUser;

    if (user == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('My Bookings')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Text('Please login to view your bookings.', style: TextStyle(fontSize: 16)),
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

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text('My Bookings', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: bookingsAsyncValue.when(
        data: (bookings) {
          if (bookings.isEmpty) {
            return const Center(
              child: Text(
                'You have no bookings yet.',
                style: TextStyle(color: Colors.grey, fontSize: 16),
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => ref.refresh(myBookingsProvider.future),
            color: const Color(0xFF4F46E5),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: bookings.length,
              itemBuilder: (context, index) {
                final booking = bookings[index];
                final car = booking['cars'] ?? {};
                final shop = booking['shop'] ?? {};
                final status = booking['status'] ?? 'UNKNOWN';
                
                Color statusColor;
                if (status == 'APPROVED') { statusColor = Colors.green; }
                else if (status == 'REJECTED') { statusColor = Colors.red; }
                else if (status == 'COMPLETED') { statusColor = Colors.grey; }
                else { statusColor = Colors.orange; }

                return Card(
                  elevation: 2,
                  margin: const EdgeInsets.only(bottom: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
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
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: statusColor.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                status,
                                style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 12),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Dates: ${DateTime.parse(booking['start_date']).toLocal().toString().split(' ')[0]} to ${DateTime.parse(booking['end_date']).toLocal().toString().split(' ')[0]}',
                          style: TextStyle(color: Colors.grey[600]),
                        ),
                        const SizedBox(height: 4),
                        Text('Total: \$${booking['total_price']}', style: const TextStyle(fontWeight: FontWeight.bold)),
                        const Divider(height: 24),
                        Row(
                          children: [
                            const Icon(Icons.storefront, size: 16, color: Colors.grey),
                            const SizedBox(width: 4),
                            Text(shop['shop_name'] ?? 'System Shop', style: const TextStyle(fontWeight: FontWeight.w500)),
                          ],
                        ),
                        if (status == 'APPROVED' && shop['mobile_number'] != null) ...[
                          const SizedBox(height: 12),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.indigo[50],
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.phone, color: Color(0xFF4F46E5)),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('Contact Shop to Pick Up', style: TextStyle(fontSize: 12, color: Colors.indigo)),
                                      Text(shop['mobile_number'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ] else if (status == 'PENDING') ...[
                          const SizedBox(height: 12),
                          const Text('Waiting for shop admin to review your KYC and approve.', style: TextStyle(color: Colors.orange, fontSize: 12, fontStyle: FontStyle.italic)),
                        ]
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator(color: Color(0xFF4F46E5))),
        error: (error, stack) => Center(child: Text('Error: $error')),
      ),
    );
  }
}
