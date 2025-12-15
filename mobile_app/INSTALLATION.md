# Flutter Mobile App - Installation Guide

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### 1. Flutter SDK

**Download and Install:**
```powershell
# Option 1: Download from official website
# Visit: https://docs.flutter.dev/get-started/install/windows

# Option 2: Using Chocolatey (if installed)
choco install flutter

# Verify installation
flutter doctor
```

**Add to PATH:**
1. Extract Flutter to `C:\src\flutter`
2. Add `C:\src\flutter\bin` to your system PATH
3. Restart your terminal

### 2. Android Studio

**Download:** https://developer.android.com/studio

**Required Components:**
- Android SDK
- Android SDK Command-line Tools
- Android SDK Build-Tools
- Android SDK Platform-Tools
- Android Emulator

**Setup:**
1. Install Android Studio
2. Open Android Studio
3. Go to: `Tools > SDK Manager`
4. Install:
   - Android SDK Platform (API 33 or higher)
   - Android SDK Build-Tools
   - Android SDK Command-line Tools
5. Create an Android Virtual Device (AVD):
   - `Tools > Device Manager > Create Device`

### 3. VS Code (Recommended)

**Extensions:**
- Flutter
- Dart
- Flutter Widget Snippets

## 🚀 Project Setup

### Step 1: Navigate to Project

```powershell
cd d:\WRtour\mobile_app
```

### Step 2: Install Dependencies

```powershell
flutter pub get
```

### Step 3: Generate Code

```powershell
# Generate JSON serialization code
flutter pub run build_runner build --delete-conflicting-outputs
```

### Step 4: Configure API Endpoint

Edit `lib/config/app_config.dart`:

```dart
static const String apiBaseUrl = 'https://your-actual-api.onrender.com/api';
```

Replace with your actual backend URL.

## 🏃 Running the App

### Option 1: Using Android Emulator

```powershell
# Start emulator
flutter emulators --launch <emulator_id>

# Or use Android Studio: Tools > Device Manager > Run

# Run app
flutter run
```

### Option 2: Using Physical Device

1. Enable Developer Options on your Android device:
   - Go to Settings > About Phone
   - Tap "Build Number" 7 times
   
2. Enable USB Debugging:
   - Settings > Developer Options > USB Debugging

3. Connect device via USB

4. Run:
```powershell
flutter devices
flutter run
```

### Option 3: Hot Reload Development

```powershell
# Run in debug mode with hot reload
flutter run --debug

# Press 'r' to hot reload
# Press 'R' to hot restart
# Press 'q' to quit
```

## 📦 Building APK

### Debug APK (for testing)

```powershell
flutter build apk --debug
```

Output: `build\app\outputs\flutter-apk\app-debug.apk`

### Release APK (for production)

```powershell
flutter build apk --release
```

Output: `build\app\outputs\flutter-apk\app-release.apk`

### Split APKs (smaller file size)

```powershell
flutter build apk --split-per-abi
```

This creates separate APKs for different CPU architectures:
- `app-armeabi-v7a-release.apk` (32-bit ARM)
- `app-arm64-v8a-release.apk` (64-bit ARM)
- `app-x86_64-release.apk` (64-bit Intel)

## 🔧 Common Commands

```powershell
# Check Flutter installation
flutter doctor -v

# Clean build files
flutter clean

# Get dependencies
flutter pub get

# Update dependencies
flutter pub upgrade

# Run code generation
flutter pub run build_runner build

# Format code
flutter format .

# Analyze code
flutter analyze

# Run tests
flutter test

# Check for outdated packages
flutter pub outdated
```

## 🐛 Troubleshooting

### Issue: "Flutter not recognized"

**Solution:**
```powershell
# Add Flutter to PATH
setx PATH "%PATH%;C:\src\flutter\bin"

# Restart terminal
```

### Issue: "Android licenses not accepted"

**Solution:**
```powershell
flutter doctor --android-licenses
# Accept all licenses
```

### Issue: "Gradle build failed"

**Solution:**
```powershell
cd android
.\gradlew clean
cd ..
flutter clean
flutter pub get
flutter run
```

### Issue: "Unable to locate Android SDK"

**Solution:**
1. Open Android Studio
2. Go to: `File > Settings > Appearance & Behavior > System Settings > Android SDK`
3. Note the SDK location (e.g., `C:\Users\YourName\AppData\Local\Android\Sdk`)
4. Set environment variable:
```powershell
setx ANDROID_HOME "C:\Users\YourName\AppData\Local\Android\Sdk"
```

### Issue: "Hot reload not working"

**Solution:**
```powershell
flutter clean
flutter pub get
flutter run
```

## 📱 Testing on Physical Device

### Via USB:
1. Enable USB Debugging (see above)
2. Connect device
3. Run: `flutter run`

### Via WiFi (Wireless Debugging):
1. Connect device and PC to same WiFi
2. Enable Wireless Debugging on device
3. Run:
```powershell
adb tcpip 5555
adb connect <device-ip>:5555
flutter run
```

## 🔐 Signing APK for Release

### Step 1: Generate Keystore

```powershell
keytool -genkey -v -keystore wrtour-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias wrtour
```

Save the keystore file in a secure location (NOT in the project folder).

### Step 2: Create key.properties

Create `android/key.properties`:

```properties
storePassword=<your-store-password>
keyPassword=<your-key-password>
keyAlias=wrtour
storeFile=<path-to-keystore>/wrtour-release-key.jks
```

### Step 3: Configure Gradle

Edit `android/app/build.gradle` (already configured in this project).

### Step 4: Build Signed APK

```powershell
flutter build apk --release
```

## 📊 Performance Tips

### 1. Enable Release Mode
Always use `--release` for production builds.

### 2. Optimize Images
Use appropriate image sizes and formats.

### 3. Use const Constructors
Improves performance by reusing widgets.

### 4. Profile Your App
```powershell
flutter run --profile
```

## 🌐 Connecting to Backend

The app connects to your existing Node.js backend. No backend changes needed!

**Endpoints Used:**
- `/auth/login` - Authentication
- `/clients` - Client management
- `/orders` - Order management
- `/payments` - Payment processing
- `/rooms` - Room allocation

**Make sure your backend:**
1. Is running and accessible
2. Has CORS enabled for mobile app
3. Accepts JWT tokens in Authorization header

## 📚 Next Steps

1. **Implement Features:**
   - Complete order form screen
   - Add client management
   - Implement payment processing
   - Add offline sync

2. **Testing:**
   - Write unit tests
   - Write widget tests
   - Test on multiple devices

3. **Deployment:**
   - Build release APK
   - Test on physical devices
   - Publish to Google Play Store (optional)

## 🆘 Getting Help

- Flutter Documentation: https://docs.flutter.dev
- Flutter Community: https://flutter.dev/community
- Stack Overflow: https://stackoverflow.com/questions/tagged/flutter

---

**Happy Coding! 🚀**
