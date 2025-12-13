You are a full-stack developer tasked with implementing the new Supplier Inventory Management feature using the specialized `supplier_contracts` table for the Wahat Alrajaa Tour Management System.

**Project Context:**
* **Backend:** Node.js/Express, TypeScript, PostgreSQL (Neon), Zod validation.
* **Frontend:** React, TypeScript, React Context, Axios.
* **Relevant Tables:** `suppliers` (existing), `supplier_contracts` (new).

**Implementation Goals (Full Stack):**

1.  **Database Creation:** Create the new table `supplier_contracts`.
    * **Table Schema:**
        ```sql
        CREATE TABLE supplier_contracts (
            id UUID PRIMARY KEY,
            supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
            contract_type VARCHAR(50) NOT NULL, -- ['Rooms', 'Visa', 'Transportation', 'Flight', 'Food']
            date_purchased DATE NOT NULL DEFAULT CURRENT_DATE,
            contract_value DECIMAL(12,2) NOT NULL, -- Total value paid to supplier
            payment_currency VARCHAR(3) NOT NULL,
            exchange_rate DECIMAL(10,4) DEFAULT 1.0,
            details JSONB NOT NULL, -- Holds specialized contract data
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        ```
2.  **Backend API Endpoint:** Create a new resource route in `server/src/routes/supplierContracts.ts` and register it in `server.ts`.
    * `POST /suppliers/:id/contracts`: Create a new contract for a supplier.
    * `GET /suppliers/:id/contracts`: Get all contracts for a specific supplier.
    * `GET /supplier-contracts/:id`: Get a specific contract by ID.
3.  **Backend Validation (Zod):** Implement Zod schemas to validate the structure of the `details: JSONB` payload based on the `contract_type`. For example, the **'Rooms'** type must require `quantity`, `date_in`, `date_out`, etc.
4.  **Frontend Page/Component:** In the `client/src/pages/Suppliers/` section, create a **New Contract Form** component that uses dynamic rendering based on a selected `contract_type` dropdown:
    * When 'Rooms' is selected, display fields for `quantity`, `price_per_person_dzd`, `date_in`, `city_in`, etc.
    * When 'Visa' is selected, display fields for `price_per_visa` and `quantity`.
    * Use a unified state to collect all dynamic fields before submitting to the `details` JSONB column.
5.  **Frontend Data Context:** Update `DataContext.tsx` to include CRUD operations for `supplier_contracts` and link the creation logic to trigger a `transaction` of type 'OUT' to track the `contract_value` expense.