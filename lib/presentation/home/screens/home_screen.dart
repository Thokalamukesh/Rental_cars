import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:selfdrive_cars/presentation/booking/screens/booking_flow_screen.dart';

// Available Cities
const List<String> availableCities = [
  'All Cities',
  'New York',
  'Los Angeles',
  'Chicago',
  'Houston',
  'Miami',
];

// Notifier for selected city
class CityNotifier extends Notifier<String> {
  @override
  String build() => 'All Cities';

  void setCity(String city) {
    state = city;
  }
}

final selectedCityProvider = NotifierProvider<CityNotifier, String>(
  CityNotifier.new,
);

// Notifier for search query
class SearchQueryNotifier extends Notifier<String> {
  @override
  String build() => '';

  void setQuery(String query) {
    state = query;
  }
}

final searchQueryProvider = NotifierProvider<SearchQueryNotifier, String>(
  SearchQueryNotifier.new,
);

final carsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final supabase = Supabase.instance.client;
  final selectedCity = ref.watch(selectedCityProvider);

  var query = supabase.from('cars').select('*, users(shop_name)');

  if (selectedCity != 'All Cities') {
    query = query.eq('city', selectedCity);
  }

  final response = await query.order('created_at', ascending: false);

  var cars = List<Map<String, dynamic>>.from(response);

  return cars;
});

// A computed provider that handles the local search filtering instantly
final filteredCarsProvider = Provider<AsyncValue<List<Map<String, dynamic>>>>((
  ref,
) {
  final carsAsync = ref.watch(carsProvider);
  final searchQuery = ref.watch(searchQueryProvider).toLowerCase();

  return carsAsync.whenData((cars) {
    if (searchQuery.isEmpty) return cars;

    return cars.where((car) {
      final loc = (car['location_name'] ?? car['city'] ?? '')
          .toString()
          .toLowerCase();
      final brand = (car['brand'] ?? '').toString().toLowerCase();
      final model = (car['model'] ?? '').toString().toLowerCase();
      return loc.contains(searchQuery) ||
          brand.contains(searchQuery) ||
          model.contains(searchQuery);
    }).toList();
  });
});

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filteredCarsAsyncValue = ref.watch(filteredCarsProvider);
    final selectedCity = ref.watch(selectedCityProvider);
    final currentSearchQuery = ref.watch(searchQueryProvider);

    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text(
          'DriveNow',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        actions: [
          // City Selector Dropdown
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: selectedCity,
                icon: const Icon(Icons.location_on, color: Color(0xFF4F46E5)),
                style: const TextStyle(
                  color: Color(0xFF4F46E5),
                  fontWeight: FontWeight.bold,
                ),
                onChanged: (String? newValue) {
                  if (newValue != null) {
                    ref.read(selectedCityProvider.notifier).setCity(newValue);
                  }
                },
                items: availableCities.map<DropdownMenuItem<String>>((
                  String value,
                ) {
                  return DropdownMenuItem<String>(
                    value: value,
                    child: Text(value),
                  );
                }).toList(),
              ),
            ),
          ),
        ],
      ),
      body: filteredCarsAsyncValue.when(
        data: (cars) {
          if (cars.isEmpty) {
            return Center(
              child: Text(
                'No cars available in $selectedCity right now.\nCheck back later!',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.grey, fontSize: 16),
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => ref.refresh(carsProvider.future),
            color: const Color(0xFF4F46E5),
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16.0,
                    vertical: 8.0,
                  ),
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.05),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: TextField(
                      onChanged: (value) => ref
                          .read(searchQueryProvider.notifier)
                          .setQuery(value),
                      decoration: InputDecoration(
                        prefixIcon: const Icon(
                          Icons.search,
                          color: Color(0xFF4F46E5),
                        ),
                        suffixIcon: currentSearchQuery.isNotEmpty
                            ? IconButton(
                                icon: const Icon(
                                  Icons.clear,
                                  color: Colors.grey,
                                ),
                                onPressed: () {
                                  ref
                                      .read(searchQueryProvider.notifier)
                                      .setQuery('');
                                },
                              )
                            : null,
                        hintText: 'Search brand, model, or location...',
                        hintStyle: TextStyle(color: Colors.grey[400]),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide.none,
                        ),
                        filled: true,
                        fillColor: Colors.white,
                        contentPadding: const EdgeInsets.symmetric(
                          vertical: 16,
                        ),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.only(
                      left: 16,
                      right: 16,
                      bottom: 16,
                    ),
                    itemCount: cars.length,
                    itemBuilder: (context, index) {
                      final car = cars[index];
                      final images = car['images'] as List<dynamic>? ?? [];
                      final shop = car['users'] != null
                          ? car['users']['shop_name']
                          : 'DriveNow';
                      final isAvailable =
                          car['availability_status'] == 'AVAILABLE';

                      return Opacity(
                        opacity: isAvailable ? 1.0 : 0.6,
                        child: Card(
                          elevation: 2,
                          margin: const EdgeInsets.only(bottom: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Car Image
                              Stack(
                                children: [
                                  Container(
                                    height: 200,
                                    width: double.infinity,
                                    color: Colors.grey[200],
                                    child: images.isNotEmpty
                                        ? Image.network(
                                            images[0],
                                            fit: BoxFit.cover,
                                          )
                                        : const Center(
                                            child: Icon(
                                              Icons.directions_car,
                                              size: 64,
                                              color: Colors.grey,
                                            ),
                                          ),
                                  ),
                                  if (!isAvailable)
                                    Positioned(
                                      top: 16,
                                      right: 16,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 12,
                                          vertical: 6,
                                        ),
                                        decoration: BoxDecoration(
                                          color: Colors.black87,
                                          borderRadius: BorderRadius.circular(
                                            20,
                                          ),
                                        ),
                                        child: const Text(
                                          'UNAVAILABLE',
                                          style: TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 12,
                                          ),
                                        ),
                                      ),
                                    ),
                                ],
                              ),

                              // Car Details
                              Padding(
                                padding: const EdgeInsets.all(16),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Expanded(
                                          child: Text(
                                            '${car['brand']} ${car['model']}',
                                            style: const TextStyle(
                                              fontSize: 20,
                                              fontWeight: FontWeight.bold,
                                            ),
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 8,
                                            vertical: 4,
                                          ),
                                          decoration: BoxDecoration(
                                            color: isAvailable
                                                ? Colors.green[50]
                                                : Colors.grey[100],
                                            borderRadius: BorderRadius.circular(
                                              8,
                                            ),
                                          ),
                                          child: Text(
                                            '\$${car['price_per_day']}/day',
                                            style: TextStyle(
                                              color: isAvailable
                                                  ? Colors.green
                                                  : Colors.grey,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),

                                    // Specs
                                    Row(
                                      children: [
                                        _SpecBadge(
                                          icon: Icons.settings,
                                          text: car['transmission'],
                                        ),
                                        const SizedBox(width: 12),
                                        _SpecBadge(
                                          icon: Icons.local_gas_station,
                                          text: car['fuel_type'],
                                        ),
                                        const SizedBox(width: 12),
                                        _SpecBadge(
                                          icon: Icons.event_seat,
                                          text: '${car['seats']} Seats',
                                        ),
                                      ],
                                    ),

                                    const SizedBox(height: 16),
                                    const Divider(height: 1),
                                    const SizedBox(height: 12),

                                    // Shop & Book Button
                                    Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Row(
                                          children: [
                                            const Icon(
                                              Icons.storefront,
                                              size: 16,
                                              color: Colors.grey,
                                            ),
                                            const SizedBox(width: 4),
                                            Text(
                                              shop ?? 'System',
                                              style: const TextStyle(
                                                color: Colors.grey,
                                                fontWeight: FontWeight.w500,
                                              ),
                                            ),
                                          ],
                                        ),
                                        ElevatedButton(
                                          onPressed: () {
                                            if (!isAvailable) {
                                              ScaffoldMessenger.of(
                                                context,
                                              ).showSnackBar(
                                                SnackBar(
                                                  content: const Text(
                                                    'This car is currently unavailable. We will notify you when it is back in stock.',
                                                  ),
                                                  backgroundColor:
                                                      Colors.orange[800],
                                                  behavior:
                                                      SnackBarBehavior.floating,
                                                  shape: RoundedRectangleBorder(
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                          10,
                                                        ),
                                                  ),
                                                ),
                                              );
                                            } else {
                                              Navigator.push(
                                                context,
                                                MaterialPageRoute(
                                                  builder: (context) =>
                                                      BookingFlowScreen(
                                                        car: car,
                                                      ),
                                                ),
                                              );
                                            }
                                          },
                                          style: ElevatedButton.styleFrom(
                                            backgroundColor: isAvailable
                                                ? const Color(0xFF4F46E5)
                                                : Colors.grey[400],
                                            foregroundColor: Colors.white,
                                            shape: RoundedRectangleBorder(
                                              borderRadius:
                                                  BorderRadius.circular(8),
                                            ),
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 24,
                                              vertical: 12,
                                            ),
                                          ),
                                          child: Text(
                                            isAvailable
                                                ? 'Book Now'
                                                : 'Notify Me',
                                            style: const TextStyle(
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(color: Color(0xFF4F46E5)),
        ),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, color: Colors.red, size: 48),
              const SizedBox(height: 16),
              Text('Error loading cars: $error'),
              TextButton(
                onPressed: () => ref.refresh(carsProvider.future),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SpecBadge extends StatelessWidget {
  final IconData icon;
  final String text;

  const _SpecBadge({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 14, color: Colors.grey[600]),
        const SizedBox(width: 4),
        Text(
          text,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
