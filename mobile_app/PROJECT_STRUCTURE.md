# WRTour Mobile - Project Structure

## 📁 Complete Directory Structure

```
mobile_app/
├── android/                          # Android native code
│   ├── app/
│   │   ├── src/
│   │   │   └── main/
│   │   │       ├── AndroidManifest.xml
│   │   │       ├── kotlin/
│   │   │       └── res/
│   │   └── build.gradle
│   ├── gradle/
│   ├── build.gradle
│   └── settings.gradle
│
├── assets/                           # Static assets
│   ├── images/                      # App images
│   ├── icons/                       # App icons
│   ├── animations/                  # Lottie animations
│   └── fonts/                       # Custom fonts
│       ├── Cairo-Regular.ttf
│       ├── Cairo-Bold.ttf
│       └── Cairo-SemiBold.ttf
│
├── lib/                             # Main application code
│   ├── main.dart                    # App entry point
│   │
│   ├── config/                      # Configuration
│   │   ├── app_config.dart         # App constants
│   │   ├── routes.dart             # Navigation routes
│   │   └── theme.dart              # App theme
│   │
│   ├── core/                        # Core utilities
│   │   ├── constants/
│   │   │   ├── api_constants.dart
│   │   │   ├── app_constants.dart
│   │   │   └── storage_keys.dart
│   │   ├── utils/
│   │   │   ├── logger.dart
│   │   │   ├── formatters.dart
│   │   │   ├── validators.dart
│   │   │   └── helpers.dart
│   │   └── extensions/
│   │       ├── string_extensions.dart
│   │       ├── date_extensions.dart
│   │       └── context_extensions.dart
│   │
│   ├── data/                        # Data layer
│   │   ├── models/                 # Data models
│   │   │   ├── user.dart
│   │   │   ├── user.g.dart        # Generated
│   │   │   ├── client.dart
│   │   │   ├── client.g.dart
│   │   │   ├── order.dart
│   │   │   ├── order.g.dart
│   │   │   ├── passenger.dart
│   │   │   ├── passenger.g.dart
│   │   │   ├── payment.dart
│   │   │   ├── room.dart
│   │   │   ├── agency.dart
│   │   │   └── offer.dart
│   │   │
│   │   ├── repositories/           # Repository pattern
│   │   │   ├── auth_repository.dart
│   │   │   ├── order_repository.dart
│   │   │   ├── client_repository.dart
│   │   │   ├── payment_repository.dart
│   │   │   └── room_repository.dart
│   │   │
│   │   └── services/               # Services
│   │       ├── api_service.dart
│   │       ├── storage_service.dart
│   │       ├── offline_service.dart
│   │       └── notification_service.dart
│   │
│   ├── presentation/               # UI layer
│   │   ├── screens/               # All screens
│   │   │   ├── auth/
│   │   │   │   ├── splash_screen.dart
│   │   │   │   └── login_screen.dart
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   └── dashboard_screen.dart
│   │   │   │
│   │   │   ├── orders/
│   │   │   │   ├── order_list_screen.dart
│   │   │   │   ├── order_form_screen.dart
│   │   │   │   └── order_detail_screen.dart
│   │   │   │
│   │   │   ├── clients/
│   │   │   │   ├── client_list_screen.dart
│   │   │   │   ├── client_form_screen.dart
│   │   │   │   └── client_detail_screen.dart
│   │   │   │
│   │   │   ├── payments/
│   │   │   │   ├── payment_screen.dart
│   │   │   │   └── payment_form_screen.dart
│   │   │   │
│   │   │   ├── rooms/
│   │   │   │   └── room_list_screen.dart
│   │   │   │
│   │   │   └── profile/
│   │   │       └── profile_screen.dart
│   │   │
│   │   ├── widgets/               # Reusable widgets
│   │   │   ├── stat_card.dart
│   │   │   ├── custom_button.dart
│   │   │   ├── custom_text_field.dart
│   │   │   ├── loading_indicator.dart
│   │   │   ├── empty_state.dart
│   │   │   ├── error_widget.dart
│   │   │   ├── passenger_card.dart
│   │   │   ├── order_card.dart
│   │   │   ├── client_card.dart
│   │   │   └── payment_card.dart
│   │   │
│   │   └── providers/             # State management
│   │       ├── auth_provider.dart
│   │       ├── order_provider.dart
│   │       ├── client_provider.dart
│   │       ├── payment_provider.dart
│   │       └── theme_provider.dart
│   │
│   └── l10n/                      # Internationalization
│       ├── app_fr.arb            # French translations
│       └── app_ar.arb            # Arabic translations
│
├── test/                          # Tests
│   ├── unit/
│   ├── widget/
│   └── integration/
│
├── .gitignore
├── analysis_options.yaml
├── pubspec.yaml
├── pubspec.lock
├── README.md
└── INSTALLATION.md
```

## 📝 File Descriptions

### Configuration Files

- **pubspec.yaml**: Dependencies and assets
- **analysis_options.yaml**: Linting rules
- **.gitignore**: Git ignore patterns

### Core Files

- **main.dart**: Application entry point
- **app_config.dart**: Configuration constants
- **routes.dart**: Navigation configuration
- **theme.dart**: UI theme definition

### Data Layer

- **models/**: JSON serializable data models
- **repositories/**: Data access layer
- **services/**: API and storage services

### Presentation Layer

- **screens/**: Full-page screens
- **widgets/**: Reusable UI components
- **providers/**: Riverpod state management

## 🎯 Implementation Status

### ✅ Completed
- Project structure
- Configuration files
- Theme setup
- Authentication flow
- API service
- Storage service
- Basic screens (Splash, Login, Dashboard, Profile)
- Navigation routing
- State management setup

### 🚧 To Implement
- Order management (full CRUD)
- Client management (full CRUD)
- Payment processing
- Room allocation
- Offline sync
- PDF generation
- Image upload
- Push notifications
- Advanced filtering
- Reports and analytics

## 🔄 Development Workflow

1. **Create Model**: Define data structure in `data/models/`
2. **Create Repository**: Implement data access in `data/repositories/`
3. **Create Provider**: Add state management in `presentation/providers/`
4. **Create Screen**: Build UI in `presentation/screens/`
5. **Add Route**: Register in `config/routes.dart`
6. **Test**: Write tests in `test/`

## 📦 Key Dependencies

### State Management
- `flutter_riverpod`: State management

### Networking
- `dio`: HTTP client
- `retrofit`: Type-safe API client

### Storage
- `flutter_secure_storage`: Secure storage
- `shared_preferences`: Simple storage
- `sqflite`: Local database

### UI
- `fl_chart`: Charts
- `cached_network_image`: Image caching
- `shimmer`: Loading effects

### Forms
- `flutter_form_builder`: Form handling
- `form_builder_validators`: Validation

## 🚀 Next Steps

1. Install Flutter SDK
2. Run `flutter pub get`
3. Configure API endpoint
4. Run `flutter run`
5. Start implementing features

---

**Note**: This structure follows Flutter best practices and clean architecture principles.
