import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

class AttachCarScreen extends StatefulWidget {
  const AttachCarScreen({super.key});

  @override
  State<AttachCarScreen> createState() => _AttachCarScreenState();
}

class _AttachCarScreenState extends State<AttachCarScreen> {
  final _formKey = GlobalKey<FormState>();
  final _brandController = TextEditingController();
  final _modelController = TextEditingController();
  final _yearController = TextEditingController();
  final _priceController = TextEditingController();
  final _seatsController = TextEditingController();
  final _locationController = TextEditingController();

  String _transmission = 'Automatic';
  String _fuelType = 'Petrol';

  File? _carImage;
  File? _rcDocument;
  File? _insuranceDocument;

  bool _isLoading = false;

  Future<void> _pickImage(String type) async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery, imageQuality: 70);
    
    if (pickedFile != null) {
      setState(() {
        if (type == 'car') _carImage = File(pickedFile.path);
        if (type == 'rc') _rcDocument = File(pickedFile.path);
        if (type == 'insurance') _insuranceDocument = File(pickedFile.path);
      });
    }
  }

  Future<String?> _uploadFile(File file, String bucket, String pathPrefix) async {
    try {
      final ext = file.path.split('.').last;
      final fileName = '$pathPrefix-${DateTime.now().millisecondsSinceEpoch}.$ext';
      final res = await Supabase.instance.client.storage.from(bucket).upload(fileName, file);
      
      return Supabase.instance.client.storage.from(bucket).getPublicUrl(fileName);
    } catch (e) {
      debugPrint("Error uploading file: $e");
      return null;
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_carImage == null || _rcDocument == null || _insuranceDocument == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please upload all required images/documents')));
      return;
    }

    setState(() { _isLoading = true; });

    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) throw Exception("Not logged in");

      // 1. Upload Images
      final carImageUrl = await _uploadFile(_carImage!, 'cars', 'car');
      final rcDocUrl = await _uploadFile(_rcDocument!, 'documents', 'rc');
      final insDocUrl = await _uploadFile(_insuranceDocument!, 'documents', 'ins');

      if (carImageUrl == null || rcDocUrl == null || insDocUrl == null) {
        throw Exception("Failed to upload images");
      }

      // 2. Insert into car_requests
      await Supabase.instance.client.from('car_requests').insert({
        'user_id': user.id,
        'brand': _brandController.text,
        'model': _modelController.text,
        'year': int.parse(_yearController.text),
        'transmission': _transmission,
        'fuel_type': _fuelType,
        'seats': int.parse(_seatsController.text),
        'price_per_day': double.parse(_priceController.text),
        'location_name': _locationController.text,
        'images': [carImageUrl],
        'rc_document_url': rcDocUrl,
        'insurance_document_url': insDocUrl,
        'status': 'PENDING'
      });

      setState(() { _isLoading = false; });
      
      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => AlertDialog(
            title: const Text('Success!'),
            content: const Text('Your car request has been submitted. An administrator will review your documents and approve your car shortly.'),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  context.pop();
                },
                child: const Text('OK'),
              )
            ],
          ),
        );
      }
    } catch (e) {
      setState(() { _isLoading = false; });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  Widget _buildImagePickerTile(String title, File? file, String type) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(file != null ? Icons.check_circle : Icons.upload_file, color: file != null ? Colors.green : Colors.grey),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
      subtitle: Text(file != null ? 'Selected' : 'Required'),
      trailing: OutlinedButton(
        onPressed: () => _pickImage(type),
        child: const Text('Upload'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Attach Your Car')),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator()) 
        : SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('Vehicle Information', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(child: TextFormField(controller: _brandController, decoration: const InputDecoration(labelText: 'Brand (e.g. Toyota)', border: OutlineInputBorder()), validator: (v) => v!.isEmpty ? 'Required' : null)),
                      const SizedBox(width: 16),
                      Expanded(child: TextFormField(controller: _modelController, decoration: const InputDecoration(labelText: 'Model (e.g. Camry)', border: OutlineInputBorder()), validator: (v) => v!.isEmpty ? 'Required' : null)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(child: TextFormField(controller: _yearController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Year (e.g. 2022)', border: OutlineInputBorder()), validator: (v) => v!.isEmpty ? 'Required' : null)),
                      const SizedBox(width: 16),
                      Expanded(child: TextFormField(controller: _seatsController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Seats', border: OutlineInputBorder()), validator: (v) => v!.isEmpty ? 'Required' : null)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _transmission,
                          decoration: const InputDecoration(labelText: 'Transmission', border: OutlineInputBorder()),
                          items: ['Automatic', 'Manual'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                          onChanged: (v) => setState(() => _transmission = v!),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _fuelType,
                          decoration: const InputDecoration(labelText: 'Fuel', border: OutlineInputBorder()),
                          items: ['Petrol', 'Diesel', 'EV', 'Hybrid'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                          onChanged: (v) => setState(() => _fuelType = v!),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _priceController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Price Per Day (\$)', border: OutlineInputBorder(), prefixIcon: Icon(Icons.attach_money)),
                    validator: (v) => v!.isEmpty ? 'Required' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _locationController,
                    decoration: const InputDecoration(labelText: 'Car Location Name (e.g. Downtown LA)', border: OutlineInputBorder(), prefixIcon: Icon(Icons.location_on)),
                    validator: (v) => v!.isEmpty ? 'Required' : null,
                  ),
                  
                  const SizedBox(height: 32),
                  const Text('Photos & Documents', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  
                  _buildImagePickerTile('Car Exterior Photo', _carImage, 'car'),
                  const Divider(),
                  _buildImagePickerTile('Registration Certificate (RC)', _rcDocument, 'rc'),
                  const Divider(),
                  _buildImagePickerTile('Valid Insurance Policy', _insuranceDocument, 'insurance'),
                  
                  const SizedBox(height: 32),
                  ElevatedButton(
                    onPressed: _submit,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: Colors.indigo,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Submit Car Request', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
    );
  }
}
