import 'package:json_annotation/json_annotation.dart';
import 'passenger.dart';

part 'order.g.dart';

@JsonSerializable()
class Order {
  final String id;
  @JsonKey(name: 'client_id')
  final String clientId;
  @JsonKey(name: 'client_name')
  final String? clientName;
  @JsonKey(name: 'agency_id')
  final String? agencyId;
  final List<OrderItem> items;
  final List<Passenger> passengers;
  final List<Hotel> hotels;
  @JsonKey(name: 'total_amount')
  final double totalAmount;
  final String status;
  @JsonKey(name: 'paid_amount')
  final double? paidAmount;
  final String? notes;
  @JsonKey(name: 'created_at')
  final DateTime? createdAt;
  @JsonKey(name: 'updated_at')
  final DateTime? updatedAt;
  
  Order({
    required this.id,
    required this.clientId,
    this.clientName,
    this.agencyId,
    required this.items,
    required this.passengers,
    required this.hotels,
    required this.totalAmount,
    required this.status,
    this.paidAmount,
    this.notes,
    this.createdAt,
    this.updatedAt,
  });
  
  factory Order.fromJson(Map<String, dynamic> json) => _$OrderFromJson(json);
  Map<String, dynamic> toJson() => _$OrderToJson(this);
  
  bool get isPaid => status == 'Payé';
  bool get isUnpaid => status == 'Non payé';
  bool get isPartial => status == 'Partiel';
  
  double get remainingAmount => totalAmount - (paidAmount ?? 0);
  double get paymentProgress => (paidAmount ?? 0) / totalAmount;
  
  int get passengerCount => passengers.length;
}

@JsonSerializable()
class OrderItem {
  final String id;
  final String description;
  final int quantity;
  @JsonKey(name: 'unit_price')
  final double unitPrice;
  final double amount;
  @JsonKey(name: 'amount_dzd')
  final double amountDzd;
  
  OrderItem({
    required this.id,
    required this.description,
    required this.quantity,
    required this.unitPrice,
    required this.amount,
    required this.amountDzd,
  });
  
  factory OrderItem.fromJson(Map<String, dynamic> json) => _$OrderItemFromJson(json);
  Map<String, dynamic> toJson() => _$OrderItemToJson(this);
}

@JsonSerializable()
class Hotel {
  final String name;
  final String? location;
  
  Hotel({
    required this.name,
    this.location,
  });
  
  factory Hotel.fromJson(Map<String, dynamic> json) => _$HotelFromJson(json);
  Map<String, dynamic> toJson() => _$HotelToJson(this);
}
