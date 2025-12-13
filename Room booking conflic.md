You are a full-stack developer tasked with implementing the Room Booking Conflict Resolution feature for the Wahat Alrajaa Tour Management System.

**Project Context:**
* **Backend:** Node.js/Express, TypeScript, PostgreSQL (Neon), Zod validation.
* **Frontend:** React, TypeScript, React Context, Axios.
* **Relevant Tables:** `orders` (stores passengers, hotels, dates via JSONB), `rooms` (stores hotel name, capacity, gender).

**Implementation Goals (Backend Priority):**

1.  **Database Update:** Create a new table `room_assignments` for explicit date-based room tracking.
    * **Table Schema:**
        ```sql
        CREATE TABLE room_assignments (
            id UUID PRIMARY KEY,
            room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
            order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
            passenger_id UUID, -- Reference to a passenger within the order's JSONB array
            assignment_date_in DATE NOT NULL,
            assignment_date_out DATE NOT NULL,
            gender VARCHAR(20) NOT NULL, -- Stored here for quick lookup
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        -- Add index for efficient overlap checks
        CREATE INDEX idx_room_dates ON room_assignments (room_id, assignment_date_in, assignment_date_out);
        ```
2.  **API Endpoint Creation/Modification:** Modify the existing `PUT /orders/:id` endpoint or create a new `POST /orders/:id/room-assignment` endpoint. Use the latter for focused logic.
3.  **Core Validation Logic (Middleware/Service):** Implement a service function, `validateRoomAssignment(room_id, assignment_date_in, assignment_date_out, new_passengers_details)` that executes the following checks:
    * **Capacity Overlap Check:** Query `room_assignments` for the given `room_id` where the assignment dates overlap with the new assignment dates:
        * `existing_date_in < new_date_out AND existing_date_out > new_date_in`
    * **Total Occupancy Calculation:** Sum the number of passengers already assigned in the overlapping period.
    * **Conflict Resolution:** If the `Total Occupancy` + `New Passengers Count` exceeds the `rooms.capacity`, return a **409 Conflict** error with a descriptive message (e.g., "Room 101 is fully booked for 3 days starting 2026-01-15").
    * **Gender Consistency Check:** If the `rooms.gender` is 'MEN' or 'WOMEN', ensure all passengers being assigned are of the correct gender.
4.  **Integration:** Upon successful validation, delete old assignments for the order and insert the new records into `room_assignments`.
5.  **Frontend Component:** Update the **Room Assignment Modal** in the `client/src/pages/Orders/` directory to call the new API endpoint and display the **409 Conflict** error message clearly if validation fails.