# 📋 SaaS Features & Architecture Proposal

This document outlines the architecture, database schema changes, and UI workflows to implement your requested items across the **SaaS Homepage**, **Agency Dashboard**, and **Master Dashboard**.

---

## 1. 💳 Subscription Plans Strategy & Differentiators
To make plans convincing for travel agencies, we should tier them by **Capacity** (users, storage) and **Advanced Operations** (features unlocked).

### Tier Breakdown Proposal
| Feature / Limit | **Standard Plan** (Starter) | **Premium Plan** (Growth) | **Gold / Enterprise Plan** |
| :--- | :--- | :--- | :--- |
| **Ideal For** | Independent Agents / Small offices | Medium Agencies scaling ops | Large Agencies / Franchises |
| **Users / Staff** | Max 3 Staff | Max 10 Staff | **Unlimited Staff** |
| **Listings Capacity** | 30 Offers / Packs | 200 Offers / Packs | **Unlimited Offers** |
| **White-label Feature** | No (Trajetour Subdomain) | Yes (**Custom Domain Support**) | Yes (**Custom Domain Support**) |
| **Landing Page Theme** | Default Theme | 2 Premium Themes | **Full Builder / No-Code Editor** |
| **Client CRM Capacity**| 500 Clients | Unlimited | Unlimited |
| **Audit Logs/Tracking**| Basic (Login only) | 30-Day Activity Log | **Infinite Full Activity Audit Log** |
| **Support SLA** | Normal Email Mode | Priority Help Desk | **24/7 Priority + Dedicated chat** |

### 🚀 Homepage & Registration Section Layout
*   **Pricing Grid:** Displays cards side-by-side with comparison checkmarks.
*   **"Agency Growth Dashboard" highlights:** Include terms like "Earn unlimited commissions", "Centralized CRM", "Contract Managers".
*   **Automatic Gating logic:** Validate limits (`staff_count >= current_plan_limit`) in the backend to prevent creators pushing beyond boundaries if not upgraded.

---

## 2. 🔄 Subscription Upgrades & Approve Workflows
We will add a formal approval locking mechanism inside states.

### 🏠 **Agency Dashboard Side**
1. **Route:** `/settings/subscription`
2. **UI Action:** A button labeled **"Upgrade Plan"** triggering a Modal modal picker displaying Pricing Tables triggers layouts.
3. **Logic Details:** Clicking triggers creation setup inside `agency_approvals` table labeled `type: "subscription_upgrade"`, `status: "pending"`.
4. **Visibility Node State:** Page displays "Your upgrade to Premium is pending approval from Master Dashboard."

### 👑 **Master Dashboard Side**
1. **Route:** `/agencies/:id`
2. **Review Feature Frame Layout:** Section reads `"Pending Approvals"`. Approve buttons trigger `UPDATE agencies SET subscription = approval.target_tier`.

---

## 3. 🎨 Agency Homepage Customization Section
Give agencies absolute control over how their customers see their public marketplace node.

### 🏠 **Agency Dashboard Customizer**
1. **Route:** `/settings/homepage-builder`
2. **Options list supporting customization:**
   * **General Design Structure Layout Frame:**
     * Logo Upload node layout.
     * Agency Layout Frame Name & Slogan string.
     * Sidebar/Primary Color Picker setup layouts nodes.
   * **Hero Slides & Sliders Builders:** Grid editor supporting `Banner Image`, `Title Text`, `Description`, `CTA Button URL`.
   * **Offer grids control layout Frame setup:** Pick which packs load on top sections (`Featured offers toggle`).
   * **Contact layout setups:** Location maps nodes overlays parameters triggers setup setups loads trigger layout setup triggers structure.

---

## 4. 🎫 Help Desk & Support (Messaging + Counter)
A seamless ticketing board keeping Agencies in parallel streams with admins setup triggers setup structures loads setup triggers structure setups.

### 🏠 **Agency & Master Board Interface Layout**
1. **Database Backend:**
   * `CREATE TABLE support_tickets (id UUID, agency_id, title, status, created_at)`
   * `CREATE TABLE support_messages (id UUID, ticket_id, sender_id, role, content, is_read)`
2. **Badge Navigation Counter Logic loads setup triggers structure:**
   * Layout reads `SELECT COUNT(*) FROM support_messages WHERE is_read = false AND receiver_role = 'xxx'`.
   * Displays red counter dot next to `Help Desk` sidebar icon loads triggers setup structure loads setup triggers structure.

---

## 5. 📧 Master Broadcast Email Portal
To communicate infrastructure or announcements across all agencies efficiently.

### 👑 **Master Dashboard Portal**
1. **Route:** `/emails/broadcast`
2. **Options list supporting categorization:**
   * `Select Recipients Mode`: [Single Agency Email], [All Agencies Bulk], [Selected Tier Bulks (e.g., Premium only)].
3. **Draft UI Form Support:**
   * Textarea with a Rich HTML Editor covering `Subject Line` and custom contents.
4. **Queue & Background Worker:**
   * Create an `email_queue` on backend inserting jobs to keep heavy batch nodes light so endpoints stay responsive.

---

## 6. 🕵️‍♂️ Staff Audit Log Tracing (Workflow Security)
Full tracking of dashboard behavior monitoring which Master Staff admins manipulated objects.

### 👑 **Master Dashboard Management Tracker**
1. **Database Backend Structures:**
   * `CREATE TABLE audit_logs (id UUID, staff_id, action_type, description, entity_affected, ip_address, created_at)`
2. **Audit Streams endpoints Logic:**
   * Attaching middleware monitoring `POST`, `PUT`, `DELETE` operations triggering inserts tracking staff behavior automatically.
3. **UI Board Audit log View:**
   * Grid layout carrying `Timestamp`, `Agent ID/Name`, `Action Done`, `Entity Moddified` parameters cleanly rendered.
