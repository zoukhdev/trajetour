# 🌍 Project Concept & Executive Summary: Trajetour Platform

> **Vision:** A comprehensive SaaS ecosystem specialized in travel agency operations for Omra, Haj, and international tours.

---

## 🏗️ 1. Project Overview & Ecosystem
The **Trajetour** platform is a full-stack, enterprise-grade solution that bridges the gap between travel agencies, suppliers, and final clients. It is designed to modernize and digitize the workflow of religious tourism and travel management.

### 🌐 The Ecosystem Components:
- **`server/` (The Core Engine):** A robust Node.js Express API using TypeScript. Orchestrates the database logic, tenant management, and multi-currency financial transactions.
- **`client/` (Web Administration):** A high-performance React (Vite) application. Serving as the master control panel for agency admins, staff, and cashiers with 35+ specialized management pages.
- **`mobile/` (The Field App):** A professional Expo-based mobile application. Designed for field agents and mobile access, enabling real-time booking and passenger management.
- **`stitch_homepage_travel_agency/` (Design Framework):** A comprehensive suite of specialized landing pages and UI prototypes for distinct travel modules (Omra, Haj, Agency Portal).

---

## 💡 2. Core Concepts & Objectives
The platform is built on several key pillars that define its competitive edge:

### A. Professional Tourism Management
Specifically tailored for the complexities of **Omra and Haj**, handling hotel room inventory by gender, age-based pricing, and passenger passport data with automated expiry tracking.

### B. Multi-Currency Financial Architecture
Uniquely designed for international operations, supporting **DZD, EUR, USD, and SAR**. Features real-time exchange rate management and automated balance calculations across multiple cash and bank accounts.

### C. Multi-Tenant SaaS Capability
Enables the master administration to manage multiple partner agencies, credit balances, and subscription tiers (Standard, Premium, Gold), fostering a B2B network of agencies and "Rabbateurs".

### D. Operational Transparency
Embedded audit logs, detailed transaction tracking, and automated PDF report generation (jsPDF) ensure full traceability of every cent and every booking.

---

## 💎 3. Key Modules & Features
| Module | Primary Function |
| :--- | :--- |
| **Client Control** | Comprehensive CRM with Individual & Enterprise profiles. |
| **Order Engine** | Complex booking logic for multifaceted travel items. |
| **Financial Ledger** | Multi-account management (Caisse & Bank) with IN/OUT transaction tracking. |
| **Inventory Manager** | Hotel room allocation with gender-based logic (MEN/WOMEN/MIXED). |
| **Package Builder** | Dynamic travel offer creation with pricing child/infant logic. |
| **Security Center** | Role-based Access Control (Admin, Staff, Caisser) with JWT security. |

---

## 🛠️ 4. Technology Stack Highlights
A modern, scalable stack chosen for reliability and performance:
- **Backend:** Node.js, Express, TypeScript, PostgreSQL (Neon Serverless).
- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS, Lucide Icons.
- **Mobile:** Expo, React Native, NativeWind (Tailwind for mobile).
- **Infrastructure:** Cloudinary (Media), Render/DigitalOcean (Hosting), Zod (Validation).

---

## 📈 5. Future Growth & Roadmap
- **International Expansion:** Multi-language support (already starting with French/Arabic).
- **Automation:** Smart database provisioning for new tenant agencies.
- **Connectivity:** Real-time push notifications for agents and clients (Firebase).
- **Performance:** Offline-first capabilities for the mobile application to support field agents in low-connectivity areas.

---
*Created on 2026-03-27 for the Trajetour Development Team.*
