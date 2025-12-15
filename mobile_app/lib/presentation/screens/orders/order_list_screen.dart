import 'package:flutter/material.dart';

class OrderListScreen extends StatelessWidget {
  const OrderListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Commandes'),
      ),
      body: const Center(
        child: Text('Liste des commandes - À implémenter'),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // Navigate to order form
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}
