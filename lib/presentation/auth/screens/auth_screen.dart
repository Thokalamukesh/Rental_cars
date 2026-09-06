import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  bool _isLogin = true;
  bool _isLoading = false;
  
  final _nameController = TextEditingController();
  final _numberController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  
  final supabase = Supabase.instance.client;

  Future<void> _submit() async {
    final number = _numberController.text.trim();
    final password = _passwordController.text.trim();
    
    if (number.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all required fields')));
      return;
    }

    if (!_isLogin) {
      final name = _nameController.text.trim();
      final confirmPassword = _confirmPasswordController.text.trim();
      
      if (name.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter your full name')));
        return;
      }
      if (password != confirmPassword) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Passwords do not match')));
        return;
      }
    }

    setState(() => _isLoading = true);
    
    try {
      // Create a virtual email using the phone number
      final virtualEmail = '$number@drivenow.app';
      
      if (_isLogin) {
        await supabase.auth.signInWithPassword(email: virtualEmail, password: password);
      } else {
        // Register user
        final authResponse = await supabase.auth.signUp(email: virtualEmail, password: password);
        
        // Wait briefly for triggers to complete if necessary, then update the custom fields
        if (authResponse.user != null) {
          await supabase.from('users').update({
            'shop_name': _nameController.text.trim(), // Use shop_name column to store Full Name for customers
            'mobile_number': number
          }).eq('id', authResponse.user!.id);
        }
      }
      
      if (mounted) context.go('/');
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Auth Error: $e'), backgroundColor: Colors.red));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(title: Text(_isLogin ? 'Login' : 'Register'), elevation: 0),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                _isLogin ? 'Welcome Back!' : 'Create an Account',
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 32),
              
              if (!_isLogin) ...[
                TextField(
                  controller: _nameController,
                  decoration: const InputDecoration(labelText: 'Full Name', border: OutlineInputBorder()),
                ),
                const SizedBox(height: 16),
              ],
              
              TextField(
                controller: _numberController,
                decoration: const InputDecoration(labelText: 'Mobile Number', border: OutlineInputBorder(), prefixText: '+1 '),
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 16),
              
              TextField(
                controller: _passwordController,
                decoration: const InputDecoration(labelText: 'Password', border: OutlineInputBorder()),
                obscureText: true,
              ),
              const SizedBox(height: 16),
              
              if (!_isLogin) ...[
                TextField(
                  controller: _confirmPasswordController,
                  decoration: const InputDecoration(labelText: 'Confirm Password', border: OutlineInputBorder()),
                  obscureText: true,
                ),
                const SizedBox(height: 24),
              ],
              
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _submit,
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF4F46E5)),
                  child: _isLoading 
                      ? const CircularProgressIndicator(color: Colors.white)
                      : Text(_isLogin ? 'Login' : 'Register', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ),
              const SizedBox(height: 16),
              
              TextButton(
                onPressed: () => setState(() => _isLogin = !_isLogin),
                child: Text(_isLogin ? 'Need an account? Register here' : 'Already have an account? Login here'),
              )
            ],
          ),
        ),
      ),
    );
  }
}
