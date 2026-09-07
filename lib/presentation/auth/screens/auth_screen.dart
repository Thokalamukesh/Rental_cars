import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  
  final _nameController = TextEditingController();
  final _numberController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  
  final supabase = Supabase.instance.client;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _nameController.dispose();
    _numberController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final isLogin = _tabController.index == 0;
    final number = _numberController.text.trim();
    final password = _passwordController.text.trim();
    
    if (number.isEmpty || password.isEmpty) {
      _showError('Please fill all required fields');
      return;
    }

    if (number.length != 10 || !RegExp(r'^[0-9]+$').hasMatch(number)) {
      _showError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!isLogin) {
      final name = _nameController.text.trim();
      final confirmPassword = _confirmPasswordController.text.trim();
      
      if (name.isEmpty) {
        _showError('Please enter your full name');
        return;
      }
      if (password != confirmPassword) {
        _showError('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        _showError('Password must be at least 6 characters');
        return;
      }
    }

    setState(() => _isLoading = true);
    
    try {
      // Use virtual email for phone auth
      final virtualEmail = '$number@drivenow.app';
      
      if (isLogin) {
        await supabase.auth.signInWithPassword(email: virtualEmail, password: password);
        if (mounted) context.go('/home');
      } else {
        final authResponse = await supabase.auth.signUp(email: virtualEmail, password: password);
        if (authResponse.user != null) {
          await supabase.from('users').upsert({
            'id': authResponse.user!.id,
            'email': virtualEmail,
            'full_name': _nameController.text.trim(),
            'mobile_number': '+91$number'
          });
        }
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('Registration successful! Please login.', style: TextStyle(color: Colors.white)),
              backgroundColor: Colors.green,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            )
          );
          // Switch to Login Tab automatically and pre-fill number
          _tabController.animateTo(0);
          _passwordController.clear();
          _confirmPasswordController.clear();
        }
      }
    } catch (e) {
      _showError(e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: const TextStyle(color: Colors.white)),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      )
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            const SizedBox(height: 40),
            const Icon(Icons.directions_car, size: 80, color: Color(0xFF4F46E5)),
            const SizedBox(height: 16),
            const Text(
              'DriveNow',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Color(0xFF1E1E24)),
            ),
            const SizedBox(height: 32),
            
            // TabBar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32.0),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: TabBar(
                  controller: _tabController,
                  indicator: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, spreadRadius: 1)],
                  ),
                  labelColor: const Color(0xFF4F46E5),
                  unselectedLabelColor: Colors.grey[600],
                  labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  dividerColor: Colors.transparent,
                  indicatorSize: TabBarIndicatorSize.tab,
                  tabs: const [
                    Tab(text: 'Login'),
                    Tab(text: 'Register'),
                  ],
                ),
              ),
            ),
            
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildForm(isLogin: true),
                  _buildForm(isLogin: false),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildForm({required bool isLogin}) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(32.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (!isLogin) ...[
            _buildTextField(
              controller: _nameController,
              label: 'Full Name',
              icon: Icons.person_outline,
            ),
            const SizedBox(height: 16),
          ],
          
          _buildTextField(
            controller: _numberController,
            label: 'Mobile Number',
            icon: Icons.phone_android,
            keyboardType: TextInputType.phone,
            prefixText: '+91 ',
            maxLength: 10,
          ),
          const SizedBox(height: 16),
          
          _buildTextField(
            controller: _passwordController,
            label: 'Password',
            icon: Icons.lock_outline,
            obscureText: _obscurePassword,
            suffixIcon: IconButton(
              icon: Icon(_obscurePassword ? Icons.visibility_off : Icons.visibility, color: Colors.grey),
              onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
            ),
          ),
          
          if (!isLogin) ...[
            const SizedBox(height: 16),
            _buildTextField(
              controller: _confirmPasswordController,
              label: 'Confirm Password',
              icon: Icons.lock_outline,
              obscureText: _obscureConfirmPassword,
              suffixIcon: IconButton(
                icon: Icon(_obscureConfirmPassword ? Icons.visibility_off : Icons.visibility, color: Colors.grey),
                onPressed: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
              ),
            ),
          ],
          
          const SizedBox(height: 32),
          
          ElevatedButton(
            onPressed: _isLoading ? null : _submit,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF4F46E5),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 18),
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: _isLoading 
                ? const SizedBox(
                    height: 24,
                    width: 24,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 3),
                  )
                : Text(
                    isLogin ? 'Login' : 'Register', 
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required IconData icon,
    bool obscureText = false,
    TextInputType? keyboardType,
    String? prefixText,
    int? maxLength,
    Widget? suffixIcon,
  }) {
    return TextField(
      controller: controller,
      obscureText: obscureText,
      keyboardType: keyboardType,
      maxLength: maxLength,
      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: Colors.grey[600]),
        prefixIcon: Icon(icon, color: const Color(0xFF4F46E5)),
        suffixIcon: suffixIcon,
        prefixText: prefixText,
        prefixStyle: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 16),
        filled: true,
        fillColor: Colors.grey[50],
        contentPadding: const EdgeInsets.symmetric(vertical: 20),
        counterText: '', // Hide max length counter
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey[300]!, width: 1.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF4F46E5), width: 2),
        ),
      ),
    );
  }
}
