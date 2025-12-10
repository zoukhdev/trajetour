---
description: How to launch and test the application
---

# Application Launch & Test Guide

This guide explains how to run the application for development, testing, and production simulation.

## Prerequisites
- Node.js installed
- Dependencies installed (`npm install`)

## 1. Development Mode
Use this for active development. It provides hot-reloading.

```bash
cd client
npm run dev
```

### Mobile Testing
To test on a mobile device or another computer on the same network:

```bash
cd client
npm run dev -- --host
```
Then access the URL shown (e.g., `http://192.168.1.x:5173`) from your phone.

## 2. Production Simulation
Use this to verify the built application before deployment.

```bash
cd client
# Build the application
npm run build

# Preview the build
npm run preview
```

## 3. Integration Testing Scenarios

### Scenario A: Order to Cash Flow
1. Create a **Bank Account** (e.g., "Caisse Principale") in **Caisse** page.
2. Create a new **Order** in **Commandes**.
3. Go to the Order Details and click **Ajouter Paiement**.
4. Select the "Caisse Principale" as the receiving account.
5. Go back to **Caisse** page.
6. Verify:
    - A new Transaction ("Entrée") appears.
    - The "Caisse Principale" balance has increased.

### Scenario B: Expense Tracking
1. Create a new **Expense** in **Dépenses**.
2. Verify it appears in the **Caisse** page as a "Sortie" (Transaction).
   *(Note: Expense Form might need update to select source account to fully automate balance deduction)*.
