import 'package:json_annotation/json_annotation.dart';

part 'user.g.dart';

@JsonSerializable()
class User {
  final String id;
  final String username;
  final String email;
  final String role;
  final Map<String, dynamic>? permissions;
  final String? avatar;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  
  User({
    required this.id,
    required this.username,
    required this.email,
    required this.role,
    this.permissions,
    this.avatar,
    this.createdAt,
    this.updatedAt,
  });
  
  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
  Map<String, dynamic> toJson() => _$UserToJson(this);
  
  bool hasPermission(String permission) {
    if (role == 'admin') return true;
    if (permissions == null) return false;
    return permissions![permission] == true;
  }
  
  String get displayName => username;
  
  bool get isAdmin => role == 'admin';
  bool get isStaff => role == 'staff';
  bool get isCaisser => role == 'caisser';
}
