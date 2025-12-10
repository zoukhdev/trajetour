# 🚀 Wahat Alrajaa TMS - Feature Implementation Prompt

## Goal

[cite_start]Implement the following critical operational and financial features to support B2B, Group Leader commissions, and multi-currency accounting with manual exchange rates in the Wahat Alrajaa Tour Management System[cite: 1].

## I. Operational & Commission Requirements (B2B & Group Leader)

**Reference Files:**
* [cite_start]**Order Form:** `[client/src/pages/Orders/OrderForm.tsx]` [cite: 10, 11]
* [cite_start]**Order Controller:** `server/src/controllers/OrderController.ts` (Conceptual) [cite: 6]
* [cite_start]**Types/Interfaces:** `[client/src/types/index.ts]` [cite: 4, 14]
* [cite_start]**Agency Management:** `[client/src/pages/Agencies/AgencyForm.tsx]` [cite: 8]

### 1. Data Model Changes

[cite_start]Modify the following interfaces in `[client/src/types/index.ts]`[cite: 4, 14]:

| Interface | Field Name | Type | Description |
| :--- | :--- | :--- | :--- |
| **Offer** | `defaultAgencyCommission` | `number \| null` | The suggested commission amount (in DZD) to be pre-populated when an Order is created for an Agency. |
| **Order** | `agencyId` | `string \| null` | Existing field. Ensure it links to the Agency or Group Leader profile. |
| **Order** | `commissionPerPassengerDZD` | `number \| null` | **Manual Input:** The final agreed commission (in DZD) per passenger for this specific B2B/Group Leader booking. |
| **Agency** | `type` | `'Agency' \| 'GroupLeader'` | Update the existing Agency model to distinguish between formal agencies and individual commission-based agents ("Rabbateur"). |

### 2. Controller & Business Logic

[cite_start]Implement the following in the Order Controller (conceptual `server/src/controllers/OrderController.ts`)[cite: 6]:

* **Commission Calculation Logic:**
    * When saving an Order where `agencyId` is present:
        * [cite_start]Retrieve the number of passengers from the Order (based on items/passengers in the new Order model structure [cite: 10]).
        * Calculate the total commission payable:
            $$\text{Total Commission Payable (DZD)} = \text{Number of Passengers} \times \text{Order.commissionPerPassengerDZD}$$
        * Store this amount in a new financial liability record, linked to the `agencyId` profile, categorized as `Commission Payable (Out)` or `Commission Payable (In)`.

* **Offer Capacity Management:**
    * [cite_start]Ensure that when an Order is successfully created, the system deducts the number of passengers from the corresponding **Offer**'s `availability`[cite: 9].

## II. Financial & Multi-Currency Requirements

**Reference Files:**
* [cite_start]**Exchange Rate Context:** `[client/src/context/ExchangeRateContext.tsx]` [cite: 12]
* [cite_start]**Caisse/Accounts Page:** `[client/src/pages/Caisse/CaissePage.tsx]` [cite: 12]
* [cite_start]**Payment List:** `[client/src/pages/Payments/PaymentList.tsx]` [cite: 12]
* [cite_start]**Payment Model:** **Payment** interface [cite: 14]

### 1. Exchange Rate Management (Manual Input)

* [cite_start]**Action:** In `[client/src/context/ExchangeRateContext.tsx]`, disable any "Real-time rate updates" functionality[cite: 12].
* **Implementation:** Ensure the system forces **manual, daily configuration** of the SAR/DZD and EURO/DZD rates via the Exchange Rate Management interface.

### 2. Payment Processing and Conversion

* [cite_start]**Payment Conversion:** When a **Payment** is recorded in a foreign currency (SAR or EURO)[cite: 12]:
    * [cite_start]The system must retrieve the **manually configured exchange rate** valid for the **Payment Date**[cite: 12].
    * The DZD equivalent must be calculated and stored in the **Payment** record for reconciliation purposes.
    * **Payment Fields Update (in `Payment` interface):** Add `DZDequivalent: number` and `exchangeRateUsed: number`.

### 3. Caisse/Main NET Total Consolidation

* [cite_start]**Account Structure:** Ensure the **BankAccount** model [cite: 14] supports the following accounts: `SAR Account`, `EURO Account`, `Current Account`, `Ramadan Treasury`, `Office Account`, `Safe Account`, and `Bank Account`.
* [cite_start]**Implementation:** In the **Cash Register (Caisse)** component (`[client/src/pages/Caisse/CaissePage.tsx]`)[cite: 12], calculate the **Main NET Total (DZD)** using the following logic:

    * All DZD-based accounts are summed directly.
    * [cite_start]Foreign currency accounts (SAR, EURO) are aggregated using the **Current Day's manually configured exchange rate** from the `ExchangeRateContext`[cite: 12].

    $$\text{NET Total (DZD)} = \sum \text{DZD Accounts} + \left( \text{SAR Balance} \times \text{Current SAR/DZD Rate} \right) + \left( \text{EURO Balance} \times \text{Current EURO/DZD Rate} \right)$$

## III. Security & Development Pre-requisites

* [cite_start]**Production Readiness:** Ensure all implemented features are tested with the authentication system *re-enabled*[cite: 8]. [cite_start]The temporary development bypass must be removed before deployment[cite: 16].
* [cite_start]**Zod Validation:** Apply Zod validation [cite: 18] to the new `commissionPerPassengerDZD` field to ensure it is a valid positive number.

---

**Output Requirement:** Provide the modified code snippets for the interfaces, the core logic within the Order Controller, and the calculation in the Caisse component.