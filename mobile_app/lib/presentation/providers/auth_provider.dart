import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/user.dart';
import '../../data/services/api_service.dart';
import '../../data/services/storage_service.dart';
import '../../core/utils/logger.dart';

// Auth State
class AuthState {
  final User? user;
  final bool isLoading;
  final String? error;
  
  AuthState({
    this.user,
    this.isLoading = false,
    this.error,
  });
  
  bool get isAuthenticated => user != null;
  
  AuthState copyWith({
    User? user,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

// Auth Provider
class AuthNotifier extends StateNotifier<AuthState> {
  final ApiService _apiService;
  
  AuthNotifier(this._apiService) : super(AuthState()) {
    _checkAuthStatus();
  }
  
  // Check if user is already logged in
  Future<void> _checkAuthStatus() async {
    try {
      final token = await StorageService.getToken();
      final userDataString = await StorageService.getUserData();
      
      if (token != null && userDataString != null) {
        final userData = jsonDecode(userDataString);
        state = state.copyWith(user: User.fromJson(userData));
        AppLogger.info('User authenticated from storage');
      }
    } catch (e) {
      AppLogger.error('Failed to check auth status', e);
      await logout();
    }
  }
  
  // Login
  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    
    try {
      final response = await _apiService.post(
        '/auth/login',
        data: {
          'email': email,
          'password': password,
        },
      );
      
      final token = response.data['token'];
      final userData = response.data['user'];
      
      // Save to storage
      await StorageService.saveToken(token);
      await StorageService.saveUserData(jsonEncode(userData));
      
      // Update state
      state = state.copyWith(
        user: User.fromJson(userData),
        isLoading: false,
      );
      
      AppLogger.info('Login successful: ${userData['email']}');
      return true;
    } catch (e) {
      AppLogger.error('Login failed', e);
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
      return false;
    }
  }
  
  // Logout
  Future<void> logout() async {
    await StorageService.clearAll();
    state = AuthState();
    AppLogger.info('User logged out');
  }
  
  // Update user
  void updateUser(User user) {
    state = state.copyWith(user: user);
    StorageService.saveUserData(jsonEncode(user.toJson()));
  }
}

// Provider
final apiServiceProvider = Provider<ApiService>((ref) => ApiService());

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return AuthNotifier(apiService);
});
