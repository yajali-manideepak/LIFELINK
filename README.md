# LifeLink — Real-Time Blood Availability & Emergency Coordination Platform

> **Emergency Coordination Network connecting verified hospitals, licensed blood banks, voluntary donors, and emergency care teams.**

LifeLink is designed to bridge the communication gap during critical medical emergencies (acute trauma, post-partum hemorrhage, severe thrombocytopenia, emergency surgeries), replacing chaotic phone calls with verified, real-time broadcasts and atomic inventory reservations.

---

## 🌟 Key Features

### 1. Hospital Emergency Requisition Portal
- **Rapid Requisitions:** Authorized clinicians raise urgent/critical requests with blood component, Rh requirement, target delivery time, and cross-match instructions.
- **Automated District Broadcast:** Requests are immediately distributed to verified blood banks in the district.
- **Response Tracking:** Real-time visibility into incoming blood bank confirmations, ready times, and collection arrangements.
- **Patient Tracking Tokens:** Generates anonymous 6-digit family inquiry tokens with zero exposed patient PII.

### 2. Blood Bank Management Portal
- **Incoming Broadcasts:** Filter pending emergency requisitions by urgency and component requirements.
- **Inter-Facility Response:** Respond with confirmed unit availability, dispatch bays, and collection instructions.
- **Atomic Unit Reservations:** Locks inventory with automated timeouts to eliminate double-allocation and inventory ghosting.
- **Real-Time Inventory Management:** Track PRBC, Whole Blood, Platelets, FFP, and Cryoprecipitate with automated freshness status (`RECENTLY_VERIFIED`, `UNVERIFIED`, `STALE`).

### 3. Regulatory Super Admin Portal
- **Institutional Verification:** Vet hospital licenses and regulatory credentials before granting broadcast permissions.
- **Inventory Quality Monitoring:** Identify stale stock registers (>24h since manual verification).
- **Immutable Audit Trail:** Append-only log recording actor timestamp, role badge, and transactional context for compliance inspections.

### 4. Voluntary Donor Registry
- **Emergency Shortage Pledges:** Voluntary donors register their blood group and district to receive targeted shortage alerts.
- **Donor Dashboard:** Eligibility counter based on minimum donation intervals, local blood bank directory, and donation badges.
- **DPDP Compliant:** Full consent control with one-click alert preferences and opt-out options.

### 5. Public Availability Search & Status Tracker
- **Search Live Stock:** Check verified blood component availability across participating facilities.
- **Direct Contact Directory:** Official contact numbers and emergency desks of licensed blood centers.
- **Family Status Tracker:** 6-digit token tracking without confidential medical or identity disclosures.

---

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **State & Store:** Transactional in-memory store with audit logging, atomic locking, and localStorage synchronization
- **Backend / API:** Node.js native HTTP coordination service (`server/server.ts`)
- **Test Suite:** Automated verification test runner (`scripts/test-scenarios.ts`)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd LIFELINK

# Install dependencies
npm install
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Run Automated Tests
```bash
npm test
```
Executes comprehensive end-to-end scenarios verifying:
- Institutional verification gating
- Emergency request broadcast
- Inter-facility responses
- Atomic inventory reservation & over-reservation prevention
- Stale inventory detection
- Immutable audit logging
- Patient de-identification

### Run API Server
```bash
npm run server
```
Launches the REST API coordination service on port 4000.

---

## 🛡️ Clinical & Regulatory Notice
*LifeLink is an emergency logistics and communication coordination platform. It does not replace mandatory pre-transfusion cross-matching, blood grouping confirmation, cold-chain transport regulations, or clinical judgment. Participating institutions remain responsible for compliance with the Drugs and Cosmetics Rules and National Blood Transfusion Council (NBTC) guidelines.*
