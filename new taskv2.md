## 💡 Project Implementation Prompt for Wahat Alrajaa Tour Management System

**Agent Role:** You are an expert Full-Stack Software Architect and Senior React/TypeScript/Node.js Developer. Your task is to design and provide the implementation steps, necessary code outlines, and architectural decisions to transition the current client-side application into a secure, scalable, and feature-rich full-stack system.

---

### 1. Project Context & Current State

The Wahat Alrajaa Tour Management System is a React + TypeScript application currently managing all operational data (Clients, Orders, Payments, Users) using **client-side localStorage**. The application has excellent front-end structure but suffers from critical security flaws, a lack of data persistence, and performance issues with large datasets.

**Technology Stack (Client):** React 19.2.0, TypeScript 5.9.3, Vite, TailwindCSS.
**Decision Made (Backend):** You will use **Node.js with Express** for the backend framework. The database will be **PostgreSQL** for its reliability and structure.

---

### 2. Implementation Goals (Required Tasks)

Implement the following critical and high-value features, prioritizing security and stability first.

#### A. Backend Foundation & Security (Critical)

1.  **Backend Implementation:** Design and set up a Node.js/Express server structure.
2.  **Data Migration:** Define the PostgreSQL schema for key entities (Users, Clients, Orders).
3.  **Authentication & Authorization:** Implement a **JWT-based authentication system**.
    * Hash passwords using **Bcrypt**.
    * Move all user passwords and role/permission checking logic (Authorization) to the server.
    * Use **HTTP-only cookies** for storing the JWT.

#### B. Quality, Stability, & Performance (High Priority)

4.  **Error Handling & Validation:**
    * Implement **Zod** (or Yup) schemas on the **server-side** to validate all incoming data for Order and Client creation/updates.
    * Implement **client-side Zod/Yup validation** for user feedback.
    * Add **Error Boundaries** in the React application to catch runtime errors.
    * Implement global `try-catch` blocks in API services and server routes.
5.  **Basic Testing:** Provide the setup and a minimal example for **Vitest** (or Jest) to unit-test a financial calculation utility function (e.g., `calculateTotal(items: OrderItem[])`).
6.  **Core Performance Optimization:**
    * Implement **server-side Pagination** for the `/orders` and `/clients` API endpoints.
    * Implement **React Router's lazy loading** and `Suspense` for all major page routes (Code Splitting).
    * Outline the use of `useMemo` or `useCallback` for optimizing filtering/searching logic on the client.
    * Suggest a **Skeleton Screen** component for data fetching states.

#### C. Advanced Features (Value-Add)

7.  **Audit Logs:** Design a server-side schema and mechanism to automatically log all C.R.U.D. operations on critical entities (Users, Orders, Payments), including the `userId`, `action`, `entityId`, and `timestamp`.
8.  **Customer Portal:** Outline the architectural changes for a separate, minimal client-facing portal that allows a user (Client) to log in and securely view their personal `Orders` and `Payments` (Read-only access).
9.  **Document/File Storage:** Propose a solution for storing sensitive files (e.g., Client Passport scans). Recommend using **AWS S3** or an equivalent service, and outline the necessary **pre-signed URL** mechanism for secure uploading and retrieval.
10. **GraphQL Implementation:** Provide a high-level **proof-of-concept design** for how GraphQL (using **Apollo Server/Express**) could replace the REST API for the `/reports` endpoint to efficiently fetch complex, nested data (e.g., Revenue vs. Expenses).
11. **Web Workers:** Recommend a specific use case (e.g., background PDF generation using `jspdf`) and provide the necessary **Web Worker setup code** to offload a heavy task and keep the main thread responsive.

---

### 3. Output Format and Deliverables

Your response must be structured using the following sections:

1.  **Architecture Overview:** A simple diagram showing the new structure (Client $\leftrightarrow$ Express API $\leftrightarrow$ PostgreSQL).
2.  **Implementation Roadmap (Prioritized List):** A step-by-step guide for a developer to follow.
3.  **Code Outlines & Snippets (Required):**
    * Node.js/Express Middleware for JWT verification.
    * Zod schema example for a client-side form.
    * React `ErrorBoundary` component structure.
    * Example implementation of `lazy` and `Suspense` for a route.
    * PostgreSQL schema for the **Audit Log** table.
    * Outline for the **Pre-Signed URL** generation logic on the server.
    * `useMemo` example for optimizing client-side filtering.

**Constraint:** Focus on providing the most efficient, secure, and production-ready solution for each point.