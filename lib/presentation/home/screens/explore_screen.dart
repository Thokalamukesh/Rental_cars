import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';
import '../../booking/screens/booking_flow_screen.dart';

class ExploreScreen extends StatefulWidget {
  const ExploreScreen({super.key});

  @override
  State<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends State<ExploreScreen> {
  final supabase = Supabase.instance.client;
  List<dynamic> _allCars = [];
  List<dynamic> _filteredCars = [];
  bool _isLoading = true;
  String _searchQuery = '';

  // Center on India/default location
  final LatLng _initialCenter = const LatLng(17.3850, 78.4867); // Hyderabad as default

  @override
  void initState() {
    super.initState();
    _fetchCars();
  }

  Future<void> _fetchCars() async {
    try {
      final response = await supabase
          .from('cars')
          .select('*, shop:users!cars_shop_id_fkey(shop_name)')
          .eq('availability_status', 'AVAILABLE');
      
      if (mounted) {
        setState(() {
          _allCars = response;
          _filterCars();
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load cars: $e')),
        );
      }
    }
  }

  void _filterCars() {
    if (_searchQuery.isEmpty) {
      _filteredCars = List.from(_allCars);
    } else {
      final query = _searchQuery.toLowerCase();
      _filteredCars = _allCars.where((car) {
        final loc = (car['location_name'] ?? car['city'] ?? '').toString().toLowerCase();
        final brand = (car['brand'] ?? '').toString().toLowerCase();
        final model = (car['model'] ?? '').toString().toLowerCase();
        return loc.contains(query) || brand.contains(query) || model.contains(query);
      }).toList();
    }
  }

  void _updateSearch(String query) {
    setState(() {
      _searchQuery = query;
      _filterCars();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // Top Half: Map
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: MediaQuery.of(context).size.height * 0.55,
            child: FlutterMap(
              options: MapOptions(
                initialCenter: _initialCenter,
                initialZoom: 12.0,
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                  userAgentPackageName: 'com.drivenow.app',
                ),
                MarkerLayer(
                  markers: _filteredCars.map((car) {
                    final lat = car['latitude'] as double?;
                    final lng = car['longitude'] as double?;
                    
                    // Fallback to offset if null
                    final defaultLat = _initialCenter.latitude + ((car.hashCode % 100 - 50) / 1000.0);
                    final defaultLng = _initialCenter.longitude + (((car.hashCode ~/ 100) % 100 - 50) / 1000.0);
                    
                    return Marker(
                      point: LatLng(lat ?? defaultLat, lng ?? defaultLng),
                      width: 120, // Wider to accommodate the card
                      height: 100,
                      child: GestureDetector(
                        onTap: () {
                          // Scroll to car in list or open booking flow
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => BookingFlowScreen(car: car),
                            ),
                          );
                        },
                        child: Column(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(8),
                                boxShadow: [
                                  BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 4, offset: const Offset(0, 2))
                                ],
                              ),
                              child: Text(
                                '₹${car['price_per_day']}/day',
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF4F46E5)),
                              ),
                            ),
                            const Icon(
                              Icons.location_on,
                              color: Color(0xFF4F46E5),
                              size: 40,
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
          
          // Header / Search Bar overlay
          Positioned(
            top: MediaQuery.of(context).padding.top + 16,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(30),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10, offset: const Offset(0, 4)),
                ],
              ),
              child: TextField(
                onChanged: _updateSearch,
                decoration: const InputDecoration(
                  icon: Icon(Icons.search, color: Colors.grey),
                  hintText: 'Search locations in India...',
                  border: InputBorder.none,
                ),
              ),
            ),
          ),

          // Bottom Half: Draggable Sheet with Cars
          DraggableScrollableSheet(
            initialChildSize: 0.5, // 50% of screen
            minChildSize: 0.45,
            maxChildSize: 0.9,
            builder: (context, scrollController) {
              return Container(
                decoration: const BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(24),
                    topRight: Radius.circular(24),
                  ),
                  boxShadow: [
                    BoxShadow(color: Colors.black12, blurRadius: 10, spreadRadius: 2),
                  ],
                ),
                child: Column(
                  children: [
                    // Handle bar
                    Center(
                      child: Container(
                        margin: const EdgeInsets.only(top: 12, bottom: 16),
                        width: 40,
                        height: 5,
                        decoration: BoxDecoration(
                          color: Colors.grey[300],
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                    
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Available Nearby',
                            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                          ),
                          Text(
                            '${_filteredCars.length} found',
                            style: const TextStyle(color: Color(0xFF4F46E5), fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                    const Divider(),
                    
                    Expanded(
                      child: _isLoading
                          ? const Center(child: CircularProgressIndicator(color: Color(0xFF4F46E5)))
                          : _filteredCars.isEmpty
                              ? const Center(child: Text('No cars available right now.', style: TextStyle(color: Colors.grey)))
                              : ListView.builder(
                                  controller: scrollController,
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  itemCount: _filteredCars.length,
                                  itemBuilder: (context, index) {
                                    final car = _filteredCars[index];
                                    final images = List<String>.from(car['images'] ?? []);
                                    final imageUrl = images.isNotEmpty ? images.first : null;
                                    
                                    return InkWell(
                                      onTap: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) => BookingFlowScreen(car: car),
                                          ),
                                        );
                                      },
                                      child: Container(
                                        margin: const EdgeInsets.only(bottom: 16),
                                        padding: const EdgeInsets.all(12),
                                        decoration: BoxDecoration(
                                          border: Border.all(color: Colors.grey[200]!),
                                          borderRadius: BorderRadius.circular(16),
                                        ),
                                        child: Row(
                                          children: [
                                            // Car Image
                                            ClipRRect(
                                              borderRadius: BorderRadius.circular(12),
                                              child: Container(
                                                width: 100,
                                                height: 80,
                                                color: Colors.grey[100],
                                                child: imageUrl != null
                                                    ? Image.network(imageUrl, fit: BoxFit.cover)
                                                    : const Icon(Icons.directions_car, size: 40, color: Colors.grey),
                                              ),
                                            ),
                                            const SizedBox(width: 16),
                                            
                                            // Details
                                            Expanded(
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    '${car['brand']} ${car['model']}',
                                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                                  ),
                                                  const SizedBox(height: 4),
                                                  Row(
                                                    children: [
                                                      Icon(Icons.local_gas_station, size: 14, color: Colors.grey[600]),
                                                      const SizedBox(width: 4),
                                                      Text('${car['fuel_type']}', style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                                                      const SizedBox(width: 12),
                                                      Icon(Icons.settings, size: 14, color: Colors.grey[600]),
                                                      const SizedBox(width: 4),
                                                      Text('${car['transmission']}', style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                                                    ],
                                                  ),
                                                  const SizedBox(height: 8),
                                                  Row(
                                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                    children: [
                                                      Text(
                                                        '₹${car['price_per_day']}/day',
                                                        style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF4F46E5), fontSize: 15),
                                                      ),
                                                      ElevatedButton(
                                                        onPressed: () {
                                                          Navigator.push(
                                                            context,
                                                            MaterialPageRoute(
                                                              builder: (context) => BookingFlowScreen(car: car),
                                                            ),
                                                          );
                                                        },
                                                        style: ElevatedButton.styleFrom(
                                                          backgroundColor: const Color(0xFF4F46E5),
                                                          foregroundColor: Colors.white,
                                                          minimumSize: const Size(60, 32),
                                                          padding: const EdgeInsets.symmetric(horizontal: 12),
                                                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                                        ),
                                                        child: const Text('Book'),
                                                      )
                                                    ],
                                                  )
                                                ],
                                              ),
                                            )
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
          ),
        ],
      ),
    );
  }
}
