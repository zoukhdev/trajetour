# Wahat Alrajaa Tour

Comprehensive management application for Wahat Alrajaa Tour, built with **React**, **TypeScript**, and **Vite**.

## Project Overview

This client-side application serves as the central management platform for the agency, providing tools for tour management, client relations, financial reporting, and agency administration.

## ✨ Features

Based on the application structure and navigation:

### 📊 Dashboard
- Real-time overview of key business metrics and performance indicators.

### 👥 Commandes (Orders)
- **Clients**: Management of client database.
- **Orders**: Tracking and processing of customer orders.
- **Suppliers**: Management of service providers and partners.
- **New Order**: Streamlined process for creating new bookings.
- **Offers**: Management of special offers and packages.
- **Agencies**: Partner agency coordination.

### 💰 Comptabilité (Accounting)
- **Reports**: Detailed financial reporting and analytics.
- **Commissions**: Tracking of agent and agency commissions.
- **Revenue**: Income analysis and visualization.
- **Expenses**: General operational expense tracking.
- **Guide Expenses**: Specific expense management for tour guides.

### 🏢 Gestion de l'Agence (Agency Management)
- **Annexes**: Management of branch locations.
- **Agency Details**: Configuration of core agency information.
- **Discounts**: Management of discount structures and rules.
- **Tax**: Tax configuration and compliance.
- **Users**: User administration and role-based access control.
- **Activity Logs**: System-wide audit trails.
- **Support**: Integrated support ticketing system.
- **Payments**: Payment processing and transaction history.
- **Rooming List**: Hotel room allocation and management.
- **Caisse**: Cash register and petty cash management.

## 🛠 Tech Stack

- **Framework**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [TailwindCSS](https://tailwindcss.com/)
- **Routing**: [React Router DOM](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **PDF Generation**: jsPDF, html2pdf.js
- **State/Context**: Built-in React Context API (`AuthContext`, `LanguageContext`)

## 🚀 Getting Started

### Prerequisites
- **Node.js**: LTS version recommended
- **npm** or **yarn**

### Installation

1. Clone the repository and navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

To start the development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

Access the application at `http://localhost:5173`.

### Build

To build the application for production:

```bash
npm run build
```

This will compile the TypeScript code and generate optimized assets in the `dist` folder.

### Linting

To run the linter and check for code quality issues:

```bash
npm run lint
```
