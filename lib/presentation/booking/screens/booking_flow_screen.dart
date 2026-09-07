import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:go_router/go_router.dart';

class BookingFlowScreen extends StatefulWidget {
  final Map<String, dynamic> car;

  const BookingFlowScreen({super.key, required this.car});

  @override
  State<BookingFlowScreen> createState() => _BookingFlowScreenState();
}

class _BookingFlowScreenState extends State<BookingFlowScreen> {
  int _currentStep = 0;
  
  // Booking Details
  DateTime? _startDate;
  DateTime? _endDate;
  double _totalPrice = 0.0;
  
  // KYC Details
  XFile? _licenseImage;
  bool _isUploading = false;
  
  final supabase = Supabase.instance.client;

  void _calculatePrice() {
    if (_startDate != null && _endDate != null) {
      final days = _endDate!.difference(_startDate!).inDays;
      final pricePerDay = (widget.car['price_per_day'] as num).toDouble();
      setState(() {
        // Minimum 1 day charge
        _totalPrice = (days == 0 ? 1 : days) * pricePerDay;
      });
    }
  }

  Future<void> _pickDateRange() async {
    final now = DateTime.now();
    final picked = await showDateRangePicker(
      context: context,
      firstDate: now,
      lastDate: now.add(const Duration(days: 365)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: Color(0xFF4F46E5), // Indigo
              onPrimary: Colors.white,
              onSurface: Colors.black,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked != null) {
      setState(() {
        _startDate = picked.start;
        _endDate = picked.end;
      });
      _calculatePrice();
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    
    if (pickedFile != null) {
      setState(() {
        _licenseImage = pickedFile;
      });
    }
  }

  Future<void> _submitBooking() async {
    if (_startDate == null || _endDate == null || _licenseImage == null) return;
    
    setState(() {
      _isUploading = true;
    });

    try {
      final user = supabase.auth.currentUser;
      if (user == null) throw Exception("Please login to book a car.");

      // 1. Upload KYC Image
      final fileExt = _licenseImage!.path.split('.').last;
      final fileName = '${DateTime.now().toIso8601String()}.$fileExt';
      final bytes = await _licenseImage!.readAsBytes();
      await supabase.storage.from('kyc').uploadBinary(fileName, bytes);
      final imageUrl = supabase.storage.from('kyc').getPublicUrl(fileName);

      // 2. Save KYC Document
      await supabase.from('kyc_documents').insert({
        'user_id': user.id,
        'license_image_url': imageUrl,
        'status': 'PENDING'
      });

      // 3. Save Booking
      await supabase.from('bookings').insert({
        'car_id': widget.car['id'],
        'customer_id': user.id,
        'shop_id': widget.car['shop_id'],
        'start_date': _startDate!.toIso8601String(),
        'end_date': _endDate!.toIso8601String(),
        'total_price': _totalPrice,
        'status': 'PENDING'
      });

      if (!mounted) return;
      
      // Show Success Dialog
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Icon(Icons.check_circle, color: Colors.green, size: 64),
          content: const Text(
            'Booking Request Sent!\n\nThe shop admin will review your KYC and approve your booking shortly.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 16),
          ),
          actions: [
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF4F46E5),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                onPressed: () {
                  Navigator.of(ctx).pop(); // Close dialog
                  context.go('/bookings'); // Go to My Bookings
                },
                child: const Text('Back to Home', style: TextStyle(color: Colors.white)),
              ),
            )
          ],
        ),
      );

    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Booking failed: $e'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isUploading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Book Car', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: Stepper(
        type: StepperType.horizontal,
        currentStep: _currentStep,
        onStepContinue: () {
          if (_currentStep == 0 && _startDate == null) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Please select dates to continue')),
            );
            return;
          }
          if (_currentStep == 1 && _licenseImage == null) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Please upload your license')),
            );
            return;
          }
          
          if (_currentStep < 2) {
            setState(() {
              _currentStep += 1;
            });
          } else {
            _submitBooking();
          }
        },
        onStepCancel: () {
          if (_currentStep > 0) {
            setState(() {
              _currentStep -= 1;
            });
          }
        },
        controlsBuilder: (context, details) {
          final isLastStep = _currentStep == 2;
          return Padding(
            padding: const EdgeInsets.only(top: 32.0),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isUploading ? null : details.onStepContinue,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF4F46E5),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: _isUploading 
                      ? const CircularProgressIndicator(color: Colors.white)
                      : Text(
                          isLastStep ? 'Confirm & Book' : 'Next',
                          style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                  ),
                ),
                if (_currentStep > 0) ...[
                  const SizedBox(width: 16),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _isUploading ? null : details.onStepCancel,
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        side: const BorderSide(color: Colors.grey),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Back', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ]
              ],
            ),
          );
        },
        steps: [
          // Step 1: Dates
          Step(
            title: const Text('Dates'),
            isActive: _currentStep >= 0,
            state: _currentStep > 0 ? StepState.complete : StepState.indexed,
            content: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.grey[50],
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey[200]!),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.directions_car, color: Color(0xFF4F46E5)),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${widget.car['brand']} ${widget.car['model']}',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                            ),
                            Text('\$${widget.car['price_per_day']} / day', style: TextStyle(color: Colors.grey[600])),
                          ],
                        ),
                      )
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                const Text('Select Rental Period', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 8),
                InkWell(
                  onTap: _pickDateRange,
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      border: Border.all(color: const Color(0xFF4F46E5), width: 2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.calendar_month, color: Color(0xFF4F46E5)),
                            const SizedBox(width: 12),
                            Text(
                              _startDate != null 
                                ? '${_startDate!.toLocal().toString().split(' ')[0]} to ${_endDate!.toLocal().toString().split(' ')[0]}'
                                : 'Tap to select dates',
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        if (_startDate != null)
                          const Icon(Icons.check_circle, color: Colors.green),
                      ],
                    ),
                  ),
                ),
                if (_totalPrice > 0) ...[
                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.green[50],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total Estimated Price', style: TextStyle(fontWeight: FontWeight.bold)),
                        Text('\$$_totalPrice', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green, fontSize: 20)),
                      ],
                    ),
                  ),
                ]
              ],
            ),
          ),
          
          // Step 2: KYC
          Step(
            title: const Text('KYC'),
            isActive: _currentStep >= 1,
            state: _currentStep > 1 ? StepState.complete : StepState.indexed,
            content: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Upload Driver\'s License', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                const SizedBox(height: 8),
                const Text(
                  'We need a valid ID to verify your identity before the shop owner can approve your rental.',
                  style: TextStyle(color: Colors.grey),
                ),
                const SizedBox(height: 24),
                InkWell(
                  onTap: _pickImage,
                  child: Container(
                    height: 200,
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: Colors.grey[50],
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey[300]!, style: BorderStyle.solid, width: 2),
                    ),
                    child: _licenseImage != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: kIsWeb 
                            ? Image.network(_licenseImage!.path, fit: BoxFit.cover) 
                            : Image.file(File(_licenseImage!.path), fit: BoxFit.cover),
                        )
                      : Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.cloud_upload, size: 48, color: Colors.grey),
                            const SizedBox(height: 16),
                            Text('Tap to upload photo', style: TextStyle(color: Colors.grey[600], fontWeight: FontWeight.bold)),
                          ],
                        ),
                  ),
                ),
              ],
            ),
          ),
          
          // Step 3: Review
          Step(
            title: const Text('Review'),
            isActive: _currentStep >= 2,
            content: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Review Booking', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                const SizedBox(height: 24),
                _ReviewRow(title: 'Car', value: '${widget.car['brand']} ${widget.car['model']}'),
                const Divider(),
                if (_startDate != null)
                  _ReviewRow(
                    title: 'Dates', 
                    value: '${_startDate!.toLocal().toString().split(' ')[0]} to ${_endDate!.toLocal().toString().split(' ')[0]}'
                  ),
                const Divider(),
                _ReviewRow(title: 'KYC Document', value: _licenseImage != null ? 'Attached ✅' : 'Missing ❌'),
                const Divider(),
                _ReviewRow(title: 'Total Amount', value: '\$$_totalPrice', isTotal: true),
                
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.amber[50],
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.amber[200]!),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.info_outline, color: Colors.amber),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Payment will be collected at the shop after your KYC and booking is approved.',
                          style: TextStyle(color: Colors.black87),
                        ),
                      )
                    ],
                  ),
                )
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ReviewRow extends StatelessWidget {
  final String title;
  final String value;
  final bool isTotal;

  const _ReviewRow({required this.title, required this.value, this.isTotal = false});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: TextStyle(color: Colors.grey[600], fontSize: isTotal ? 16 : 14)),
          Text(
            value, 
            style: TextStyle(
              fontWeight: FontWeight.bold, 
              fontSize: isTotal ? 20 : 14,
              color: isTotal ? Colors.green : Colors.black87
            ),
          ),
        ],
      ),
    );
  }
}
