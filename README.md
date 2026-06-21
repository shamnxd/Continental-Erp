> **⚠️ CONFIDENTIAL & PROPRIETARY**
> This repository contains proprietary commercial software developed exclusively for internal corporate operations. Unauthorized copying, distribution, or modifications of this project, via any medium, is strictly prohibited. Intellectual property rights are reserved under corporate policy.

---

# 🏢 Continental Service & Operations ERP Suite

The **Continental Service & Operations ERP** is an integrated, internal enterprise resource planning portal designed to orchestrate and track company service lifecycles, operational financials, contracts, and human resource assignments. It consolidates operations across multiple critical departments into a unified ecosystem.

---

## 📋 ERP Modules & Business Scope

The system integrates several core modules to manage the full operational cycle of a service enterprise:

### 1. 💼 CRM & Sales Pipeline (Customer Relationship Management)
*   **Client Registry & Profiles**: Centralized database tracking client details, contract histories, and operational locations.
*   **Enquiry Processing**: Automated ticketing to log, prioritize, and manage customer service inquiries, leads, and operational requests.
*   **Quotation Engine**: Lifecycle tracking for sales quotes generated from active enquiries.

### 2. 🧮 Project Estimation & Costing Engine
*   **Costing Sheets**: Calculation of material rates, labor expenses, overheads, markups, and estimated margins.
*   **Costing Revisions**: Version-controlled revisions tracking adjustments during quotation negotiation.
*   **Pricing Configurations**: Integrated custom pricing matrices (e.g., Copper Pipe Rates) for service estimations.

### 3. 🎫 Field Service Management (FSM) & Ticketing
*   **Complaint Lifecycle**: Structured ticket management tracking issues from entry through technician assignment, dispatch, and final resolution.
*   **SMR (Service Maintenance Reports)**: Handled by technicians on-site, recording labor, parts used, actions taken, and submitted for manager approval.
*   **Kanban Job Tracking**: A real-time, interactive board visualization for current job statuses, dispatcher boards, and completion workflows.

### 4. 📝 Contract & Lifecycle Management
*   **Annual Maintenance Contracts (AMC)**: Administration of active, pending, and expiring AMC plans, automated renewals, and billing cycle audits.
*   **AMC Visit Scheduler**: Automatic tracking and scheduling of recurring field visits required under active maintenance contracts.

### 5. 👥 Human Resource Management (HRM)
*   **Staff Registry**: Directory profiles of internal employees, mapping dispatchers, managers, and field technicians.
*   **Leave Management**: Leave requests submit, review, and approval flow to prevent overlapping technician assignments.

### 6. 💰 Financial Management & Accounting
*   **Client Invoicing**: Auto-generation of invoices tied to quotations, jobs, and client accounts.
*   **Vendor Bills (Accounts Payable)**: Billing management for suppliers and subcontractors.
*   **General Ledger**: Double-entry ledger architecture tracking income and expense entries to monitor operational cash flows.
*   **Tally Integration**: Dual sync connection pipeline syncing ledgers, vouchers (sales/purchase/receipt/payment), cash/bank balances, and aging outstanding profiles automatically with Tally.ERP 9 and TallyPrime.

### 7. 🔒 Compliance & Audit Control
*   **System Audit Logs**: Automated capturing of administrative, financial, and operational operations for internal regulatory review and accountability.

---

## 🏗️ Technical Architecture & SOLID Principles

The system is built on **React** (Frontend Client) and **Node.js/Express/TypeScript** (Backend Server), implementing a strictly decoupled clean-architecture:

1.  **Dependency Inversion (SOLID - DIP)**: Controllers communicate with the business layer strictly through abstract generic interfaces (`IUseCase<Req, Res>`), resolved dynamically at runtime.
2.  **Central Dependency Injection**: Managed via `tsyringe`. Injected properties use the `@inject(Token)` annotation, promoting mockable testing environments.
3.  **Boilerplate-free Base Repositories**: Generic `IBaseRepository<T>` and abstract Mongoose `BaseRepository` isolate data layers, handling core CRUD actions and preventing schema leakage using strict `toDomain` mappers.
4.  **Strict Environment Validation**: A centralized env validator (`src/config/env.ts`) pre-loads `.env` and validates all operational variables on boot, preventing startup under faulty configuration states.
5.  **Daily Rotating File Logger**: Advanced file logging with a **3-day retention policy** running during initialization to automatically purge older system logs.
6.  **Type Safety**: Built entirely with strict type annotations; `any` is strictly banned to guarantee static-analysis integrity.

---

## 📁 Repository Workspace Layout

```bash
├── admin/                       # Admin Portal (Vite / React / PWA / Electron)
├── staff/                       # Staff Portal (Vite / React / PWA / Capacitor / Electron)
├── client/                      # Customer Complaint Register (Vite / React)
├── server/                      # Core Enterprise Services API (Node.js / Express / TS)
└── tally-agent/                 # Standalone Tally Sync Desktop Agent (Electron / Settings GUI)
    ├── logs/                    # Rotating log files directory (Git ignored)
    └── src/
        ├── config/              # Dependency injection registries & Env Validation
        ├── constants/           # Enumerated Status Codes and Globals
        ├── controllers/         # Decoupled Controllers managing HTTP mappings
        ├── dtos/                # Request / Response Data Transfer Objects
        ├── errors/              # Custom Operational Error classes (AppError)
        ├── interfaces/          # Centralized Global abstractions
        │   ├── models/          # Database-agnostic Entity Interfaces
        │   ├── repositories/    # Abstract Data layer Contracts
        │   └── usecases/        # Decoupled Business Flow Contracts
        ├── middleware/          # Validation schema checks & Centralized Error handler
        ├── models/              # Concrete Mongoose schemas (Amc, ClientInvoice, Costing, LedgerEntry, etc.)
        ├── repositories/        # Mongoose Repository implementations
        ├── routes/              # Express Router mappings
        ├── usecases/            # Business Logic / Flow executions (finance, client, costing, amc, etc.)
        └── utils/               # Native utility helper classes (Logger)
```

---

## ⚙️ Environment Settings Configuration

Create a `.env` file at the root of the `/server` directory:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/continental_service
JWT_ACCESS_SECRET=access_secret_123456789_super_secure
JWT_REFRESH_SECRET=refresh_secret_987654321_super_secure
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
COOKIE_NAME_REFRESH=refreshToken
FRONTEND_URL=http://localhost:5173
LOG_RETENTION_DAYS=3
```

---

## 🚀 Internal Development Setup

### Server Workspace Setup (`/server`):

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Boot dev watcher**:
    ```bash
    npm run dev
    ```
3.  **Compile TypeScript**:
    ```bash
    npm run build
    ```
4.  **Production boot**:
    ```bash
    npm start
    ```

### Portals Workspaces Setup (`/admin`, `/staff`, `/client`):

For any of the portals:
1.  **Navigate to the folder** (e.g., `cd admin` or `cd staff` or `cd client`):
    ```bash
    cd <folder-name>
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Start Dev server**:
    ```bash
    npm run dev
    ```

### Tally Sync Agent Setup (`/tally-agent`):

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Start Electron Dev App**:
    ```bash
    npm start
    ```
3.  **Compile Windows installer executable**:
    ```bash
    npm run dist
    ```
