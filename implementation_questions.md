# Implementation Clarification Questions

## Question 1: Commission Tracking & Management

The document mentions storing commission as a "financial liability record." Should I:

- **Option A:** Create a new `Commission` interface/table to track all commissions separately?
- **Option B:** Just store `totalCommissionDZD` as a field on the Order?
- **Option C:** Both - store on Order and also create a Commission tracking module? both

**Follow-up:** Do you want a dedicated **Commission Management** page where you can view all agency/group leader commissions, filter by agency, date range, and payment status? yes 

<!-- YOUR ANSWER: -->

---

## Question 2: Passenger Count in Orders

Currently, the Order model has passenger details for **one passenger only** (firstName, lastName, passport, etc.). For commission calculation (passengers × commission per passenger), should I: option B

- **Option A:** Add a simple `numberOfPassengers: number` field to Order (easiest, use for commission calc only)?
- **Option B:** Convert passenger details to an **array of passengers** `passengers[]` (more complex, supports multiple passenger details)?
- **Option C:** Calculate passenger count from order item quantity?

**Example scenarios:**
- Order for family trip: 1 order, 4 passengers - how should this be structured?
- Group leader booking: 1 order, 30 passengers - full details for each or just count? yes full details for each like ( name , passport , phone , email)

<!-- YOUR ANSWER: -->

---

## Question 3: Exchange Rate History & Audit

For payment conversion "using the rate valid for the Payment Date," should I:

- **Option A:** Store **historical rates** with timestamps in a separate table (allows audit trail)?
- **Option B:** Just use the **current manual rate** at the time of payment creation (simpler)?
- **Option C:** Store the used rate directly on each Payment record (snapshot approach)?

**Follow-up:** Do you need to:
- View which rate was used for each payment (audit)? yes view which payment was used for each rate
- Recalculate old payments if rates are corrected?
- Generate reports showing rate changes over time?

<!-- YOUR ANSWER: -->

---

## Question 4: Foreign Currency Account Balances

For accounts like "SAR Account" and "EURO Account":

**How should balances be stored?**
- **Option A:** In **native currency** (e.g., balance: 5000 SAR, 2000 EUR)?
- **Option B:** Already **converted to DZD** using current rate?

**How should transactions be recorded?**
- **Example:** Receive 1000 SAR payment when rate is 36.50 DZD/SAR
  - Store as: +1000 SAR in SAR Account?
  - Or store as: +36,500 DZD with metadata "from 1000 SAR"? yes store it as you mentioned here ( the amount in DZD and the amount in SAR  and the rate used )

**For the NET Total calculation:**
- Convert foreign balances using **today's rate** or **average rate** or **original transaction rates**? yes the original transaction rates the rate used in that day 

<!-- YOUR ANSWER: -->

---

## Question 5: Commission Pre-population from Offer

When staff creates an order and selects an offer:

**How should `defaultAgencyCommission` from Offer pre-fill the order form?**

- **Option A:** **Automatically filled and editable** - staff can change the amount before saving
- **Option B:** **Shown as suggestion** - displayed but staff must manually enter/confirm
- **Option C:** **Auto-filled and locked** - cannot be changed once offer is selected

**Current behavior:** When room is selected, the price auto-fills. Should commission work the same way? no the commission will be entered manually by the staff 

<!-- YOUR ANSWER: -->

---

## Question 6: Agency vs Group Leader Terminology

Current `Agency.type` is `'Agence' | 'Rabbateur'`. You want to change to `'Agency' | 'GroupLeader'`.

**Clarification needed:**
- Is "Rabbateur" the same concept as "GroupLeader"? (Just rename it?) yes it is the same concept and keep it as rabbateur 
- Or are they different:
  - **Rabbateur:** Traditional partner/middleman?
  - **GroupLeader:** Individual who brings a group for commission?
  
**Functionality differences:**
- Do they work the same way (both get commission per passenger)?same work 
- Or do they need different commission calculation methods?
- Different reporting/tracking requirements?

<!-- YOUR ANSWER: -->

---

## Question 7: Deducting from Offer Availability

When an order is created, "deduct passengers from Offer's `availability`".

**Clarification:**
- Currently we have `disponibilite` on Offer (number of places). Is this the same as `availability`?
- Should availability decrease when:
  - **Order is created** (immediate)? yes when order is created it diduct the number of passengers from the availability
  - **Order is confirmed/paid**? 
  - Or **both** (reserved vs confirmed)?

**What happens if:**
- Order is cancelled - should availability increase back?yes when order is cancelled it increase the availability back
- Order is modified (passenger count changes)?yes when order is modified it update the availability

<!-- YOUR ANSWER: -->

---

## Question 8: Payment Date vs Exchange Rate Date

For the requirement "retrieve the manually configured exchange rate valid for the Payment Date":

**Scenario:** 
- Exchange rate set on Jan 1: 1 EUR = 240 DZD
- Exchange rate updated on Jan 15: 1 EUR = 245 DZD
- Payment recorded on Jan 20 for a transaction that happened on Jan 10

**Which rate should be used?**
- Rate on **payment recording date** (Jan 20 = 245)?
- Rate **closest to but not after** payment date?
- **Latest rate available** regardless of date?
in this case the rate on payment recording date rate on the date 1 jan then it should be rcorded as 240 DZD in jan rat is 240 DZD 
each day records that day not the latest rate available so all the records will be stored based on that day the amount got in the account will be stored based on that day the rate used.
<!-- YOUR ANSWER: -->

---

## Question 9: Multi-Currency in Order Items

Currently order items have `amount` in DZD. 

**Should the system support:**
- Order items priced in foreign currency (SAR/EUR)?
- Or everything must be in DZD only?
- If foreign currency allowed, display both currencies or just DZD equivalent?

<!-- YOUR ANSWER: -->
well i want to support foreign currency so the order items should be priced in foreign currency and the amount should be in DZD equivalent so : in the order add an option to select the currency and the amount in that currency and the amount in DZD equivalent should be calculated based on the exchange rate used in that day.
---

## Question 10: Implementation Priority

Given the scope of these features, what's the priority order?

**Suggested order:**
1. Exchange rate manual management (foundation)
2. Payment foreign currency conversion
3. Commission fields and calculation
4. Caisse NET total consolidation
5. Offer availability deduction
6. Commission management page (if needed)

**Do you agree or prefer different priority?**

<!-- YOUR ANSWER: -->
yes i agree
---

## Additional Questions/Notes

<!-- Add any additional requirements or clarifications here -->
