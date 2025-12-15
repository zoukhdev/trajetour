import 'package:flutter/material.dart';

class OrderFormScreen extends StatelessWidget {
  final String? orderId;
  
  const OrderFormScreen({super.key, this.orderId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(orderId == null ? 'Nouvelle Commande' : 'Modifier Commande'),
      ),
      body: const Center(
        child: Text('Formulaire de commande - À implémenter'),
      ),
    );
  }
}
