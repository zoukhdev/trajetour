class AppConfig {
  // API Configuration
  static const String apiBaseUrl = 'https://your-render-url.onrender.com/api';
  static const Duration apiTimeout = Duration(seconds: 30);
  
  // App Information
  static const String appName = 'WRTour Mobile';
  static const String appVersion = '1.0.0';
  
  // Storage Keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  static const String languageKey = 'app_language';
  static const String themeKey = 'app_theme';
  
  // Pagination
  static const int defaultPageSize = 50;
  static const int maxPageSize = 100;
  
  // Currencies
  static const List<String> supportedCurrencies = ['DZD', 'EUR', 'USD', 'SAR'];
  static const String defaultCurrency = 'DZD';
  
  // Date Formats
  static const String dateFormat = 'dd/MM/yyyy';
  static const String dateTimeFormat = 'dd/MM/yyyy HH:mm';
  
  // Offline Sync
  static const Duration syncInterval = Duration(minutes: 5);
  static const int maxOfflineQueueSize = 100;
  
  // Image Upload
  static const int maxImageSize = 5 * 1024 * 1024; // 5MB
  static const List<String> allowedImageTypes = ['jpg', 'jpeg', 'png', 'pdf'];
  
  // Cloudinary (if needed for direct uploads)
  static const String cloudinaryCloudName = 'your-cloud-name';
  
  // Feature Flags
  static const bool enableOfflineMode = true;
  static const bool enableBiometricAuth = true;
  static const bool enablePushNotifications = false;
  
  // Development
  static const bool isDevelopment = true;
  static const bool enableLogging = true;
}
