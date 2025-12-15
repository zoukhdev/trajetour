import 'package:flutter/material.dart';

class OrderDetailScreen extends StatelessWidget {
  final String orderId;
  
  const OrderDetailScreen({super.key, required this.orderId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Détails Commande'),
      ),
      body: Center(
        child: Text('Détails de la commande $orderId - À implémenter'),
      ),
    );
  }
}
