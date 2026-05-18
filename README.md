# 🔒 Continental Service Management Suite (Proprietary)

> **⚠️ CONFIDENTIAL & PROPRIETARY**
> This repository contains proprietary commercial software developed exclusively for internal corporate operations. Unauthorized copying, distribution, or modifications of this project, via any medium, is strictly prohibited. Intellectual property rights are reserved under corporate policy.

---

## 📋 Business Operational Scope

The **Continental Service Management Suite** is a unified internal portal designed to orchestrate and track company service lifecycles. It consolidates operations across multiple critical departments:

*   **Client Registry & Profiles**: Centralized directory tracking client details, contract histories, and operational locations.
*   **Annual Maintenance Contracts (AMC)**: Administration of active, pending, and expiring AMC plans, automated renewals, and billing cycle audits.
*   **Enquiry & Complaint Processing**: Automated ticketing, prioritizing client service requests and escalations.
*   **Quotations & Invoicing**: Commercial bidding processes, quote generation, and integrated financial invoicing workflows.
*   **Staff Directory & Dispatch**: Scheduling field technicians, assigning job tickets, and managing internal staff records.
*   **Kanban Job Tracking**: A real-time, interactive board visualization for current job statuses, dispatcher boards, and completion workflows.

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
├── client/                      # Corporate Dispatch Portal (Vite / React / Tailwind)
└── server/                      # Core Enterprise Services API (Node.js / Express / TS)
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
        ├── models/              # Concrete Mongoose schemas
        ├── repositories/        # Mongoose Repository implementations
        ├── routes/              # Express Router mappings
        ├── usecases/            # Business Logic / Flow executions
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

### Client Workspace Setup (`/client`):

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Start Dev server**:
    ```bash
    npm run dev
    ```
