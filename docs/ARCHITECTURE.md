# CareNex – System Architecture & Technical Specification

## 1. High-Level Architecture Overview

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Client Layer (React + TypeScript + Tailwind)"]
        UI_Patient["Patient Portal<br/>(Discovery, Booking, EHR, Prescriptions)"]
        UI_Doctor["Doctor Portal<br/>(Queue, Prescription Editor, Schedule)"]
        UI_Hospital["Hospital Admin Portal<br/>(Branch Mgmt, Doctor Roster)"]
        UI_Diag["Diagnostic Centre Portal<br/>(Test Catalogue, Bookings)"]
        UI_Admin["Super Admin Portal<br/>(Analytics, Verification, Cities)"]
        Map_Leaflet["Interactive Leaflet Map<br/>(OpenStreetMap Pins, Distance, Routing)"]
    end

    subgraph APILayer["Backend API & Signaling Layer (Node.js + Express)"]
        Router["Express REST Router"]
        AuthMiddleware["JWT & RBAC Middleware"]
        WebRTC["WebRTC WebSocket Signaling Server<br/>(/ws/telehealth)"]
        Haversine["Haversine Distance Engine<br/>(Geodesic Proximity Engine)"]
        TxManager["Database Transaction & Booking Guard"]
    end

    subgraph DataLayer["Persistence Layer"]
        DB[(SQLite / PostgreSQL + PostGIS)]
        SpatialIdx["Spatial GiST / R-Tree Indexing"]
        AuditTrail["Audit Logs & Status History"]
    end

    UI_Patient --> Router
    UI_Doctor --> Router
    UI_Hospital --> Router
    UI_Diag --> Router
    UI_Admin --> Router
    Map_Leaflet --> Router

    UI_Doctor <-->|WebSocket| WebRTC
    UI_Patient <-->|WebSocket| WebRTC

    Router --> AuthMiddleware
    AuthMiddleware --> TxManager
    TxManager --> DB
    Router --> Haversine
    Haversine --> DB
    DB --> SpatialIdx
    DB --> AuditTrail
```

## 2. Multi-City Geographic Engine

CareNex uses dual-mode geographic queries:
1. **Local Development & Fast Execution**: Custom Haversine trigonometric functions compute great-circle distance in kilometers:
   $$d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
2. **Production Mode (PostgreSQL + PostGIS)**: Uses `ST_DWithin` and `ST_Distance` on `GEOGRAPHY(Point, 4326)` columns backed by GiST indexes for sub-millisecond radius filtering across millions of records.

## 3. Booking Engine & Concurrency Model

When an appointment booking request arrives:
1. `BEGIN TRANSACTION`
2. Slot existence and reservation check (`SELECT is_booked FROM doctor_slots WHERE id = ?`)
3. Concurrency conflict check: Query active appointments matching `doctor_id`, `branch_id`, `date`, `time`, and `status != 'CANCELLED'`. If matching record exists, `ROLLBACK` and return `409 Conflict`.
4. Insert into `appointments` with unique booking ID `CNX-YYYY-XXXXXX`.
5. Update `doctor_slots` to `is_booked = 1`.
6. Insert audit trail entry into `appointment_status_history`.
7. Insert notification for patient.
8. `COMMIT`
