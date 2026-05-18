# 🛠️ Continental Service Management Suite (ServicePro)

Welcome to the **Continental Service Management Suite**—a premium, enterprise-grade, and strictly decoupled service administration dashboard. The entire application is built using modern **TypeScript**, **Node.js/Express**, and **React** following strict **SOLID** software architecture patterns.

---

## 🏗️ Architectural Core Principles & Patterns

The server is engineered from the ground up to respect industry-standard clean coding principles:

*   **Dependency Inversion Principle (DIP)**: High-level HTTP Controllers never import or depend on concrete Use Case classes. They communicate strictly through abstract generic interfaces (`IUseCase<Req, Res>`), resolved dynamically at runtime.
*   **Dependency Injection (DI)**: Powered by `tsyringe`. Decoupled services are registered in a centralized injection container (`src/config/container.ts`) and injected into classes via `@inject(Token)` annotations.
*   **Boilerplate-free Base Repository Pattern**: A generic `IBaseRepository<T>` and abstract Mongoose `BaseRepository` isolate data layers, handling core CRUD database actions dynamically. Implementing repositories only configure custom model-specific queries.
*   **Data Mapper Pattern**: Raw Mongoose document types are converted into database-agnostic domain entities (`IUser`, etc.) through an mapping method (`toDomain`) before escaping the repository, ensuring zero database schema leakage into Business logic.
*   **Strict Environment Verification**: A central configuration validator (`src/config/env.ts`) pre-loads `.env` and enforces validation checks on all essential keys on server boot, securely shutting down the engine with descriptive crash logs if any variable is missing.
*   **Daily Rotating File Logger**: A custom, high-performance Node-native logger writing to daily files (`logs/app-YYYY-MM-DD.log`) coupled with an automated **3-day retention policy** which purges older files on server startup.
*   **Zero 'any' Policy**: The entire codebase enforces strict type safety with precise TS definitions; the forbidden `any` keyword is completely avoided.

---

## 📁 Workspace Directory Layout

```bash
├── client/                      # Frontend Application (Vite / React)
└── server/                      # Backend Core (Node.js / Express / TypeScript)
    ├── logs/                    # Rotating log files directory (Git ignored)
    └── src/
        ├── config/              # Central Container registries & Env Validation
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

## ⚙️ Environment Variables Setup

Create a `.env` file at the root of the `/server` directory with the following variables:

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

## 🚀 Execution & Command Reference

### Backend Server Commands (`/server`):

1.  **Install Local Dependencies**:
    ```bash
    npm install
    ```
2.  **Run Development Watcher**:
    ```bash
    npm run dev
    ```
3.  **Compile TypeScript Build**:
    ```bash
    npm run build
    ```
4.  **Launch Production Bundle**:
    ```bash
    npm start
    ```

### Frontend Client Commands (`/client`):

1.  **Install Local Dependencies**:
    ```bash
    npm install
    ```
2.  **Launch Client Development Server**:
    ```bash
    npm run dev
    ```
