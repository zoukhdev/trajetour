# 🤖 AI AGENT PROMPT: ROOM ALLOCATION & MANAGEMENT MODULE IMPLEMENTATION

## 🎯 1. ROLE AND GOAL

**ROLE**: You are a Senior Full-Stack Developer specializing in Node.js/Express (Backend) and React/TypeScript (Frontend). Your task is to design and implement a new feature module for the existing **Wahat Alrajaa Tour Management System**.

**GOAL**: Design and implement the backend, database migrations, and frontend components for a **Room Allocation and Management** module (`/rooms`) that manages the static inventory of available rooms per hotel/offer and tracks dynamic passenger occupancy.

## 🏗️ 2. PROJECT CONTEXT & ARCHITECTURE

The platform is a Monorepo using the following stack:
* **Frontend**: React 18, TypeScript, Tailwind CSS.
* **Backend**: Node.js, Express, PostgreSQL.
* **Database**: PostgreSQL (Existing key tables: `orders`, `offers`, `suppliers`, `clients`).
* **Authentication**: JWT-based with Role-Based Access Control (RBAC).
* **Relevant Roles**: `admin`, `staff` (The new module should be accessible to both).

## 💾 3. REQUIRED DATABASE CHANGES (MIGRATION SPEC)

### 3.1. New Table: `rooms`
A new table must be created to hold the static inventory of rooms available for a specific travel **Offer**.

| Field Name | Data Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | Primary Key | Unique room identifier. |
| `offer_id` | `UUID` | Foreign Key to `offers` | Links the room inventory to a specific package (e.g., "Omra Decembre"). |
| `hotel_name` | `VARCHAR` | NOT NULL | The name of the Hotel/Building (can be referenced from `/suppliers`). |
| `room_number` | `VARCHAR` | NOT NULL | The physical room identifier (e.g., "101"). |
| `capacity` | `INTEGER` | NOT NULL | Total number of beds in the room (e.g., 4). |
| `gender_restriction` | `ENUM` | NOT NULL | Must be one of: `'MEN'`, `'WOMEN'`, `'MIXED'`. |
| `status` | `ENUM` | Default: `'ACTIVE'` | `'ACTIVE'` / `'OUT_OF_SERVICE'`. |

### 3.2. Existing Table Update: `orders`
The existing `orders` table has a `passengers` array stored as `JSONB`. This needs to be conceptually updated to ensure each passenger has an assigned room.

**TASK**: Update the **passenger object** structure within the `orders.passengers` JSONB array to include a room assignment reference:
* Add a new field to the passenger object: `assigned_room_id: UUID` (references `rooms.id`).

## ⚙️ 4. CORE FUNCTIONAL REQUIREMENTS

The module must fulfill the following operational requirements:

### 4.1. Inventory Management CRUD (Backend)
1.  **POST `/api/rooms`**: Create a new room entry (Requires `admin`/`staff` role).
2.  **PUT `/api/rooms/:id`**: Update room capacity, number, hotel, or gender restriction.
3.  **DELETE `/api/rooms/:id`**: Mark a room as `OUT_OF_SERVICE`.

### 4.2. Order/Passenger Assignment Integration (Frontend & Backend)
1.  **Order Creation Flow**: During the new order submission process (`/orders-v2`), after passenger details are entered, a new step is added: **Room Assignment**.
2.  **Selection Interface**: A user must be able to select an available room (`rooms.id`) for *each* passenger being added.
3.  **Validation Logic (CRITICAL)**: The backend must validate two things before allowing assignment:
    * **Capacity Check**: Is the room's current occupancy (based on `orders.passengers` linked to this `rooms.id`) less than `rooms.capacity`?
    * **Gender Check**: Does the passenger's gender (from `clients` or `orders` details) match the `rooms.gender_restriction`? (e.g., a male passenger cannot be assigned to a 'WOMEN' room).

### 4.3. Dynamic Room Re-assignment (Key Feature)
1.  **Requirement**: If a client's room is changed (e.g., they move from Room 101 to Room 102), the system must update the `assigned_room_id` in the `orders.passengers` object for that specific client.
2.  **API**: Implement a dedicated endpoint (e.g., **PUT `/api/orders/:orderId/passenger/:passengerId/assign-room`**) to handle the move in a single transaction.

## 🎨 5. VISUAL & UI REQUIREMENTS

The frontend visualization for `/rooms` must be a high-level operational dashboard, similar to the provided visual example (`EN_room_layout.webp`):

* **Display**: Show all available rooms for a selected `offer_id` (package).
* **Component**: Each room should be represented as an interactive **Card**.
* **Card Details**:
    * **Room Number** (e.g., 101).
    * **Hotel Name**.
    * **Total Capacity** (e.g., 4 beds).
    * **Gender/Restriction** (Men/Women/Mixed).
    * **Occupancy Status**: (e.g., "3/4 Occupied").
    * **Passenger List**: Display the names of currently assigned passengers (derived from the `orders` table via `assigned_room_id`).
* **Interaction**: The card should have a clear **Modify Assignment** or **Reassign** button to trigger the client change functionality described in 4.3.

## ✅ 6. EXPECTED DELIVERABLES (OUTPUT)

Provide the following implementation plan in a single, structured response:

1.  **Database Migration SQL/Schema**: The exact SQL or ORM definition for the new `rooms` table.
2.  **Backend API Specification**: List the required endpoints (URL, HTTP Method, Brief Description, Required Role) for the `rooms` module and the updated `orders` assignment endpoint.
3.  **Component Design Logic (Pseudocode/Explanation)**: A high-level description of the logic for the **Room Card** component and the **Assignment Validation** logic.