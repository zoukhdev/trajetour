import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../config/app_config.dart';

class StorageService {
  static late FlutterSecureStorage _secureStorage;
  static late SharedPreferences _prefs;
  
  static Future<void> init() async {
    _secureStorage = const FlutterSecureStorage(
      aOptions: AndroidOptions(
        encryptedSharedPreferences: true,
      ),
    );
    _prefs = await SharedPreferences.getInstance();
  }
  
  // Secure Storage (for sensitive data like tokens)
  static Future<void> saveToken(String token) async {
    await _secureStorage.write(key: AppConfig.tokenKey, value: token);
  }
  
  static Future<String?> getToken() async {
    return await _secureStorage.read(key: AppConfig.tokenKey);
  }
  
  static Future<void> deleteToken() async {
    await _secureStorage.delete(key: AppConfig.tokenKey);
  }
  
  static Future<void> saveUserData(String userData) async {
    await _secureStorage.write(key: AppConfig.userKey, value: userData);
  }
  
  static Future<String?> getUserData() async {
    return await _secureStorage.read(key: AppConfig.userKey);
  }
  
  static Future<void> deleteUserData() async {
    await _secureStorage.delete(key: AppConfig.userKey);
  }
  
  // Regular Storage (for non-sensitive data)
  static Future<void> saveLanguage(String language) async {
    await _prefs.setString(AppConfig.languageKey, language);
  }
  
  static String? getLanguage() {
    return _prefs.getString(AppConfig.languageKey);
  }
  
  static Future<void> saveTheme(String theme) async {
    await _prefs.setString(AppConfig.themeKey, theme);
  }
  
  static String? getTheme() {
    return _prefs.getString(AppConfig.themeKey);
  }
  
  static Future<void> clearAll() async {
    await _secureStorage.deleteAll();
    await _prefs.clear();
  }
}
