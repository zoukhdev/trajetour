Target Technology: Modern web framework (e.g., React/Angular/Vue with Tailwind CSS for styling) for a professional, responsive user interface.

Core Constraints & Requirements:

Visual Replication: The UI/UX should closely mimic the screenshots (Sidebar navigation, content tables, card layouts, Arabic support for content/labels).

Localization (Algeria):

The base currency is Algerian Dinar (DZD).

Payment methods must include Cash (Espèces), Bank Transfer (CCP/Baridimob), and standard methods (e.g., Credit).

Multi-Currency: Support for DZD, SAR, EUR, and USD.

Data Persistence: Use a modern database solution (like Firestore/MongoDB) to handle all data (users, orders, clients, expenses, exchange rates).

Multi-Role Access Control (RBAC): Implement the following roles: Admin, Operator, and Read-Only.

Phase 1: Foundation, Data Model & Authentication

This phase sets up the application structure, user authentication, and core financial data structure.

Tasks (P1)

Project Setup & Base UI: Create the main application structure and replicate the primary sidebar navigation menu visible across the screenshots (Dashboard, Clients, Commandes, Fournisseurs, Offres, Rabbateurs/Agences, Bilans, Charges, Utilisateurs, Caisse, etc.). Ensure the layout is fully responsive.

Authentication & Roles: Implement user login/signup and the three roles:

Admin: Full read/write access to all sections, including User Management and Exchange Rate Control.

Operator: Read/write access to Clients, Orders, and Offers. Limited access to Accounting (view only). Cannot manage users or change exchange rates.

Read-Only: View access only to all core data (Clients, Orders, Accounting reports).

Core Data Schema Design: Design the initial database schemas (JSON format) for:

Users: (id, username, email, role (Admin/Operator/Read-Only)).

Clients: (id, fullName, mobileNumber, type (Individual/Entreprise), passportDetails).

Agencies/Rabbateurs: (id, name, type (Agence/Rabbateur), creditStart, currentCredit).

Exchange Rate Management Card (Admin Dashboard):

Create a dedicated UI card on the Admin Dashboard titled "Gestion des Taux de Change" (Exchange Rate Management).

Provide input fields for SAR (Saudi Riyal), EUR (Euro), and USD (US Dollar).

The user must be able to manually input and save the exchange rate relative to the DZD (Algerian Dinar) (e.g., 1 EUR = 245 DZD).

The saved rates must be persisted and globally accessible for financial calculations.

Phase 2: Core Modules - Clients, Agencies & Orders

This phase focuses on the main business logic: managing customers, partners, and creating/tracking travel orders.

Tasks (P2)

Clients Module Replication:

Implement the Client List view (similar to FireShot 002), allowing search/filter.

Create the "Créer Client" form to capture Nom Complet, Numéro de Mobile, Type de Client, and Passport details (as seen in FireShot 006).

Agencies/Rabbateurs Module Replication:

Implement the Rabbateurs/Agences list view (similar to FireShot 008).

Create the "Créer Rabbateur/Agence" form, including fields for Nom, Type (Agence/Rabbateur), and CRÉDIT DE DÉPART (Initial Credit) as seen in FireShot 005.

Order Creation (Nouvelle commande):

Replicate the detailed order form (FireShot 006).

Fields must include selecting the main Client and associating an optional Rabbateur/Agence.

Include a section to add an Article/Service (e.g., "Omra/20 Decembre").

The form must calculate the total amount of the command.

Payment Processing & Status:

In the order details, implement a system to record payments.

Payment recording must include: Montant payé, Devise (if foreign), Taux de change utilisé (pulled from Phase 1), and Mode de Paiement (Cash, CCP, Baridimob, Bank Transfer, etc.).

The Order List must clearly display the ETAT (Status): Payé, Non payé, or Partiel (FireShot 003).

Phase 3: Financial & Accounting Features

This phase covers the accounting and expense tracking modules, crucial for local business operations.

Tasks (P3)

Charges (Expenses) Module:

Implement the Charges List view (FireShot 009) displaying CATEGORIE, DESIGNATION, MONTANT, and CAISSE.

Implement the "Créer Charge" form (FireShot 010). This form MUST support expenses in DZD, SAR, EUR, and USD.

When recording a non-DZD expense, the form must use the latest saved Taux de change (from Phase 1) to calculate the DZD equivalent for accounting records.

Caisse (Cash Register/Bank) Management:

Create a simplified Caisse module to track cash flow.

All payments received (Orders) and all payments disbursed (Charges) must automatically be recorded in the Caisse with the equivalent DZD value.

The Caisse should distinguish between different cash/bank locations (e.g., CCP account, Main Office Cash, SAR Cash Box).

Dashboard Metrics: Implement the key performance indicators (KPIs) shown on the main dashboard (FireShot 001):

Total ventes (Total Sales)

Montant reçu (Total Amount Received)

Montant créance (Total Outstanding Debt/Credit)

Ensure all monetary values are displayed primarily in DZD (Algerian Dinar).

Phase 4: User Management and Permissions Enforcement

This phase ensures the multi-role system is functional across the application.

Tasks (P4)

User Management Module (Utilisateurs):

Create a section (accessible only by Admin) to view, add, and edit users.

The Admin must be able to assign the Admin, Operator, or Read-Only role to any user.

Role-Based Access Control (RBAC) Enforcement: Implement the following mandatory checks:

Admin: Can access and modify all data and settings (including exchange rates and user roles).

Operator: Can view the dashboard, clients, agencies, orders, and offers. Cannot access or view the Utilisateurs or the Gestion des Taux de Change card. Can only view Bilans and Charges lists.

Read-Only: Cannot see any "Créer," "Modifier," or "Supprimer" buttons across all modules (Clients, Orders, Charges). The sidebar must restrict them from accessing the Utilisateurs or Gestion des Taux de Change pages.

Operator Assignment: Ensure the OPERATEUR field in the Commandes list (FireShot 003) is automatically populated with the name of the user who created the order.

Phase 5: UI/UX Replication and Final Polish

This phase focuses on visual fidelity, responsiveness, and language support.

Tasks (P5)

Styling and Aesthetics: Use a color palette and layout that closely matches the provided screenshots (e.g., primary colors, card design, data table look and feel). Ensure modern, clean design using Tailwind CSS.

Responsiveness: Verify that all data tables, forms, and the sidebar collapse correctly for mobile and tablet viewing.

Internationalization (i18n):

Ensure the UI supports both French (Français) and Arabic language display, particularly for all labels, navigation items, and data column headers (matching the mixed Arabic/French labels in the screenshots). The default language on first load should be set to French or Arabic, and a language toggle should be available.

Data Persistence Check: Conduct a final verification that all data saved in Phases 1-4 (Exchange Rates, Clients, Orders, Charges) persists correctly in the database and is loaded in real-time.



so as we finished almost the UI sections now give me your ideas and options how to make all these sections to work together iand then how to lunch it for operation for testing 