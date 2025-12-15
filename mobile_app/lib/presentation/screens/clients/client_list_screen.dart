import 'package:flutter/material.dart';

class ClientListScreen extends StatelessWidget {
  const ClientListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Clients'),
      ),
      body: const Center(
        child: Text('Liste des clients - À implémenter'),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // Navigate to client form
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}
