# LifeLink Emergency Blood Coordination Platform
## Master Product Specification — Version 3.0 (v3)

**Document Status:** Clean Master Specification  
**Classification:** Medical-Safety Critical Software Specification  
**Regulatory Target:** DGHS (Directorate General of Health Services), Drugs & Cosmetics Rules (Part XII-B), National Blood Transfusion Council (NBTC) Guidelines  
**Safety Review Level:** Architectural Sign-Off (Medical Systems Safety Review Complete)  

---

## 1. Purpose & Core Principles

LifeLink is an emergency blood coordination infrastructure designed to bridge critical supply gaps between hospitals with acute, life-threatening transfusion needs, licensed blood centres holding verified inventories, and eligible voluntary blood donors.

The core operating tenets of LifeLink are:
1. **Safety Over Speed:** No acceleration or workflow optimisation may bypass mandatory clinical screening, infectious disease testing, or cold-chain storage validation. LifeLink must never trade medical safety or data correctness for apparent speed.
2. **Authoritative Medical Hierarchy:** LifeLink is exclusively a communication and coordination layer. All medical determinations—including donor eligibility, blood collection, transfusion-transmissible infection (TTI) clearance, component separation, cross-matching, and issuance—remain solely under the jurisdiction of authorised medical officers at licensed blood centres.
3. **Inventory First, Donors Second:** LifeLink prioritises locating pre-tested, immediately available blood inventory at licensed centres before triggering donor mobilisation. Fresh collection takes hours; pre-cleared inventory saves lives in minutes.
4. **Data Integrity & Traceability:** Every state transition, inventory decrement, notification dispatch, and administrative action is recorded in an immutable, append-only audit trail with denormalised actor roles and sub-roles for legal and regulatory defensibility.
5. **Privacy & Dignity:** Donor deferral reasons are strictly confidential medical data. Negative screening outcomes or temporary medical deferrals must never be disclosed to hospital requesters or non-authorised personnel.

---

## 2. Clinical & Regulatory Context

LifeLink operates within the regulatory framework established by the Indian Drugs and Cosmetics Act (1940) and Rules (1945), specifically Part XII-B governing blood banks, and guidelines issued by the National Blood Transfusion Council (NBTC) and Central Drugs Standard Control Organisation (CDSCO):
- **Mandatory 5-Infection Screening:** Every unit of collected blood must be proven non-reactive for:
  1. Human Immunodeficiency Virus (HIV-1 & HIV-2 antibodies/antigens)
  2. Hepatitis B Surface Antigen (HBsAg)
  3. Hepatitis C Virus (HCV antibodies)
  4. Syphilis (VDRL / TPHA)
  5. Malaria (antigen / blood smear)
- **Approved Component Storage & Shelf-Life:**
  - *Packed Red Blood Cells (PRBC):* 2°C to 6°C; up to 35 days (CPDA-1) or 42 days (SAGM).
  - *Platelet Concentrates:* 20°C to 24°C with continuous flat-bed agitation; strictly 5 days from collection.
  - *Fresh Frozen Plasma (FFP):* −30°C or colder; up to 1 year.
  - *Cryoprecipitate:* −30°C or colder; up to 1 year.
  - *Whole Blood:* 2°C to 6°C; up to 35 days (CPDA-1).
- **Donation Interval Safeguards:**
  - Male whole blood donors: Minimum 90 days between consecutive whole blood donations.
  - Female whole blood donors: Minimum 120 days between consecutive whole blood donations.
  - Apheresis platelet donors: Minimum 48 hours between procedures; maximum 24 donations per calendar year.

---

## 3. Medical Boundaries & Guardrails

1. **No Software Medical Clearance:** LifeLink does not diagnose, triage patient clinical conditions, or grant medical clearance to donors. A platform advisory showing a donor as interval-eligible indicates only mathematical compliance with time intervals; clinical pre-screening is performed exclusively by blood centre medical staff.
2. **No Direct Hospital-to-Donor Contact:** Hospital personnel must never be provided direct contact details or personal identity of voluntary donors. All mobilisation directs voluntary donors to participating, licensed blood centres where safe collection and testing occur.
3. **No Unlicensed Collection:** LifeLink strictly forbids coordinating donations outside licensed blood centres or recognised, accredited mobile blood collection units operated by licensed blood banks.

---

## 4. Platform Roles & Responsibilities

LifeLink recognises four distinct system roles with strictly segmented capabilities:

### ROLE 1 — HOSPITAL STAFF (§4.1)
Hospital staff represent clinical care units requiring emergency blood products.
- **Permissions:**
  - Submit and manage emergency blood requests.
  - View matching inventory at verified blood centres within reach.
  - Soft-lock and request reservations for verified units.
  - View real-time, non-sensitive donor mobilisation status (e.g., number of donors notified, accepted, arrived).
  - Cancel or close requests with audited operational reasons.
- **Restrictions:**
  - Cannot access donor identity or medical deferral details.
  - Cannot modify blood centre inventory directly.
  - Cannot self-issue blood products without centre verification.

### ROLE 2 — VOLUNTARY DONOR (§4.2)
Registered voluntary individuals willing to donate blood in acute emergencies.
- **Permissions:**
  - Manage voluntary emergency availability status (`ACTIVE` / `SUSPENDED` / `DELETED`).
  - Set preferred blood centre for emergency visits (`preferred_blood_centre_id`).
  - Receive urgent mobilisation alerts based on distance radius tiers.
  - Accept or decline mobilisation requests and submit estimated arrival times.
  - View personal donation event history and interval advisories.
- **Restrictions:**
  - Cannot alter their own medical eligibility status (`eligibility_status`).
  - Cannot view patient identity or specific hospital clinical files.

### ROLE 3 — BLOOD CENTRE STAFF & MEDICAL OFFICERS (§4.3)
Authorised clinical and laboratory staff at state-licensed blood transfusion centres.
- **Permissions:**
  - Publish, adjust, and reconcile verified blood component inventory.
  - Accept, decline, or adjust incoming reservation requests from hospitals.
  - Confirm donor arrivals at the blood centre.
  - Record pre-donation screening assessments (`SCREENING_PASSED`, `SCREENING_DEFERRED`, `SCREENING_REJECTED`) and clinical vitals.
  - Record blood collection events and donation volumes.
  - Input mandatory TTI screening results and component processing outcomes.
  - Formally record blood unit issues and emergency fulfillments.
- **Restrictions:**
  - Cannot alter platform configuration settings.
  - Cannot delete immutable donation, testing, or audit records.

---

## 4a. ROLE 4 — PLATFORM ADMIN

Platform admins are internal LifeLink operators responsible for organisation onboarding, verification, platform administration, audit access, and non-clinical configuration.

### Platform admins can:
- Review and approve or reject hospital organisation registration.
- Review and approve or reject blood-centre registration.
- Suspend or reactivate hospital accounts.
- Suspend or reactivate blood-centre accounts.
- Manage permitted system configuration (`system_config`).
- Access audit logs across all organisations.
- Create and manage other platform-admin accounts.

### Platform admins cannot:
- Modify medical eligibility status (`eligibility_status`).
- Modify donation-event medical status.
- Modify blood inventory quantities directly.
- Create emergency blood requests.
- Override blood-centre medical decisions.
- Mark a blood component medically released.
- Declare a donor medically eligible.

### Administrative Governance Rules:
- Platform-admin accounts must be created only by existing platform admins.
- The first platform-admin account must be created through a secure deployment/bootstrap procedure and must never be created through public registration.
- A `SUPER` platform admin may manage platform-admin accounts according to the permission model.
- Platform admins must not be granted unrestricted database write access as part of normal application functionality.

---

## 5. Emergency Blood Request Lifecycle

Emergency requests proceed through a tightly controlled state machine:

```
[CREATED] ──► [VALIDATING] ──► [INVENTORY_SEARCH]
                                      │
            ┌─────────────────────────┴─────────────────────────┐
            ▼                                                   ▼
    [INVENTORY_FOUND]                                   [INVENTORY_SHORTAGE]
            │                                                   │
            │                                                   ▼
            │                                         [DONOR_MOBILISATION]
            │                                                   │
            │                                                   ▼
            │                                           [DONORS_NOTIFIED]
            │                                                   │
            │                                                   ▼
            │                                           [DONOR_ACCEPTED]
            │                                                   │
            │                                                   ▼
            │                                           [DONOR_ARRIVED]
            │                                                   │
            │                                                   ▼
            │                                         [SCREENING_PENDING]
            │                                                   │
            │                                                   ▼
            │                                         [DONATION_COMPLETED]
            │                                                   │
            │                                                   ▼
            │                                          [TESTING_PENDING]
            │                                                   │
            │                                                   ▼
            │                                        [PROCESSING_PENDING]
            │                                                   │
            │                                                   ▼
            │                                         [INVENTORY_UPDATED]
            │                                                   │
            └─────────────────────────┬─────────────────────────┘
                                      │
                                      ▼
                                  [RESERVED]
                                      │
                                      ▼
                            [READY_FOR_FULFILMENT]
                                      │
                    ┌─────────────────┴─────────────────┐
                    ▼                                   ▼
        [PARTIALLY_FULFILLED]       [FULFILMENT_CONFIRMED_BY_CENTRE]
```

### Terminal Request States (§5, §27, §35):
1. `FULFILMENT_CONFIRMED_BY_CENTRE` — The authorised blood centre has confirmed fulfilment/issue according to the LifeLink workflow.
2. `CANCELLED_BY_HOSPITAL` — Cancelled by hospital staff with mandatory operational reason.
3. `EXPIRED` — Coordination window expired via automated evaluation of `expires_at`.
4. `CLOSED_OTHER_REASON` — Administrative or clinical closure with recorded rationale.

Once a request reaches a terminal state:
- No new donor mobilisation may be initiated.
- No new reservation may be created against that request.
- Existing reservations must be handled according to the cancellation/fulfilment workflow.
- Any late notification must be suppressed.
- Further state changes require a defined administrative correction workflow and must never silently overwrite terminal history.

---

## 6. Request Validation & Input Guardrails

Prior to entering the active state machine, requests undergo automated validation:
1. `units_required` must be a positive integer greater than zero and less than or equal to statutory single-order safety limits (default: 20 units; larger quantities require dual medical authorization).
2. `blood_group` and `component_type` must be valid, recognised medical enumerations.
3. Clinical urgency level (`CRITICAL`, `URGENT`, `PLANNED`) must be specified.
4. Responsible hospital department and direct telephone contact must be supplied.

---

## 7. Inventory-First Search Engine Architecture & Blood-Centre Verification Lifecycle

### Inventory-First Search Query
When an emergency blood request is activated, LifeLink immediately executes an inventory-first search query across all verified participating blood centres:
1. Search filters:
   - Target blood group (or universally compatible emergency blood groups: O-negative PRBC for red cell emergencies; AB-positive FFP for plasma emergencies).
   - Component type matching requested specification.
   - Status: `AVAILABLE`.
   - Release status: `RELEASED` / `TESTED_CLEARED`.
   - Verified blood centres within maximum operational radius (default: 50 km).
2. Distance calculation utilizes the Haversine formula based on registered centre coordinates relative to the requesting hospital.
3. Results are ranked by:
   - Travel distance (closest blood centre first).
   - Inventory update freshness.
4. Total available units are computed as: $\sum (\text{units} - \text{reserved\_units})$.

### Blood-Centre Verification Lifecycle (§7, §16, §45)
Because platform admins verify blood centres, the blood-centre schema represents formal verification state:
- `verification_status` — enum: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`
- `verified_at` (nullable timestamp)
- `verified_by` (nullable FK to `platform_admins`)
- `verification_reason` (nullable text)
- `updated_at` (timestamp)

A blood centre may publish operational inventory to hospital users only when:
$$\text{verification\_status} = \text{'APPROVED'} \quad \text{AND} \quad \text{operational\_status} = \text{'ACTIVE'}$$

A rejected or suspended blood centre must not publish new inventory availability. Existing inventory must be handled according to a defined suspension workflow; suspension must not silently erase historical records.

---

## 8. Hospital Staff Sub-Roles & Hospital Verification Lifecycle

### Hospital Verification Lifecycle (§8, §17)
The hospital schema supports the verification process required by platform onboarding:
- `verification_status` — enum: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`
- `verified_at` (nullable timestamp)
- `verified_by` (nullable FK to `platform_admins`)
- `verification_reason` (nullable text)
- `updated_at` (timestamp)

Only approved hospitals (`verification_status = APPROVED`) may create active emergency blood requests. Suspended hospitals must not create new requests. Historical requests must remain auditable.

### Hospital Staff Sub-Roles (§8, §10)
Hospital staff sub-roles:
- **REQUESTER:**
  - Can create emergency requests.
  - Can view requests they created.
  - Can view status of their requests.
- **COORDINATOR:**
  - Can create requests.
  - Can view all requests for the hospital.
  - Can cancel or close requests according to workflow permissions.
  - Can view donor mobilisation detail permitted to hospital users.
  - Can use LifeLink communication workflows.
  - Can monitor fulfilment.
- **HOSPITAL_ADMIN:**
  - Can manage hospital staff accounts.
  - Can edit hospital organisation profile.
  - Can assign hospital staff sub-roles.

The `hospital_staff.role` field must use: `REQUESTER`, `COORDINATOR`, `HOSPITAL_ADMIN`.

Every audit event must preserve both:
1. The high-level actor role (`actor_role`).
2. The actor's sub-role at the time of action (`actor_sub_role`).

Do not derive the historical sub-role from the current staff record because the staff member's permissions may change after the event occurred.

---

## 9. Blood Request Data Intake, Mandatory Fields & Expiry Semantics

Every emergency request created by hospital staff requires the following inputs:
- `hospital_id` — Foreign key to requesting hospital.
- `blood_group` — ABO/Rh blood group.
- `component_type` — Blood component required.
- `units_required` — Quantity of units requested (positive integer).
- `urgency` — Urgency tier (`CRITICAL`, `URGENT`, `PLANNED`).
- `department` (text) — Hospital department or unit making the request (e.g., "Emergency ICU", "Trauma OR 3").
- `contact_person` (text) — Responsible hospital staff member.
- `contact_number` (text) — Direct contact telephone number for the request.
- `operational_notes` (text, nullable) — Optional non-sensitive operational notes. Do not store unnecessary patient identity or confidential clinical details here.
- `request_reason` (text) — Category or reason for the request (e.g., "Mass Casualty / Acute Trauma Haemorrhage", "Obstetric Haemorrhage", "Surgical Emergency").
- `units_fulfilled` (integer, default 0, non-negative) — Number of units confirmed through LifeLink fulfilment events.
- `required_by` (time string / timestamp) — Clinical urgency deadline supplied by the hospital.
- `expires_at` (timestamp) — LifeLink coordination lifecycle deadline.

### Clinical Deadline vs Coordination Expiry (§9, §28, §35):
`required_by` and `expires_at` have fundamentally different meanings:
- `required_by` = clinical urgency deadline supplied by the hospital. LifeLink records it and uses it for prioritisation and display. LifeLink must not independently determine clinical urgency.
- `expires_at` = LifeLink coordination lifecycle deadline. It controls automated request expiration.

`expires_at` must never be interpreted as a clinical deadline. Neither field means: *"The patient will definitely receive blood by this time."* The application must never convert either timestamp into a medical guarantee.

---

## 10. Inventory Matching Algorithm & Distance Calculations

Inventory search calculates available quantities by evaluating verified blood centres holding cleared stock:
1. Distance is computed between requesting hospital latitude/longitude and blood centre latitude/longitude using the spherical Haversine formula.
2. Centres are sorted ascending by distance ($d \le 50\text{ km}$).
3. Available unreserved quantity is computed as:
   $$\text{available\_units} = \text{units} - \text{reserved\_units}$$
4. Matching units are partitioned into exact ABO/Rh matches and approved universal emergency alternatives (O-negative PRBC for red cell emergencies; AB-positive FFP for plasma).

---

## 11. Duplicate Detection Rule & Shortage Decision Workflow

### Duplicate Detection Rule (§11, §12)
A request is flagged as a potential duplicate if:
- The same hospital has an active request;
- The existing request is not in a terminal state (`FULFILMENT_CONFIRMED_BY_CENTRE`, `CANCELLED_BY_HOSPITAL`, `EXPIRED`, `CLOSED_OTHER_REASON`);
- `blood_group` is the same;
- `component_type` is the same;
- The existing request was submitted within `DUPLICATE_REQUEST_WINDOW_MINUTES` (default: 30 minutes, stored in `system_config`).

Duplicate detection is a warning mechanism, not an automatic clinical rejection. When a potential duplicate is detected:
1. Display a clear warning.
2. Show the existing request ID.
3. Allow the authorised staff member to review it.
4. Require explicit confirmation before activating the new request.
5. Record that confirmation as an audit event (`DUPLICATE_REQUEST_CONFIRMED`).

The system must not prevent legitimate separate requests solely because they match the duplicate criteria.

### Shortage Decision Workflow
- If $\sum \text{available\_units} \ge \text{units\_required}$: System sets request status to `INVENTORY_FOUND`. Hospital can immediately reserve units.
- If $0 < \sum \text{available\_units} < \text{units\_required}$: System sets request status to `INVENTORY_SHORTAGE`. Hospital reserves available units immediately, and the system automatically calculates:
  $$\text{shortage\_units} = \text{units\_required} - \text{available\_units}$$
  Donor mobilisation is automatically initiated for $\text{shortage\_units}$.
- If $\sum \text{available\_units} = 0$: System sets request status to `DONOR_MOBILISATION`. Full quantity triggers donor mobilisation alerts immediately.

---

## 12. Request Inventory Search Auditing

Every inventory search execution must be audited to preserve evidence of what inventory was visible, what quantities were reported, and the data freshness at the moment the search was performed.

The system writes records to `request_inventory_search_results` capturing:
- `id` — Unique identifier.
- `request_id` — Associated emergency request.
- `inventory_id` — Inventory row evaluated.
- `blood_centre_id` — Centre holding the units.
- `units_found` (integer, non-negative) — Quantity observed at search time, not a later quantity.
- `distance_km` (decimal) — Distance from hospital to blood centre.
- `freshness_status` (enum: `FRESH`, `STALE`, `UNCONFIRMED`).
- `search_timestamp` (timestamp) — Timestamp of query execution.

Create one row for every inventory record considered during every inventory search. This table is an audit snapshot; it must not be treated as a live inventory table.

---

## 13. Voluntary Donor Mobilisation Engine & Radius Tiers

When a shortage exists, LifeLink activates the Donor Mobilisation Engine. Donors are selected based on:
1. **Compatibility:** ABO/Rh compatibility with requested component.
2. **Account Standing:** `account_status = ACTIVE`.
3. **Medical Eligibility:** `eligibility_status` not deferred (`CENTRE_DEFERRED`) or rejected (`CENTRE_REJECTED`).
4. **Availability:** Donor has toggled their status to available.
5. **Quiet Period:** Donor has not received a notification for this request within `DONOR_RENOTIFICATION_QUIET_PERIOD_MINUTES` (default: 60).

### Escalation Radius Tiers (§13, §43):
- **Tier 1:** 0 to 5 km (Initial dispatch, immediate urban response).
- **Tier 2:** 5 to 10 km (Dispatched if Tier 1 yields insufficient acceptance within timeout).
- **Tier 3:** 10 to 20 km (Suburban escalation).
- **Tier 4:** 20+ km (Regional emergency outreach).

Radius tier thresholds are stored in `system_config` (`MOBILISATION_TIER_1_RADIUS_KM`, etc.) and read at runtime.

---

## 14. Inventory Search Freshness Specification (§14, §21)

Inventory freshness is defined as an operational data-quality state:
- `FRESH` = Inventory was updated within `INVENTORY_FRESHNESS_THRESHOLD_MINUTES` (default: 30 minutes, stored in `system_config`).
- `STALE` = Inventory is older than the configured threshold.
- `UNCONFIRMED` = Inventory exists but the source or confirmation state does not satisfy the configured confidence requirement.

The threshold must be stored in `system_config`. LifeLink must not describe stale or unconfirmed inventory as guaranteed availability.

---

## 15. Donor Mobilisation Notifications & Acceptance Flow

When mobilised, donors receive urgent notifications directing them to a participating blood centre:
1. The alert contains:
   - Request urgency and required blood component.
   - Recommended participating blood centre (based on proximity or donor preference).
   - Clear medical notice: *"Donation eligibility and screening will be determined at the blood centre."*
2. The donor may:
   - **ACCEPT:** Confirms willingness, confirms/selects destination blood centre (`selected_blood_centre_id`), and provides an estimated arrival time (`expected_arrival_time`).
   - **DECLINE:** Closes notification for this donor without penalisation or negative status modification.
3. System updates request status to `DONOR_ACCEPTED` once minimum donor confirmations are secured.

---

## 16. Multi-Channel Notification Dispatch Architecture

Mobilisation notifications are broadcast across multiple channels simultaneously to ensure delivery in time-sensitive emergencies:
- In-App Push Notification
- SMS Text Dispatch
- WhatsApp Verified Business Alert
- Web Application Push Notification

Each dispatch is tracked independently in `notification_deliveries`.

---

## 17. Donor Destination Confirmation

Upon accepting a mobilisation alert, the donor is prompted to confirm the blood centre they will visit:
- Default: The nearest participating blood centre coordinating the request, or the donor's `preferred_blood_centre_id`.
- The chosen blood centre is immediately notified of incoming donor arrival to prepare phlebotomy and testing resources.

---

## 18. Medical Eligibility Architecture & Interval Advisory

### Medical Eligibility Architecture (§18, §23)
LifeLink must never independently declare a donor medically eligible based solely on database calculations. LifeLink may use donor history and configured operational rules to determine that a donor requires review (`eligibility_status = ELIGIBILITY_REVIEW_REQUIRED`). 

The final medical eligibility state must be supplied and confirmed through the authorised blood-centre workflow (`CENTRE_CONFIRMED_ELIGIBLE`, `CENTRE_DEFERRED`, `CENTRE_REJECTED`).

Do not hard-code a universal donation interval. If donation intervals or eligibility rules are represented in software:
- Identify the authoritative source (DGHS / NBTC).
- Record the rule version/effective date where appropriate.
- Ensure the rule is reviewed before deployment.
- Do not allow ordinary platform administrators to casually modify medical rules.
- Do not represent a software pre-check as medical clearance.

### Interval Advisory
LifeLink presents blood centre staff with the donor's recorded donation interval advisory:
- Calculates elapsed days since `last_donation_date`.
- Flags compliance against statutory limits (Male: 90 days; Female: 120 days).
- Prominently displays: *"Interval advisory is informational only. Authorised blood centre medical staff must conduct statutory pre-screening before phlebotomy."*

---

## 19. Pre-Screening Assessment & Medical Privacy Protection

### Clinical Assessment (§19)
Before donation, blood centre medical officers conduct statutory pre-donation medical examination:
- Blood pressure, pulse, weight, temperature.
- Hemoglobin level (minimum 12.5 g/dL).
- Medical history questionnaire.

### Medical Privacy Protection (§19, §20)
Outcomes are recorded by centre staff:
- `SCREENING_PASSED`: Donor approved. Proceed to blood collection.
- `SCREENING_DEFERRED` / `SCREENING_REJECTED`: Donor deferred temporarily or permanently.
- **Privacy Rule:** The specific clinical reason for deferral (e.g., low hemoglobin, elevated blood pressure, travel history) is confidential medical data between donor and blood centre. The hospital requester view displays only: *"Donor attendance did not result in collection; mobilisation continuing."* LifeLink strictly prohibits exposing medical deferral rationales outside the blood centre.

---

## 20. Donor Centre Selection Validation (§20, §22)

When a donor accepts mobilisation:
- The donor may confirm the suggested participating centre.
- The donor may choose another eligible participating centre if the request permits it.
- The selected centre must be validated against the current request and centre status:
  - Participating in LifeLink;
  - Operational (`operational_status = ACTIVE`);
  - Verified (`verification_status = APPROVED`);
  - Associated with the request where such restriction applies.
- `selected_blood_centre_id` must be stored.
- `expected_arrival_time` represents the donor's stated estimate only; it must never be interpreted as confirmed arrival.
- Actual arrival must be recorded separately by authorised blood-centre staff. Do not infer donor arrival merely because `DONOR_ACCEPTED` was recorded.

---

## 21. Blood Collection & Notification Timeouts

### Blood Collection
Upon successful pre-screening, blood collection is executed:
- Volume: 350 ml or 450 ml Whole Blood, or apheresis platelet collection.
- Collection event recorded with unique donation ID, batch number, and timestamp.
- Transitions request status to `DONATION_COMPLETED` and initiates laboratory testing workflow.

### Notification Timeout Specification (§21, §13)
Use a configurable notification timeout stored in `system_config` as:
$$\text{DONOR\_NOTIFICATION\_TIMEOUT\_MINUTES} \quad (\text{default: } 7\text{ minutes})$$

After the timeout elapses without a donor response:
- Set `donor_notifications.response_status = NO_RESPONSE`.
- Record the timeout timestamp.
- Create an audit event.

The system may then notify the next donor group according to the mobilisation tiers in §43.

A donor who has already received a notification for the same request must not receive another notification for that request within:
$$\text{DONOR\_RENOTIFICATION\_QUIET\_PERIOD\_MINUTES} \quad (\text{default: } 60\text{ minutes})$$

This prevents notification spam while allowing controlled re-notification if the emergency request escalates significantly. A donor who has explicitly declined a request should not be immediately re-notified for the same request unless an authorised escalation rule explicitly permits it.

---

## 22. Mandatory Infectious Disease Testing (TTI)

Every collected unit must be tested for the five mandatory DGHS infectious markers:
1. HIV-1 and HIV-2
2. Hepatitis B (HBsAg)
3. Hepatitis C (anti-HCV)
4. Syphilis
5. Malaria

Units cannot be issued, reserved, or added to available inventory until all five tests are confirmed **NON-REACTIVE**.

---

## 23. Reactive Unit Quarantine & Disposal Protocol

If any screening test returns reactive or indeterminate:
1. The unit is immediately marked `QUARANTINED` and locked from issuance.
2. Blood centre protocols dictate confirmatory testing and biohazard incineration per bio-medical waste management rules.
3. LifeLink updates the donation event status to `REACTIVE_OR_NOT_USABLE`.
4. Hospital request is updated to continue mobilisation for replacement units.

---

## 24. Blood Component Separation & Processing

Following non-reactive test clearance, whole blood units are separated into therapeutic components via refrigerated centrifugation:
- Packed Red Blood Cells (PRBC)
- Platelet Concentrates
- Fresh Frozen Plasma (FFP)
- Cryoprecipitate

Each component is labeled with unique ISBT barcodes, blood group, collection date, and expiration date.

---

## 25. Inventory Generation Post-Processing

Upon completion of component separation, blood centre staff register the cleared components into LifeLink:
- Each component creates an authoritative `blood_inventory` record.
- Status set to `AVAILABLE`, release status `RELEASED`.
- Request status transitions to `INVENTORY_UPDATED`.
- Shortage counters decrement accordingly.

---

## 26. Authoritative Storage & Shelf-Life Rules

All published inventory units must adhere to mandatory storage and shelf-life parameters:
| Component | Shelf-Life | Storage Temperature | Agitation / Special Conditions |
|---|---|---|---|
| Packed Red Blood Cells (PRBC) | 35–42 days | 2°C to 6°C | Blood Bank Refrigerator |
| Platelets | 5 days | 20°C to 24°C | Continuous flat-bed agitation |
| Fresh Frozen Plasma (FFP) | 365 days (1 year) | −30°C or colder | Ultra-low Deep Freezer |
| Cryoprecipitate | 365 days (1 year) | −30°C or colder | Ultra-low Deep Freezer |
| Whole Blood | 35 days (CPDA-1) | 2°C to 6°C | Blood Bank Refrigerator |

Expired units are automatically marked `EXPIRED` by platform cron workers and excluded from matching.

---

## 27. Inventory Publication & Visibility

Only verified blood centres with active operational status (`operational_status = ACTIVE`) and verified licenses (`verification_status = APPROVED`) may publish inventory to LifeLink. Unverified centres cannot broadcast inventory to hospitals.

---

## 28. Emergency Order Issue & Dispatch

When a hospital requests units that have been reserved:
1. Hospital initiates dispatch request.
2. Blood centre cross-matches patient sample with donor unit (if cross-match sample provided).
3. Blood centre confirms physical release of units in compliant cold-chain transport container (2–10°C with validated ice packs for red cells; insulated container without ice for platelets).
4. Centre staff records fulfillment in LifeLink.

---

## 29. Cold-Chain Transport Validation

Transport containers must maintain target temperatures during transit:
- Red cells: 2°C to 10°C monitored with temperature data loggers or validated chemical indicators.
- LifeLink records dispatch time, departure temperature, and receiving confirmation to ensure continuous cold-chain auditability.

---

## 30. Request Cancellation & Closure Rules

An emergency blood request may be closed under the following conditions:
1. `FULFILMENT_CONFIRMED_BY_CENTRE` — All requested units have been confirmed as issued by participating blood centres.
2. `CANCELLED_BY_HOSPITAL` — Requesting clinical staff cancel the request (e.g., patient stabilized, alternative clinical intervention, patient expired). Staff must supply a mandatory cancellation reason.
3. `EXPIRED` — Request exceeded its `expires_at` deadline without fulfillment.
4. `CLOSED_OTHER_REASON` — Administrative closure by hospital coordinator or platform admin with recorded rationale.

Upon cancellation or expiry, any active soft-locks on inventory are immediately released back to the available pool.

---

## 31. Inventory Reservation State Machine, Soft-Locking & Fulfilment Accounting

The reservation workflow transitions through:
```
AVAILABLE ──► RESERVATION_REQUESTED ──► RESERVED ──► FULFILLED
                     │                      │
                     ▼                      ▼
           RESERVATION_DECLINED   RESERVATION_CANCELLED / EXPIRED
```

### Reservation Soft-Lock (§31, §7)
The reservation workflow must not leave units unlocked during the centre-confirmation window.

When a `RESERVATION_REQUESTED` event is created, the system must immediately increase `blood_inventory.reserved_units` by the requested quantity inside the same database transaction that creates the reservation record.

This soft-locks the units during the centre confirmation window and immediately removes those units from the unreserved available quantity:
$$\text{available\_units} = \text{units} - \text{reserved\_units}$$

The transaction must verify:
$$\text{reserved\_units} + \text{units\_requested} \le \text{units}$$
before incrementing `reserved_units`. If insufficient unreserved units exist, the reservation request must fail with `INSUFFICIENT_UNITS` and must not create a successful reservation.

If the blood centre responds:
- **`RESERVATION_DECLINED`:** The system must decrement `reserved_units` by exactly the quantity held by that reservation inside the same transaction that changes the reservation status. The units return to the available pool.
- **`RESERVED`:** No additional reservation increment is required because the soft-lock was already applied at `RESERVATION_REQUESTED`.
- **`RESERVATION_CANCELLED` / `RESERVATION_EXPIRED`:** The system decrements `reserved_units` by the reservation's currently locked quantity atomically.

A reservation has an explicit lifecycle:
`RESERVATION_REQUESTED`, `RESERVED`, `RESERVATION_DECLINED`, `RESERVATION_CANCELLED`, `RESERVATION_EXPIRED`, `FULFILLED`.

No reservation may remain indefinitely in `RESERVATION_REQUESTED`. A configurable reservation-confirmation timeout is stored in `system_config` (`RESERVATION_CONFIRMATION_TIMEOUT_MINUTES`). If that timeout passes without centre confirmation, the reservation automatically transitions to `RESERVATION_EXPIRED` and releases its soft-lock atomically.

At no point between `RESERVATION_REQUESTED` and centre confirmation may another hospital see those soft-locked units as available.

### Reservation Fulfilment Accounting (§31, §18)
The specification explicitly defines what happens to inventory after a reservation is fulfilled:
Before fulfilment:
- `units` = total physical inventory represented by the row
- `reserved_units` = units locked for active reservations
- $\text{available\_units} = \text{units} - \text{reserved\_units}$

When a reserved quantity is fulfilled/issued according to the blood-centre-confirmed workflow, the system must atomically:
1. Decrease `units` by the fulfilled quantity.
2. Decrease `reserved_units` by the same fulfilled quantity.
3. Update `updated_at` and/or increment `version`.
4. Record an `inventory_movement`.
5. Update the reservation status to `FULFILLED`.
6. Increment `blood_requests.units_fulfilled`.
7. Update the request status according to the remaining requirement.

The transaction must enforce:
$$\text{fulfilled\_quantity} \le \text{reserved\_quantity} \quad \text{AND} \quad \text{fulfilled\_quantity} \le \text{units}$$

After fulfilment, $\text{available\_units} = \text{units} - \text{reserved\_units}$ must remain valid. Never decrement `units` without also recording the corresponding inventory movement. Never decrement `reserved_units` twice.

### Reservation Cancellation / Release Accounting (§31, §19)
When an active reservation is cancelled or expires before fulfilment:
1. Read the reservation's currently locked quantity.
2. Decrease `blood_inventory.reserved_units` by that quantity.
3. Set the reservation status to the appropriate release state (`RESERVATION_CANCELLED` or `RESERVATION_EXPIRED`).
4. Record an audit event.
5. Record an inventory movement if required by the inventory ledger model.
6. Commit all related changes atomically.

A reservation must not release more units than it currently holds. A reservation must never cause $\text{reserved\_units} < 0$.

---

## 32. Concurrency Specification & Atomic Reservation Writes

Reservation writes must execute inside a serialisable database transaction, or use an equivalent optimistic-concurrency implementation that provides the same correctness guarantees.

The preferred write sequence is:
1. Lock/read the current `blood_inventory` row using a transaction-safe mechanism.
2. Read `units`, `reserved_units`, and `updated_at` or `version`.
3. Calculate: $\text{available} = \text{units} - \text{reserved\_units}$.
4. Verify: $\text{available} \ge \text{units\_requested}$.
5. If not, return `INSUFFICIENT_UNITS` immediately without creating the reservation.
6. Increment `reserved_units` by `units_requested`.
7. Update `updated_at` and/or increment `version`.
8. Create the reservation record in the same transaction.
9. Commit.

If optimistic concurrency is used instead of a row lock:
- The update must include the previously read version token.
- If the version no longer matches, the write must fail with `CONFLICT`.
- The operation may be retried using a fresh read.
- Never silently write using stale inventory values.

If pessimistic row locking is used:
- The inventory row must be locked for the duration of the transaction.
- The lock must be released only after commit or rollback.

Never implement reservation using an unprotected read-then-write sequence.

`blood_inventory` must contain `updated_at` and may additionally contain `version` (integer, incremented on every write). The database must enforce:
$$\text{reserved\_units} \ge 0 \quad \text{AND} \quad \text{reserved\_units} \le \text{units}$$

---

## 33. Partial Fulfilment Tracking & Allocation Mathematics

Define:
$$\text{remaining\_units} = \text{units\_required} - \text{units\_fulfilled}$$

`units_fulfilled` must never exceed `units_required`.

In acute emergencies, blood centres may have partial inventory (e.g., 2 units available when 5 are requested):
1. Hospital can soft-lock and accept partial fulfillment (e.g., 2 units).
2. The system tracks fulfillment progress using `blood_requests.units_fulfilled`.
3. If $\text{remaining\_units} > 0$ and $\text{units\_fulfilled} > 0$:
   Status transitions to `PARTIALLY_FULFILLED`. The request remains active unless the hospital closes/cancels it or its coordination expiry is reached. Donor mobilisation continues dynamically for $\text{remaining\_units}$.
4. If $\text{remaining\_units} = 0$:
   The request may transition to `FULFILMENT_CONFIRMED_BY_CENTRE` only after the relevant centre confirmations have been recorded. Partial fulfilment must not accidentally mark the entire request as fulfilled.

---

## 34. Fulfilment Boundaries & Clinical Non-Guarantee

`FULFILMENT_CONFIRMED_BY_CENTRE` means that the authorised blood centre has confirmed fulfilment/issue according to the LifeLink workflow.

It does NOT mean:
- The patient received a transfusion.
- The transfusion was clinically successful.
- The transfusion was administered.
- LifeLink made a compatibility decision.

Actual transfusion remains outside LifeLink unless a future authorised clinical integration explicitly defines that workflow.

---

## 35. Automated Request Expiry Engine

Every request carries two distinct temporal values:
1. `required_by` (time string / timestamp) — The clinical urgency deadline supplied by the hospital.
2. `expires_at` (timestamp) — The automated LifeLink coordination expiry time.

### Automatic Expiry Rule (§35, §1):
If `expires_at` passes and the request status is not a terminal state (`FULFILMENT_CONFIRMED_BY_CENTRE`, `CANCELLED_BY_HOSPITAL`, `EXPIRED`, `CLOSED_OTHER_REASON`), the system must atomically set the request status to `EXPIRED`.

Before automatically expiring a request, the system must evaluate whether an active reservation/fulfilment transaction is currently being processed.

The expiry worker must use an atomic state transition so that it cannot overwrite a concurrent terminal transition:
$$\text{ACTIVE} \longrightarrow \text{EXPIRED}$$
must succeed only if the request is still non-terminal at the moment of the database write.

Active donor mobilisation is halted, pending notifications are closed, any unissued soft-locks are released atomically, and an audit event (`REQUEST_AUTO_EXPIRED`) is written.

---

## 36. Donor Privacy Guarantees & Account Deletion

LifeLink incorporates strict privacy guardrails for voluntary donors:
1. **No Defamation / No Negative Public Stigma:** Donors who decline an alert, fail to respond, or fail to attend after accepting are never flagged publicly or penalized.
2. **Confidential Deferrals:** Medical deferral records are strictly confined between donor and blood centre medical staff. Deferral statuses are never accessible to hospital requesters.
3. **Contact Masking:** Voluntary donors' real telephone numbers are masked in all standard dashboard views. Communication occurs via system channels or masked virtual bridges.
4. **Account Deletion Retention Rules (§36, §2):** Account deletion must not physically destroy medical/audit relationships that must legally or operationally remain traceable. Where records must be retained, `DELETED` means the platform account is no longer active; appropriate retention and anonymisation rules apply.

---

## 37. Rate Limiting & Anti-Spam Protections

To protect voluntary donors from notification fatigue:
1. Maximum 1 mobilisation notification per donor per 24-hour window, unless an acute Tier 4 community emergency override is issued by a platform admin.
2. Minimum quiet period of `DONOR_RENOTIFICATION_QUIET_PERIOD_MINUTES` (default: 60 minutes) before a donor may receive another notification for the same request.
3. Once a donor declines, they will not be contacted again for that specific request ID.

---

## 38. Immutable Audit Logging Architecture & Forensics

LifeLink maintains an immutable, append-only audit trail (`audit_logs`) documenting every clinical coordination step:
- Every insert, status transition, inventory reservation, and configuration change writes an audit record.
- Audit records must be append-only through the application. Normal users, hospital staff, donors, blood-centre staff, and platform admins must not be able to edit or delete historical audit events through the normal application interface.

---

## 39. Denormalised Actor Role & Sub-Role Immutability

The `actor_role` field is stored denormalised in every audit event to preserve the exact role held by the actor at the moment of the action.

Where applicable, the audit event must also preserve:
- `actor_sub_role` — The actor's sub-role at the time of action (`REQUESTER`, `COORDINATOR`, `HOSPITAL_ADMIN`, etc.).
- `organisation_type` — Hospital, Blood Centre, or Platform.
- `organisation_id` — Associated organisation.

Do not derive historical actor role or sub-role from the current user record.

---

## 40. Per-Channel Delivery Tracking Architecture

To ensure delivery accountability across diverse telecommunication carriers in emergency contexts, delivery outcomes must be tracked per channel.

Each channel has an independent delivery record in `notification_deliveries`:
- `channel`: enum (`IN_APP`, `PUSH`, `SMS`, `WHATSAPP`)
- `status`: enum (`PENDING`, `SENT`, `DELIVERED`, `FAILED`)
- `sent_at`: timestamp (nullable)
- `delivered_at`: timestamp (nullable)
- `failure_reason`: text (nullable)

The `delivery_status` on `donor_notifications` is an aggregate status defined by this explicit rule:
- `DELIVERED`: At least one required/attempted channel has reached `DELIVERED`.
- `SENT`: At least one channel is `SENT` and none is `DELIVERED`.
- `FAILED`: All attempted channels have failed and no channel is pending.
- `PENDING`: At least one channel remains pending and none has yet reached `SENT` or `DELIVERED`.

The implementation must retain the individual channel states; the aggregate status must never replace channel-level auditability. Notification retry behaviour must be configurable (`NOTIFICATION_RETRY_LIMIT`). Retries must not create duplicate donor mobilisation records.

---

## 41. Communication Guardrails & Tone Standards

All communications generated by LifeLink (in-app messages, push notifications, SMS, WhatsApp) must maintain an objective, medical, and safety-focused tone:
- Never use sensationalist, alarming, or guilt-inducing phrasing (e.g., Avoid: *"Patient will die if you don't donate now!"*).
- Use clear, professional, imperative language: *"Emergency blood mobilisation: Voluntary O-positive donor needed at Narasaraopet Blood Centre. Confirm availability in LifeLink app."*
- Always include the clear caveat that medical suitability will be determined at the blood centre.

---

## 42. Multi-Channel Messaging Infrastructure & Validation

The multi-channel notification system supports:
- In-App
- Push
- SMS
- WhatsApp where technically and legally supported

The system distinguishes:
- **Notification Intent:** The emergency mobilisation message that LifeLink intends to send.
- **Channel Delivery:** The result of attempting to deliver that message through an individual channel.

A failed SMS must not mean the entire notification failed if an in-app or push notification was successfully delivered. Conversely, an aggregate `DELIVERED` state must never hide individual channel failures.

---

## 43. Escalation Tier Progression Matrix

| Tier | Distance Radius | Candidate Selection Criteria | Dispatch Timeout Before Escalation |
|---|---|---|---|
| Tier 1 | 0 to 5 km | Active, Eligible, Interval-compliant, Preferred Centre in zone | 7 minutes (`DONOR_NOTIFICATION_TIMEOUT_MINUTES`) |
| Tier 2 | 5 to 10 km | Active, Eligible, Same district / urban zone | 10 minutes |
| Tier 3 | 10 to 20 km | Active, Eligible, Peripheral suburban perimeter | 15 minutes |
| Tier 4 | 20+ km | Active, Eligible, Inter-district / regional emergency pool | Manual or Critical urgency auto-trigger |

---

## 44. Failure Modes & Offline Resilience

LifeLink is engineered to prevent single points of failure in emergency healthcare:
1. **Network Outage:** If internet connectivity drops, the client application displays the emergency telephonic hotline for participating blood banks.
2. **SMS Carrier Outage:** Multi-channel failover to WhatsApp and In-App push.
3. **Blood Centre Power Failure:** Manual phone-in mode allows blood centre staff to coordinate via telephone while platform admins update records on their behalf via Platform Admin console.

---

## 45. Complete Master Database Schema & Consistency Requirements

The relational database schema enforces all operational, concurrency, and audit requirements across 18 core tables:

```sql
-- 1. users
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NOT NULL UNIQUE,
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    role VARCHAR(32) NOT NULL, -- 'HOSPITAL_STAFF', 'DONOR', 'BLOOD_CENTRE_STAFF', 'PLATFORM_ADMIN'
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'SUSPENDED'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 2. platform_admins (§4a, §45)
CREATE TABLE platform_admins (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_level VARCHAR(32) NOT NULL DEFAULT 'STANDARD', -- 'STANDARD', 'SUPER'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by VARCHAR(64) REFERENCES platform_admins(id) -- Nullable only for secure bootstrap account
);

-- 3. hospitals (§8, §17, §45)
CREATE TABLE hospitals (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    verification_status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by VARCHAR(64) REFERENCES platform_admins(id),
    verification_reason TEXT,
    contact_phone VARCHAR(32) NOT NULL,
    district VARCHAR(128) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. hospital_staff (§8, §10, §45)
CREATE TABLE hospital_staff (
    id VARCHAR(64) PRIMARY KEY,
    hospital_id VARCHAR(64) NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(128) NOT NULL,
    role VARCHAR(32) NOT NULL, -- 'REQUESTER', 'COORDINATOR', 'HOSPITAL_ADMIN'
    verification_status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. blood_centres (§7, §16, §45)
CREATE TABLE blood_centres (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    verification_status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by VARCHAR(64) REFERENCES platform_admins(id),
    verification_reason TEXT,
    licence_reference VARCHAR(128),
    operational_status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'LIMITED', 'INACTIVE'
    contact_phone VARCHAR(32) NOT NULL,
    license_number VARCHAR(128) NOT NULL UNIQUE,
    district VARCHAR(128) NOT NULL,
    last_inventory_sync TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 6. blood_centre_staff (§45)
CREATE TABLE blood_centre_staff (
    id VARCHAR(64) PRIMARY KEY,
    blood_centre_id VARCHAR(64) NOT NULL REFERENCES blood_centres(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(64) NOT NULL,
    verification_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 7. donors (§2, §45)
CREATE TABLE donors (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    blood_group VARCHAR(8) NOT NULL, -- 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
    gender VARCHAR(16) NOT NULL, -- 'MALE', 'FEMALE', 'OTHER'
    approximate_latitude DECIMAL(10, 7) NOT NULL,
    approximate_longitude DECIMAL(10, 7) NOT NULL,
    approximate_distance_km DECIMAL(6, 2) NOT NULL DEFAULT 0.0,
    availability BOOLEAN NOT NULL DEFAULT TRUE,
    last_donation_date DATE,
    account_status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'SUSPENDED', 'DELETED'
    eligibility_status VARCHAR(64) NOT NULL DEFAULT 'UNKNOWN', -- 'UNKNOWN', 'ELIGIBILITY_REVIEW_REQUIRED', 'CENTRE_CONFIRMED_ELIGIBLE', 'CENTRE_DEFERRED', 'CENTRE_REJECTED'
    preferred_blood_centre_id VARCHAR(64) REFERENCES blood_centres(id),
    donations_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 8. blood_inventory (§3, §8, §31, §32, §45)
CREATE TABLE blood_inventory (
    id VARCHAR(64) PRIMARY KEY,
    blood_centre_id VARCHAR(64) NOT NULL REFERENCES blood_centres(id) ON DELETE CASCADE,
    blood_centre_name VARCHAR(255) NOT NULL,
    component_type VARCHAR(64) NOT NULL,
    blood_group VARCHAR(8) NOT NULL,
    units INTEGER NOT NULL CHECK (units >= 0),
    reserved_units INTEGER NOT NULL DEFAULT 0 CHECK (reserved_units >= 0),
    collection_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    availability_status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE',
    release_status VARCHAR(32) NOT NULL DEFAULT 'RELEASED',
    storage_condition TEXT NOT NULL,
    screening_status VARCHAR(32) NOT NULL DEFAULT 'TESTED_CLEARED',
    inventory_status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE',
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1, -- Optimistic concurrency token
    CONSTRAINT chk_reserved_units_le_units CHECK (reserved_units <= units)
);

-- 9. blood_requests (§1, §9, §11, §33, §35, §45)
CREATE TABLE blood_requests (
    id VARCHAR(64) PRIMARY KEY, -- e.g. 'LL-2026-000184'
    hospital_id VARCHAR(64) NOT NULL REFERENCES hospitals(id),
    hospital_name VARCHAR(255) NOT NULL,
    component_type VARCHAR(64) NOT NULL,
    blood_group VARCHAR(8) NOT NULL,
    units_required INTEGER NOT NULL CHECK (units_required > 0),
    units_fulfilled INTEGER NOT NULL DEFAULT 0 CHECK (units_fulfilled >= 0 AND units_fulfilled <= units_required),
    department TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    request_reason TEXT NOT NULL,
    operational_notes TEXT,
    urgency VARCHAR(32) NOT NULL, -- 'CRITICAL', 'URGENT', 'PLANNED'
    required_by VARCHAR(64) NOT NULL, -- Clinical urgency deadline supplied by hospital
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- LifeLink coordination lifecycle deadline
    status VARCHAR(64) NOT NULL DEFAULT 'CREATED',
    inventory_found_units INTEGER NOT NULL DEFAULT 0,
    inventory_reserved_units INTEGER NOT NULL DEFAULT 0,
    shortage_units INTEGER NOT NULL DEFAULT 0,
    donor_mobilisation_active BOOLEAN NOT NULL DEFAULT FALSE,
    notified_donors_count INTEGER NOT NULL DEFAULT 0,
    accepted_donors_count INTEGER NOT NULL DEFAULT 0,
    arrived_donors_count INTEGER NOT NULL DEFAULT 0,
    completed_donations_count INTEGER NOT NULL DEFAULT 0,
    closure_reason TEXT,
    closed_by VARCHAR(255),
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 10. donor_notifications (§4, §20, §45)
CREATE TABLE donor_notifications (
    id VARCHAR(64) PRIMARY KEY,
    donor_id VARCHAR(64) NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    request_id VARCHAR(64) NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
    donor_name VARCHAR(255) NOT NULL,
    blood_group VARCHAR(8) NOT NULL,
    distance_km DECIMAL(6, 2) NOT NULL,
    tier INTEGER NOT NULL CHECK (tier IN (1, 2, 3, 4)),
    selected_blood_centre_id VARCHAR(64) REFERENCES blood_centres(id),
    expected_arrival_time TIMESTAMP WITH TIME ZONE,
    notification_status VARCHAR(32) NOT NULL DEFAULT 'SENT',
    delivery_status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- Aggregate delivery status
    response_status VARCHAR(32),
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    blood_centre_id VARCHAR(64) NOT NULL REFERENCES blood_centres(id),
    blood_centre_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 11. notification_deliveries (§5, §40, §42, §45)
CREATE TABLE notification_deliveries (
    id VARCHAR(64) PRIMARY KEY,
    notification_id VARCHAR(64) NOT NULL REFERENCES donor_notifications(id) ON DELETE CASCADE,
    channel VARCHAR(32) NOT NULL, -- 'IN_APP', 'PUSH', 'SMS', 'WHATSAPP'
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'SENT', 'DELIVERED', 'FAILED'
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT
);

-- 12. request_matches (§45)
CREATE TABLE request_matches (
    id VARCHAR(64) PRIMARY KEY,
    request_id VARCHAR(64) NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
    donor_id VARCHAR(64) NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    approximate_distance DECIMAL(6, 2) NOT NULL,
    match_status VARCHAR(32) NOT NULL DEFAULT 'MATCHED',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 13. request_inventory_search_results (§6, §12, §45)
CREATE TABLE request_inventory_search_results (
    id VARCHAR(64) PRIMARY KEY,
    request_id VARCHAR(64) NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
    inventory_id VARCHAR(64) NOT NULL REFERENCES blood_inventory(id) ON DELETE CASCADE,
    blood_centre_id VARCHAR(64) NOT NULL REFERENCES blood_centres(id) ON DELETE CASCADE,
    units_found INTEGER NOT NULL CHECK (units_found >= 0),
    distance_km DECIMAL(8, 2) NOT NULL,
    freshness_status VARCHAR(32) NOT NULL, -- 'FRESH', 'STALE', 'UNCONFIRMED'
    search_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 14. reservations (§7, §18, §19, §31, §45)
CREATE TABLE reservations (
    id VARCHAR(64) PRIMARY KEY,
    request_id VARCHAR(64) NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
    inventory_id VARCHAR(64) NOT NULL REFERENCES blood_inventory(id) ON DELETE CASCADE,
    units INTEGER NOT NULL CHECK (units > 0),
    status VARCHAR(32) NOT NULL DEFAULT 'RESERVATION_REQUESTED',
    centre_confirmation BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 15. inventory_movements (§18, §19, §45)
CREATE TABLE inventory_movements (
    id VARCHAR(64) PRIMARY KEY,
    inventory_id VARCHAR(64) NOT NULL REFERENCES blood_inventory(id) ON DELETE CASCADE,
    action VARCHAR(32) NOT NULL, -- 'ADDED', 'RESERVED', 'RELEASED', 'ISSUED', 'EXPIRED', 'DISCARDED'
    units INTEGER NOT NULL CHECK (units > 0),
    performed_by VARCHAR(64) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    reference_type VARCHAR(64), -- 'RESERVATION', 'DISPOSAL', 'EXCESS'
    reference_id VARCHAR(64)
);

-- 16. donation_events (§2, §18, §19, §45)
CREATE TABLE donation_events (
    id VARCHAR(64) PRIMARY KEY,
    donor_id VARCHAR(64) NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    donor_name VARCHAR(255) NOT NULL,
    blood_centre_id VARCHAR(64) NOT NULL REFERENCES blood_centres(id) ON DELETE CASCADE,
    blood_centre_name VARCHAR(255) NOT NULL,
    request_id VARCHAR(64) NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
    donation_type VARCHAR(64) NOT NULL, -- 'WHOLE_BLOOD', 'APHERESIS_PLATELETS', 'PLASMA'
    collection_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    assessment_status VARCHAR(64) NOT NULL DEFAULT 'SCREENING_PENDING',
    processing_status VARCHAR(64) NOT NULL DEFAULT 'PROCESSING_PENDING',
    release_status VARCHAR(64) NOT NULL DEFAULT 'PENDING',
    volume_ml INTEGER NOT NULL,
    screening_status VARCHAR(64) NOT NULL,
    deferral_reason TEXT, -- Confidential medical record between donor and centre
    testing_status VARCHAR(64) NOT NULL DEFAULT 'TESTING_PENDING',
    component_created VARCHAR(64),
    component_units INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 17. system_config (§11, §25, §45)
CREATE TABLE system_config (
    id VARCHAR(64) PRIMARY KEY,
    config_key VARCHAR(128) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description TEXT NOT NULL,
    updated_by VARCHAR(64) NOT NULL REFERENCES platform_admins(id),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 18. audit_logs (§14, §38, §39, §45)
CREATE TABLE audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    actor_id VARCHAR(64) NOT NULL,
    actor_role VARCHAR(128) NOT NULL, -- Stored denormalised
    actor_sub_role VARCHAR(128), -- Stored denormalised
    organisation_type VARCHAR(64),
    organisation_id VARCHAR(64),
    entity_type VARCHAR(64) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    previous_state VARCHAR(64),
    new_state VARCHAR(64),
    action VARCHAR(128) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    metadata JSONB
);
```

### Platform Configuration Safety (§11, §25)
Platform configuration is divided conceptually into:
- **Operational Configuration:** Examples: `DONOR_NOTIFICATION_TIMEOUT_MINUTES`, `DUPLICATE_REQUEST_WINDOW_MINUTES`, `INVENTORY_FRESHNESS_THRESHOLD_MINUTES`, `DONOR_RENOTIFICATION_QUIET_PERIOD_MINUTES`, `RESERVATION_CONFIRMATION_TIMEOUT_MINUTES`, `MOBILISATION_TIER_1_RADIUS_KM`, `MOBILISATION_TIER_2_RADIUS_KM`, `MOBILISATION_TIER_3_RADIUS_KM`, `MOBILISATION_TIER_4_RADIUS_KM`, `NOTIFICATION_RETRY_LIMIT`. These may be managed by authorised platform administrators.
- **Clinical / Medical Policy:** Examples: Donor eligibility criteria, medical deferral rules, testing/release criteria, clinical compatibility rules. These must not be treated as ordinary editable platform configuration. LifeLink must defer these decisions to applicable authoritative standards and authorised blood-centre workflows. A platform admin must not be able to casually alter medical eligibility by changing a normal operational configuration value.

---

## 46. Role-Based Access Control (RBAC) Matrix

| Resource / Action | Hospital Staff (Requester) | Hospital Staff (Coordinator) | Hospital Staff (Admin) | Voluntary Donor | Blood Centre Staff | Platform Admin |
|---|---|---|---|---|---|---|
| Create Emergency Blood Request | YES | YES | NO | NO | NO | NO |
| View Hospital Blood Requests | OWN | ALL | ALL | NO | RELEVANT | ALL (Audit) |
| Cancel / Close Blood Request | NO | YES | YES | NO | NO | NO |
| Search Verified Blood Inventory | YES | YES | YES | NO | ALL | ALL (Audit) |
| Request Inventory Reservation | YES | YES | NO | NO | NO | NO |
| Confirm / Decline Reservation | NO | NO | NO | NO | YES | NO |
| Publish / Update Inventory | NO | NO | NO | NO | YES | NO |
| Modify Row Units Directly | NO | NO | NO | NO | YES (Internal) | NO |
| Toggle Personal Availability | NO | NO | NO | YES | NO | NO |
| Accept / Decline Alert | NO | NO | NO | YES | NO | NO |
| Confirm Donor Centre Arrival | NO | NO | NO | NO | YES | NO |
| Record Pre-Screening Assessment | NO | NO | NO | NO | YES | NO |
| Record TTI Laboratory Testing | NO | NO | NO | NO | YES | NO |
| Record Component Processing | NO | NO | NO | NO | YES | NO |
| Issue Emergency Units | NO | NO | NO | NO | YES | NO |
| Verify Hospital / Blood Centre | NO | NO | NO | NO | NO | YES |
| Suspend Organisation Account | NO | NO | NO | NO | NO | YES |
| Manage Operational `system_config` | NO | NO | NO | NO | NO | YES |
| View Complete Cross-Org Audit Logs | NO | NO | NO | NO | NO | YES |

---

## 47. Central Workflow Visual & Architecture Topology

```
                  ┌─────────────────────────────────┐
                  │      HOSPITAL EMERGENCY         │
                  │        CLINICAL UNIT            │
                  └────────────────┬────────────────┘
                                   │
                                   ▼
             ┌───────────────────────────────────────────┐
             │       LifeLink Coordination Engine        │
             │        (Real-time State Machine)          │
             └──────┬─────────────────────────────┬──────┘
                    │                             │
       [1. Inventory First]             [2. Shortage Mobilisation]
                    │                             │
                    ▼                             ▼
     ┌────────────────────────────┐  ┌────────────────────────────┐
     │  Verified Blood Centres    │  │  Eligible Voluntary Donors │
     │   (Transfusion Authority)  │  │    (Concentric Radius)     │
     └──────────────┬─────────────┘  └────────────┬───────────────┘
                    │                             │
                    │ [Soft-lock Reservation]     │ [Accept & Travel]
                    ▼                             ▼
     ┌────────────────────────────────────────────────────────────┐
     │               Participating Blood Centre                   │
     │      Arrival Verification ──► Pre-Screening Exam           │
     │                 Phlebotomy Collection                      │
     │            Mandatory 5-Infection Testing                   │
     │               Component Separation                         │
     │                Cold-Chain Dispatch                         │
     └────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
     ┌────────────────────────────────────────────────────────────┐
     │             Transfusion Delivery to Patient                │
     │               100% Audit Trail Recorded                    │
     └────────────────────────────────────────────────────────────┘
```

---

## 48. Regulatory Compliance & Legal Defensibility

1. **Drug and Cosmetic Rules (Part XII-B):** All phlebotomy, medical screening, TTI testing, and component storage are conducted exclusively on licensed premises with current state and central drug licensing.
2. **National Blood Transfusion Council (NBTC):** LifeLink enforces voluntary non-remunerated blood donation principles. Commercial blood procurement, donor compensation, and replacement donor coercion are strictly banned on the platform.
3. **Chain of Custody:** The combination of immutable audit logging, serialised row reservations, and verified staff IDs satisfies ISO 15189 and NABH transfusion safety accreditation standards.

---

## 49. Legal Immunity & Liability Separation

LifeLink provides digital information routing and coordination services. The platform is not a blood establishment, manufacturer, or testing laboratory. All clinical liability concerning donor suitability, biological product sterility, testing accuracy, compatibility testing, and transfusion administration remains solely with the respective blood centres and treating hospitals.

---

## 50. Donor Dashboard & Preferred Blood Centre Settings

The voluntary donor interface provides:
1. **Emergency Availability Toggle:** Real-time switch allowing donors to signal operational availability or pause alerts during illness, travel, or fatigue.
2. **Preferred Blood Centre (`preferred_blood_centre_id`):** Allows donors to designate their regular or geographically preferred participating blood bank. When mobilised, this centre is prioritised for destination routing.
3. **Donation History & Interval Advisory:** Displays past donation timestamps, cumulative donations count, and countdown to interval eligibility.
4. **Confidentiality Assurance Card:** Explains privacy protections, data masking, and voluntary rights.

---

## 51. Empirical Time Tracking & Communication Guardrails

LifeLink measures and reports empirical operational timelines rather than promising unrealistic instant delivery:
- `avg_request_to_inventory_sec` — Empirical elapsed time from request broadcast to locating matching inventory.
- `avg_request_to_first_notification_sec` — Elapsed time to dispatching first mobilization alert.
- `avg_request_to_donor_accept_sec` — Elapsed time to first confirmed voluntary donor acceptance.
- `avg_request_to_donor_arrival_min` — Mean donor transit and arrival duration.
- `avg_request_to_fulfilment_min` — End-to-end duration to verified issue.

No LifeLink interface or communication may promise fixed transit times (e.g., "Blood will arrive in 10 minutes"), as traffic conditions, cross-matching protocols, and laboratory validations are variable.

---

## 52. Demo Isolation Architecture & System Analytics

### Demo Isolation Mechanism (§52, §15)
Demo isolation must be enforced at the environment level, not merely by labels in the database:
- Demo mode must run in a dedicated environment or physically separate database/schema from production.
- Demo application instances must refuse to connect to production database credentials. The runtime must validate the environment before establishing the database connection.
- Demo mode must use test/stub notification providers.
- Demo mode must never send real SMS, WhatsApp messages, or push notifications to real users.
- Demo accounts must be clearly namespaced, for example `DEMO_`.
- Demo test credentials must be clearly distinguishable from production accounts.
- Every demo page, API response, dashboard, and generated notification must carry:
  `DEMO DATA — NOT REAL MEDICAL INVENTORY`
- Production secrets must never be available to the demo runtime.
- Demo seed data must never be allowed to execute against a production database.

Do not prescribe a specific real-world phone-number range unless the deployment provider explicitly documents that range as safe for testing. Prefer stub/test notification providers over real phone numbers.

### System Analytics
LifeLink tracks macro-level emergency coordination efficiency:
- Ratio of requests fulfilled directly from pre-existing inventory versus donor mobilisation.
- Donor mobilisation response rates across distance tiers.
- Blood centre inventory freshness index.

---

## 53. REST API Endpoint Specifications

All endpoints use standard JSON payloads and require Bearer token authentication with verified role claims.

### `POST /api/v3/requests`
Creates an emergency blood request.  
**Required Role:** `HOSPITAL_STAFF` (`REQUESTER` or `COORDINATOR`).  
**Payload:**
```json
{
  "blood_group": "O+",
  "component_type": "Packed Red Blood Cells",
  "units_required": 5,
  "urgency": "CRITICAL",
  "department": "Trauma ICU (Bed 04)",
  "contact_person": "Dr. Anita Desai",
  "contact_number": "+91 8647 222333",
  "request_reason": "Mass Casualty / Acute Trauma Haemorrhage",
  "operational_notes": "Patient stabilized post-accident, active capillary bleed.",
  "required_by": "2 hours"
}
```
**Response (201 Created):**
```json
{
  "id": "LL-2026-000184",
  "status": "INVENTORY_SHORTAGE",
  "units_required": 5,
  "units_fulfilled": 0,
  "expires_at": "2026-09-25T16:00:00Z",
  "inventory_found_units": 3,
  "shortage_units": 2,
  "donor_mobilisation_active": true
}
```

### `POST /api/v3/inventory/reserve`
Soft-locks and reserves verified units.  
**Required Role:** `HOSPITAL_STAFF` (`REQUESTER` or `COORDINATOR`).  
**Payload:**
```json
{
  "inventory_id": "inv_nara_prbc_o_pos_1",
  "request_id": "LL-2026-000184",
  "units": 2,
  "expected_version": 1
}
```
**Response (200 OK):**
```json
{
  "success": true,
  "reservation_id": "res_98231",
  "reserved_units": 2,
  "new_version": 2,
  "status": "RESERVATION_REQUESTED"
}
```

### `POST /api/v3/donations/screen`
Records pre-donation clinical screening outcome.  
**Required Role:** `BLOOD_CENTRE_STAFF`.  
**Payload:**
```json
{
  "donor_id": "dn_01_ravi",
  "request_id": "LL-2026-000184",
  "blood_centre_id": "bc_narasaraopet",
  "outcome": "PASSED",
  "clinical_notes": "Hb 14.1 g/dL, BP 122/82, Weight 70 kg"
}
```

### `POST /api/v3/donations/test-and-process`
Records mandatory TTI test results and creates cleared component inventory.  
**Required Role:** `BLOOD_CENTRE_STAFF`.  
**Payload:**
```json
{
  "donation_id": "don_evt_001",
  "test_result": "CLEARED",
  "component_created": "Packed Red Blood Cells",
  "units_created": 1
}
```

---

## 54. WebSocket Real-Time Events Protocol

LifeLink maintains secure WebSocket channels for instant notification:
- `request:updated` — Broadcasts request status transitions to participating hospital and blood centre dashboards.
- `inventory:updated` — Broadcasts inventory level changes and reservations.
- `donor:mobilised` — Direct channel alert to authenticated donor devices.
- `donor:status_changed` — Notifies blood centre of donor acceptance or arrival.

---

## 55. Data Encryption & Security Standards

- **In-Transit:** All client-server communication must use TLS 1.3 with HSTS enabled.
- **At-Rest:** Database volumes, backups, and audit archives must be encrypted using AES-256.
- **Field-Level Encryption:** Donor personal identifiable information (phone numbers, approximate GPS coordinates) is encrypted with organization-specific keys.

---

## 56. High-Availability Database Configuration

- Multi-Availability Zone PostgreSQL cluster with synchronous replication.
- Automated failover with recovery point objective (RPO) = 0 and recovery time objective (RTO) < 30 seconds.
- Continuous WAL archiving with point-in-time recovery up to 30 days.

---

## 57. Disaster Recovery & Fallback Procedures

In the event of total platform disconnection:
1. Hospital staff switch immediately to statutory Blood Bank Telephonic Hotline Directory.
2. Blood centres maintain printed local stock sheets updated every 4 hours.
3. Once platform connectivity is restored, reconciliation tools permit manual backfilling of telephonically coordinated issuances.

---

## 58. Observability, Alerting & Health Checks

- `/healthz` — Service liveness probe.
- `/readyz` — Database and queue connectivity readiness probe.
- Critical Alerting: Triggered if inventory query response time > 500 ms, or if emergency SMS queue latency > 30 seconds.

---

## 59. Canonical Emergency Simulation Scenario (§59)

The canonical demonstration scenario verifies the end-to-end clinical workflow:
- **Hospital:** LifeLink General Hospital, Narasaraopet.
- **Patient Need:** 5 Units O+ Packed Red Blood Cells (Trauma ICU, Bed 04, Mass Casualty / Active Haemorrhage).
- **Available Inventory:**
  - Narasaraopet Blood Centre: 2 Units O+ PRBC (Available).
  - Guntur Blood Centre: 1 Unit O+ PRBC (Available).
  - Total found: 3 Units. Shortage: 2 Units.
- **Workflow Steps:**
  1. Hospital submits request `LL-2026-000184`.
  2. Inventory search identifies 3 units; computes shortage of 2 units.
  3. Hospital soft-locks 2 units at Narasaraopet Blood Centre; `reserved_units` increments atomically.
  4. Donor mobilisation automatically triggers for shortage of 2 units (Tier 1: 0–5 km).
  5. Donors Ravi Kumar (ETA 15m) and Priya Sharma (ETA 25m) accept mobilisation.
  6. Ravi Kumar arrives at Narasaraopet Blood Centre; staff confirms arrival.
  7. Pre-screening assessment completed (Hb 14.1 g/dL; passed).
  8. Blood donation collected (450 ml whole blood).
  9. DGHS 5-infection testing completed (non-reactive). Component separated into PRBC.
  10. Cleared unit added to inventory; request reaches 100% fulfillment (5 units total). Full audit trail validated.

---

## 60. Acceptance Testing & Safety Verification Matrix

| Test ID | Test Description | Expected Result | Pass Criteria |
|---|---|---|---|
| TC-01 | Attempt reservation when $\text{units} - \text{reserved\_units} < \text{requested}$ | Write rejected with `INSUFFICIENT_UNITS` | Zero over-allocation allowed |
| TC-02 | Concurrent reservation writes on identical row | Version mismatch triggers `CONFLICT` error | No silent data overwrite |
| TC-03 | Request created within 30 min of identical request | Duplicate warning displayed; requires confirmation | Explicit staff confirmation logged |
| TC-04 | Notification timeout elapses without donor response | Status transitions to `NO_RESPONSE`; Tier 2 alerted | Escalation timer adheres to config |
| TC-05 | Medical deferral recorded by blood centre | Deferral reason hidden from hospital portal | Medical privacy preserved |
| TC-06 | `expires_at` passes without fulfillment | Status automatically transitions to `EXPIRED` | Unissued reservations released |
| TC-07 | Demo mode execution | Visible DEMO banner; refuses production DB | Strict environment isolation |

---

## 61. Deployment & Infrastructure Architecture

- Containerised microservices architecture deployed on Kubernetes (EKS / GKE).
- Ephemeral, stateless application pods behind high-performance load balancers.
- Redis cache layer for read-heavy inventory lookups with write-through invalidation.
- Standalone PostgreSQL cluster with serialisable transaction isolation level for reservation writes.

---

## 62. Operational Runbooks & Maintenance

1. **Adding an Operational System Config Parameter:**
   Must be performed via platform admin account writing to `system_config`.
2. **Rotating Security Keys:**
   Executed during low-volume maintenance windows; rolling pod restart ensures seamless secret rotation without service interruption.
3. **Audit Log Forensics:**
   Audit logs are queryable via read-only platform admin views; direct database write/delete access is permanently disabled.

---

## 63. Engineering Safety Invariant (§30)

LifeLink must never trade medical safety or data correctness for apparent speed.

For every feature, change, and deployment, the development and review team must verify:
1. **Medical Safety:** Could this feature create an unsafe medical assumption?
2. **Source of Truth:** Which organisation owns the authoritative information?
3. **Privacy:** Is unnecessary donor, patient, or medical information exposed?
4. **Security:** Can an unauthorised role modify protected data?
5. **Concurrency:** Can two users simultaneously believe they control the same inventory?
6. **Reliability:** What happens when a service, notification provider, database connection, or internet connection fails?
7. **Auditability:** Can the system reconstruct what happened, who acted, and when?
8. **Real-World Workflow:** Would hospital and blood-centre staff actually use the feature during an emergency?
9. **Regulatory / Operational Boundary:** Does LifeLink accidentally perform a responsibility belonging to an authorised medical or blood-centre workflow?

---

# END
