# Supplier Inventory Management - Implementation Plan

## Overview

Implement a comprehensive supplier contract management system that tracks purchases from suppliers (rooms, visas, transportation, flights, food) with dynamic contract details and automatic expense transaction creation.

---

## User Review Required

> [!IMPORTANT]
> **Transaction Auto-Creation Logic**
> When a supplier contract is created, the system will automatically create an expense transaction of type 'OUT' for the `contract_value`. This affects the cash register balance immediately.
> 
> **Confirm:** Should contract creation automatically deduct from selected bank account?

> [!WARNING]
> **JSONB Details Validation**
> Each contract type has different required fields stored in JSONB. The frontend must enforce these structures before submission to prevent validation errors.

---

## Proposed Changes

### Database Layer

#### [NEW] [supplier_contracts table](file:///d:/WRtour/server/src/models/schema.sql)

```sql
CREATE TABLE supplier_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID REFERENCES suppliers(id) ON DELETE CASCADE,
    contract_type VARCHAR(50) NOT NULL CHECK (contract_type IN ('Rooms', 'Visa', 'Transportation', 'Flight', 'Food')),
    date_purchased DATE NOT NULL DEFAULT CURRENT_DATE,
    contract_value DECIMAL(12,2) NOT NULL,
    payment_currency VARCHAR(3) NOT NULL CHECK (payment_currency IN ('DZD', 'EUR', 'USD', 'SAR')),
    exchange_rate DECIMAL(10,4) NOT NULL DEFAULT 1.0,
    contract_value_dzd DECIMAL(12,2) NOT NULL,
    details JSONB NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_supplier_contracts_supplier ON supplier_contracts(supplier_id);
CREATE INDEX idx_supplier_contracts_type ON supplier_contracts(contract_type);
CREATE INDEX idx_supplier_contracts_date ON supplier_contracts(date_purchased DESC);
```

**Details JSONB Structure by Contract Type:**

**Type: 'Rooms'**
```typescript
{
  quantity: number;           // Number of rooms
  pricePerPersonDzd: number;  // Price per person in DZD
  dateIn: string;             // Check-in date (ISO)
  dateOut: string;            // Check-out date (ISO)
  cityIn: string;             // City name
  hotelName: string;          // Hotel name
  roomType?: string;          // Optional: Single, Double, Triple, Quad
  mealsIncluded?: boolean;    // Optional
}
```

**Type: 'Visa'**
```typescript
{
  quantity: number;           // Number of visas
  pricePerVisa: number;       // Price per visa
  visaType: string;           // e.g., "Tourist", "Business", "Omra"
  processingDays?: number;    // Optional
  country: string;            // Destination country
}
```

**Type: 'Transportation'**
```typescript
{
  vehicleType: string;        // Bus, Van, Car
  quantity: number;           // Number of vehicles
  pricePerUnit: number;       // Price per vehicle
  route: string;              // e.g., "Alger → Mecca"
  dateFrom: string;           // Start date
  dateTo: string;             // End date
  capacity?: number;          // Passenger capacity
}
```

**Type: 'Flight'**
```typescript
{
  airline: string;            // Airline name
  ticketQuantity: number;     // Number of tickets
  pricePerTicket: number;     // Price per ticket
  departure: {
    airport: string;          // Departure airport code
    date: string;             // ISO date
  };
  arrival: {
    airport: string;          // Arrival airport code
    date: string;             // ISO date
  };
  flightNumber?: string;      // Optional
  class?: string;             // Economy, Business, First
}
```

**Type: 'Food'**
```typescript
{
  mealType: string;           // Breakfast, Lunch, Dinner, Catering
  quantity: number;           // Number of meals
  pricePerMeal: number;       // Price per meal
  dateFrom: string;           // Start date
  dateTo: string;             // End date
  location: string;           // Where meals are provided
  dietaryNotes?: string;      // Optional: Halal, Vegetarian, etc.
}
```

---

### Backend Implementation

#### [NEW] [supplierContracts.ts](file:///d:/WRtour/server/src/routes/supplierContracts.ts)

**Endpoints:**

1. **POST /api/suppliers/:id/contracts**
   - Create contract for specific supplier
   - Validate JSONB details based on contract_type
   - Auto-create expense transaction

2. **GET /api/suppliers/:id/contracts**
   - Get all contracts for a supplier
   - Sort by date_purchased DESC

3. **GET /api/supplier-contracts/:id**
   - Get specific contract by ID
   - Include supplier details

4. **PUT /api/supplier-contracts/:id**
   - Update contract details
   - Recalculate DZD value if currency/rate changes

5. **DELETE /api/supplier-contracts/:id**
   - Delete contract
   - Ask: Should we also delete associated transaction?

---

#### [NEW] [contractValidation.ts](file:///d:/WRtour/server/src/middleware/contractValidation.ts)

Zod schemas for each contract type:

```typescript
const roomsDetailsSchema = z.object({
  quantity: z.number().int().positive(),
  pricePerPersonDzd: z.number().positive(),
  dateIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cityIn: z.string().min(1),
  hotelName: z.string().min(1),
  roomType: z.string().optional(),
  mealsIncluded: z.boolean().optional()
});

const visaDetailsSchema = z.object({
  quantity: z.number().int().positive(),
  pricePerVisa: z.number().positive(),
  visaType: z.string().min(1),
  processingDays: z.number().int().optional(),
  country: z.string().min(1)
});

// ... and so on for other types

export const validateContractDetails = (type: string, details: any) => {
  const schemas = {
    'Rooms': roomsDetailsSchema,
    'Visa': visaDetailsSchema,
    'Transportation': transportationDetailsSchema,
    'Flight': flightDetailsSchema,
    'Food': foodDetailsSchema
  };
  
  const schema = schemas[type];
  if (!schema) throw new Error('Invalid contract type');
  
  return schema.parse(details);
};
```

---

#### [MODIFY] [server.ts](file:///d:/WRtour/server/src/server.ts)

Register new route:

```typescript
import supplierContractsRoutes from './routes/supplierContracts.js';
app.use('/api/supplier-contracts', supplierContractsRoutes);
app.use('/api/suppliers/:id/contracts', supplierContractsRoutes);
```

---

### Frontend Implementation

#### [NEW] [ContractForm.tsx](file:///d:/WRtour/client/src/pages/Suppliers/ContractForm.tsx)

Dynamic form component with contract type selector:

**Features:**
- Dropdown to select contract type
- Dynamic field rendering based on type
- Currency selector with exchange rate input
- Date pickers for relevant fields
- Real-time contract value calculation
- Submit to create contract

**Component Structure:**
```tsx
export const ContractForm = ({ supplierId, onSuccess, onCancel }) => {
  const [contractType, setContractType] = useState<ContractType>('Rooms');
  const [details, setDetails] = useState({});
  const [currency, setCurrency] = useState('DZD');
  const [exchangeRate, setExchangeRate] = useState(1.0);
  
  const renderDynamicFields = () => {
    switch (contractType) {
      case 'Rooms':
        return <RoomsFields details={details} onChange={setDetails} />;
      case 'Visa':
        return <VisaFields details={details} onChange={setDetails} />;
      // ... etc
    }
  };
  
  const calculateTotal = () => {
    // Calculate based on contract type
    // e.g., for Rooms: quantity * pricePerPersonDzd
  };
  
  // ...
};
```

---

#### [NEW] Dynamic Field Components

**RoomsFields.tsx**
```tsx
export const RoomsFields = ({ details, onChange }) => (
  <>
    <Input label="Quantity" type="number" value={details.quantity} />
    <Input label="Price per Person (DZD)" type="number" value={details.pricePerPersonDzd} />
    <DatePicker label="Check-in Date" value={details.dateIn} />
    <DatePicker label="Check-out Date" value={details.dateOut} />
    <Input label="City" value={details.cityIn} />
    <Input label="Hotel Name" value={details.hotelName} />
    <Select label="Room Type" options={['Single', 'Double', 'Triple', 'Quad']} />
    <Checkbox label="Meals Included" checked={details.mealsIncluded} />
  </>
);
```

Similar components for other types: `VisaFields`, `TransportationFields`, `FlightFields`, `FoodFields`.

---

#### [MODIFY] [SupplierList.tsx](file:///d:/WRtour/client/src/pages/Suppliers/SupplierList.tsx)

Add "View Contracts" action for each supplier:

```tsx
<button onClick={() => navigate(`/suppliers/${supplier.id}/contracts`)}>
  <Package className="w-4 h-4" /> View Contracts ({contractCount})
</button>
```

---

#### [NEW] [SupplierContracts.tsx](file:///d:/WRtour/client/src/pages/Suppliers/SupplierContracts.tsx)

Page to view all contracts for a supplier:

**Features:**
- Table of contracts with type, date, value
- Filter by contract type
- Expand row to see details JSONB
- "Add New Contract" button
- Edit/Delete actions

---

#### [MODIFY] [DataContext.tsx](file:///d:/WRtour/client/src/context/DataContext.tsx)

Add supplier contracts state and CRUD operations:

```typescript
interface DataContextType {
  // ... existing
  supplierContracts: SupplierContract[];
  addSupplierContract: (contract: SupplierContract) => Promise<void>;
  updateSupplierContract: (contract: SupplierContract) => Promise<void>;
  deleteSupplierContract: (id: string) => Promise<void>;
}

const addSupplierContract = async (contract: SupplierContract) => {
  const newContract = await supplierContractsAPI.create(contract);
  setSupplierContracts(prev => [newContract, ...prev]);
  
  // Auto-create expense transaction
  const transaction: Transaction = {
    id: '',
    type: 'OUT',
    amount: contract.contractValue,
    currency: contract.paymentCurrency,
    amountDZD: contract.contractValueDzd,
    source: 'Expense',
    referenceId: newContract.id,
    description: `Supplier Contract: ${contract.contractType} - ${supplier.name}`,
    date: contract.datePurchased,
    accountId: contract.accountId // From form
  };
  await addTransaction(transaction);
};
```

---

#### [NEW] [api.ts additions](file:///d:/WRtour/client/src/services/api.ts)

```typescript
export const supplierContractsAPI = {
  getAll: (supplierId?: string) => 
    supplierId 
      ? api.get(`/suppliers/${supplierId}/contracts`)
      : api.get('/supplier-contracts'),
      
  getById: (id: string) => 
    api.get(`/supplier-contracts/${id}`),
    
  create: (supplierId: string, data: any) => 
    api.post(`/suppliers/${supplierId}/contracts`, data),
    
  update: (id: string, data: any) => 
    api.put(`/supplier-contracts/${id}`, data),
    
  delete: (id: string) => 
    api.delete(`/supplier-contracts/${id}`)
};
```

---

### TypeScript Types

#### [MODIFY] [types/index.ts](file:///d:/WRtour/client/src/types/index.ts)

```typescript
export type ContractType = 'Rooms' | 'Visa' | 'Transportation' | 'Flight' | 'Food';

export interface SupplierContract {
  id: string;
  supplierId: string;
  contractType: ContractType;
  datePurchased: string;
  contractValue: number;
  paymentCurrency: string;
  exchangeRate: number;
  contractValueDzd: number;
  details: RoomsDetails | VisaDetails | TransportationDetails | FlightDetails | FoodDetails;
  notes?: string;
  createdAt: string;
}

export interface RoomsDetails {
  quantity: number;
  pricePerPersonDzd: number;
  dateIn: string;
  dateOut: string;
  cityIn: string;
  hotelName: string;
  roomType?: string;
  mealsIncluded?: boolean;
}

// ... similar interfaces for other types
```

---

## Verification Plan

### Automated Tests

**Backend API Tests:**
```typescript
describe('Supplier Contracts API', () => {
  test('should create Rooms contract with valid details', async () => {
    const contract = {
      contractType: 'Rooms',
      contractValue: 50000,
      paymentCurrency: 'DZD',
      details: {
        quantity: 10,
        pricePerPersonDzd: 5000,
        dateIn: '2026-01-15',
        dateOut: '2026-01-20',
        cityIn: 'Mecca',
        hotelName: 'Al-Safwa'
      }
    };
    
    const res = await request(app)
      .post('/api/suppliers/uuid/contracts')
      .send(contract)
      .expect(201);
      
    expect(res.body.contractType).toBe('Rooms');
  });
  
  test('should reject invalid details structure', async () => {
    const contract = {
      contractType: 'Rooms',
      details: { invalid: 'data' } // Missing required fields
    };
    
    await request(app)
      .post('/api/suppliers/uuid/contracts')
      .send(contract)
      .expect(400);
  });
});
```

### Manual Verification

1. **Create Rooms Contract**
   - Fill form with room details
   - Verify JSONB stored correctly
   - Check transaction created

2. **Create Visa Contract**
   - Switch to Visa type
   - Verify different fields shown
   - Submit and check database

3. **Multi-Currency Test**
   - Create contract in EUR
   - Verify DZD conversion
   - Check transaction amount

4. **View Supplier Contracts**
   - Navigate to supplier contracts page
   - Verify all contracts displayed
   - Check filtering by type works

---

## Migration Strategy

1. **Phase 1:** Create `supplier_contracts` table
2. **Phase 2:** Deploy backend API
3. **Phase 3:** Deploy frontend forms
4. **Phase 4:** Train users on new feature

---

## UI/UX Improvements

### Contract Type Icons
```tsx
const contractIcons = {
  'Rooms': <Hotel />,
  'Visa': <FileText />,
  'Transportation': <Bus />,
  'Flight': <Plane />,
  'Food': <Utensils />
};
```

### Contract Summary Cards
Display visual cards for each contract type with key metrics:
- Rooms: Total capacity, Date range, City
- Visa: Quantity, Type, Country
- Flight: Route, Dates, Passengers

---

## Security Considerations

- ✅ Require 'admin' permission for contract creation
- ✅ Validate all JSONB fields on backend
- ✅ Prevent SQL injection via parameterized queries
- ✅ Audit log for contract changes

---

## Performance Optimization

- ✅ Index on supplier_id for fast lookups
- ✅ Index on contract_type for filtering
- ✅ Paginate contract lists if > 50 items
- ✅ Cache supplier data to avoid joins

---

**Estimated Development Time:** 8-12 hours
**Priority:** Medium
**Dependencies:** None
