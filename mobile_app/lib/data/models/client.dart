import 'package:json_annotation/json_annotation.dart';

part 'client.g.dart';

@JsonSerializable()
class Client {
  final String id;
  @JsonKey(name: 'full_name')
  final String fullName;
  @JsonKey(name: 'mobile_number')
  final String mobileNumber;
  final String type;
  @JsonKey(name: 'passport_number')
  final String? passportNumber;
  @JsonKey(name: 'passport_expiry')
  final DateTime? passportExpiry;
  final String? email;
  final String? address;
  @JsonKey(name: 'created_at')
  final DateTime? createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime? updatedAt;
  
  Client({
    required this.id,
    required this.fullName,
    required this.mobileNumber,
    required this.type,
    this.passportNumber,
    this.passportExpiry,
    this.email,
    this.address,
    this.createdAt,
    this.updatedAt,
  });
  
  factory Client.fromJson(Map<String, dynamic> json) => _$ClientFromJson(json);
  Map<String, dynamic> toJson() => _$ClientToJson(this);
  
  bool get isIndividual => type == 'Individual';
  bool get isEnterprise => type == 'Entreprise';
  
  bool get isPassportExpiringSoon {
    if (passportExpiry == null) return false;
    final sixMonthsFromNow = DateTime.now().add(const Duration(days: 180));
    return passportExpiry!.isBefore(sixMonthsFromNow);
  }
}
