import 'package:flutter/material.dart';

class ClientFormScreen extends StatelessWidget {
  final String? clientId;
  
  const ClientFormScreen({super.key, this.clientId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(clientId == null ? 'Nouveau Client' : 'Modifier Client'),
      ),
      body: const Center(
        child: Text('Formulaire client - À implémenter'),
      ),
    );
  }
}
