import 'package:json_annotation/json_annotation.dart';

part 'passenger.g.dart';

@JsonSerializable()
class Passenger {
  final String id;
  @JsonKey(name: 'first_name')
  final String firstName;
  @JsonKey(name: 'last_name')
  final String lastName;
  final String? gender;
  @JsonKey(name: 'passport_number')
  final String passportNumber;
  @JsonKey(name: 'passport_expiry')
  final DateTime? passportExpiry;
  @JsonKey(name: 'birth_date')
  final DateTime? birthDate;
  @JsonKey(name: 'phone_number')
  final String phoneNumber;
  @JsonKey(name: 'assigned_room_id')
  final String? assignedRoomId;
  @JsonKey(name: 'age_category')
  final String? ageCategory;
  @JsonKey(name: 'suggested_price')
  final double? suggestedPrice;
  @JsonKey(name: 'final_price')
  final double? finalPrice;
  @JsonKey(name: 'price_overridden')
  final bool? priceOverridden;
  
  Passenger({
    required this.id,
    required this.firstName,
    required this.lastName,
    this.gender,
    required this.passportNumber,
    this.passportExpiry,
    this.birthDate,
    required this.phoneNumber,
    this.assignedRoomId,
    this.ageCategory,
    this.suggestedPrice,
    this.finalPrice,
    this.priceOverridden,
  });
  
  factory Passenger.fromJson(Map<String, dynamic> json) => _$PassengerFromJson(json);
  Map<String, dynamic> toJson() => _$PassengerToJson(this);
  
  String get fullName => '$firstName $lastName';
  
  int? get age {
    if (birthDate == null) return null;
    final now = DateTime.now();
    int age = now.year - birthDate!.year;
    if (now.month < birthDate!.month || 
        (now.month == birthDate!.month && now.day < birthDate!.day)) {
      age--;
    }
    return age;
  }
  
  String get ageCategoryDisplay {
    switch (ageCategory) {
      case 'ADT':
        return 'Adulte';
      case 'CHD':
        return 'Enfant';
      case 'INF':
        return 'Bébé';
      default:
        return 'Adulte';
    }
  }
  
  bool get isPassportExpiringSoon {
    if (passportExpiry == null) return false;
    final sixMonthsFromNow = DateTime.now().add(const Duration(days: 180));
    return passportExpiry!.isBefore(sixMonthsFromNow);
  }
}
