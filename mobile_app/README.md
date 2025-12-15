# WRTour Mobile - Flutter Application

## 📱 Overview

This is the **mobile application** for Wahat Alrajaa Tour Management System, built with Flutter/Dart. It provides a native mobile experience for managing travel bookings, clients, payments, and more.

## 🏗️ Project Structure

```
mobile_app/
├── lib/
│   ├── main.dart                 # App entry point
│   ├── config/                   # Configuration
│   │   ├── app_config.dart
│   │   ├── routes.dart
│   │   └── theme.dart
│   ├── core/                     # Core utilities
│   │   ├── constants/
│   │   ├── utils/
│   │   └── extensions/
│   ├── data/                     # Data layer
│   │   ├── models/              # Data models
│   │   ├── repositories/        # Repository pattern
│   │   └── services/            # API services
│   ├── presentation/            # UI layer
│   │   ├── screens/            # All screens
│   │   ├── widgets/            # Reusable widgets
│   │   └── providers/          # State management
│   └── l10n/                   # Internationalization
├── assets/                      # Images, fonts, etc.
├── android/                     # Android native code
├── ios/                        # iOS native code (future)
└── test/                       # Unit & widget tests
```

## 🚀 Prerequisites

Before running this project, ensure you have:

1. **Flutter SDK** (≥3.16.0)
   - Download from: https://flutter.dev/docs/get-started/install
   - Add to PATH

2. **Android Studio** (for Android development)
   - Android SDK
   - Android Emulator or physical device

3. **VS Code** (recommended) with Flutter extension

## 📦 Installation

### 1. Install Flutter

**Windows:**
```powershell
# Download Flutter SDK
# Extract to C:\src\flutter
# Add to PATH: C:\src\flutter\bin

# Verify installation
flutter doctor
```

### 2. Setup Project

```bash
cd d:\WRtour\mobile_app

# Get dependencies
flutter pub get

# Run code generation (for models)
flutter pub run build_runner build --delete-conflicting-outputs
```

### 3. Configure API Endpoint

Edit `lib/config/app_config.dart`:
```dart
static const String apiBaseUrl = 'https://your-api.onrender.com/api';
```

## 🏃 Running the App

### Development Mode

```bash
# Check connected devices
flutter devices

# Run on connected device/emulator
flutter run

# Run with hot reload
flutter run --debug

# Run on specific device
flutter run -d <device-id>
```

### Build APK

```bash
# Debug APK
flutter build apk --debug

# Release APK (production)
flutter build apk --release

# Split APKs by ABI (smaller size)
flutter build apk --split-per-abi
```

APK location: `build/app/outputs/flutter-apk/app-release.apk`

## 🎨 Features

### ✅ Implemented
- 🔐 Authentication (Login/Logout)
- 📊 Dashboard with analytics
- 📝 Order management (Create, View, Edit)
- 👥 Client management
- 💰 Payment processing
- 🏨 Room allocation
- 🌍 Multi-language (French/Arabic)
- 🌙 Dark mode support
- 📴 Offline mode with sync

### 🚧 Planned
- 📄 PDF generation & export
- 📸 Document scanning
- 🔔 Push notifications
- 📊 Advanced reports
- 🗺️ Map integration

## 📚 Key Dependencies

```yaml
# State Management
flutter_riverpod: ^2.4.9

# Networking
dio: ^5.4.0
retrofit: ^4.0.3

# Storage
flutter_secure_storage: ^9.0.0
sqflite: ^2.3.0
hive: ^2.2.3

# UI Components
fl_chart: ^0.66.0
cached_network_image: ^3.3.1

# Forms
flutter_form_builder: ^9.1.1

# Internationalization
flutter_localizations:
  sdk: flutter
intl: ^0.18.1
```

## 🔧 Development Commands

```bash
# Format code
flutter format .

# Analyze code
flutter analyze

# Run tests
flutter test

# Generate code (models, routes)
flutter pub run build_runner build

# Clean build
flutter clean && flutter pub get
```

## 📱 Supported Platforms

- ✅ Android (API 21+)
- 🚧 iOS (planned)
- ❌ Web (use React web app instead)

## 🌐 API Integration

This app connects to the same backend as the web application:

**Base URL:** `https://your-render-url.onrender.com/api`

**Endpoints:**
- `/auth/login` - Authentication
- `/clients` - Client management
- `/orders` - Order management
- `/payments` - Payment processing
- `/rooms` - Room allocation
- And more...

## 🔐 Environment Variables

Create `.env` file in root:
```
API_BASE_URL=https://your-api.onrender.com/api
CLOUDINARY_CLOUD_NAME=your-cloud-name
```

## 🧪 Testing

```bash
# Run all tests
flutter test

# Run with coverage
flutter test --coverage

# View coverage report
genhtml coverage/lcov.info -o coverage/html
```

## 📦 Building for Production

### Android

1. **Update version** in `pubspec.yaml`:
   ```yaml
   version: 1.0.0+1
   ```

2. **Generate signing key:**
   ```bash
   keytool -genkey -v -keystore wrtour-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias wrtour
   ```

3. **Configure signing** in `android/app/build.gradle`

4. **Build release APK:**
   ```bash
   flutter build apk --release
   ```

## 🐛 Troubleshooting

### Flutter not recognized
```bash
# Add Flutter to PATH
setx PATH "%PATH%;C:\src\flutter\bin"
```

### Gradle build failed
```bash
cd android
./gradlew clean
cd ..
flutter clean
flutter pub get
```

### Hot reload not working
```bash
flutter clean
flutter pub get
flutter run
```

## 📖 Documentation

- [Flutter Documentation](https://flutter.dev/docs)
- [Dart Language Tour](https://dart.dev/guides/language/language-tour)
- [Riverpod Documentation](https://riverpod.dev)
- [Dio HTTP Client](https://pub.dev/packages/dio)

## 👥 Team

- **Backend API:** Node.js + Express + PostgreSQL
- **Web Admin:** React + TypeScript
- **Mobile App:** Flutter + Dart

## 📄 License

MIT License - See LICENSE file for details

---

**Note:** This mobile app shares the same backend with the React web application. No backend changes are required!
