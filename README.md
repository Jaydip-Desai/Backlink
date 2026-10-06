# LinkBridge — Backlink & Link Exchange Management Platform

A production-grade backlink & link exchange management system for SEO teams. Track partner domains, link requests, exchanges, backlinks, verification history, follow-ups, reporting, and team performance — with role-based access control, activity auditing, and CSV/Excel import/export.

---

## 🏛 Architecture

- **Frontend:** React 18 + Vite 5 (`client/`), React Router, Recharts, Lucide icons, native light/dark theme. Proxies `/api` to Spring Boot backend.
- **Backend:** Java 21 + Spring Boot 3.2.4 (`spring-backend/`), Spring Data JPA / Hibernate, Spring Security (JWT + CSRF double-submit cookie), Jackson, Apache POI / iText.
- **Database:** PostgreSQL 16 (`linkbridge_db` on `localhost:5432`).
- **Tests:** End-to-end automated test suites (`tests/`).

---

## 🚀 Quick Start

### 1. Database Setup

Ensure PostgreSQL is running locally on port `5432`:

```sql
CREATE DATABASE linkbridge_db;
```

Database connection settings in `spring-backend/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/linkbridge_db
spring.datasource.username=postgres
spring.datasource.password=postgres
```

### 2. Start Spring Boot Backend

```bash
cd spring-backend
mvn spring-boot:run
```
The REST API backend runs at **`http://localhost:8080`**.

### 3. Start React / Vite Frontend

From the project root:

```bash
npm install
npm run dev
```
The frontend dev server runs at **`http://localhost:5173`** with automatic proxying of `/api` requests to Spring Boot (`:8080`).

---

## 👤 Test Accounts

| Email | Password | Role | Permissions |
|---|---|---|---|
| `admin@backlinkops.io` | `Admin@123` | `admin` | Full system access, user management, system settings |
| `sara@backlinkops.io` | `Sara@123` | `manager` | Full operational access, approvals, reports, team view |
| `manav@backlinkops.io` | `Manav@123` | `executive` | Operational link & domain management, follow-ups |
| `olivia@backlinkops.io` | `Olivia@123` | `viewer` | Read-only analytics, dashboards, and reporting |

---

## 🧪 Verification & Test Suites

The project includes 3 test suites:

```bash
# 1. REST API Contract & Functional Suite (28 tests)
npm run test:api

# 2. Vite Proxy E2E Integration Suite (24 tests)
npm run test:e2e

# 3. Security, RBAC & Protection Matrix (18 tests)
npm run test:security

# 4. Production Client Build
npm run build

# 5. Spring Boot Maven Build
cd spring-backend && mvn clean compile
```

---

## 🔒 Security Hardening

- **JWT Authentication:** Secure `bop_token` cookie (7-day validity) with HTTP-only and SameSite protection.
- **Double-Submit CSRF:** Server issues `bop_csrf` cookie; all state-changing requests (`POST`, `PUT`, `DELETE`) require matching `X-CSRF-Token` header.
- **Strict RBAC:** Spring Security method security and URL filter chains restrict endpoints by role (`ADMIN`, `MANAGER`, `EXECUTIVE`, `VIEWER`).
- **Data Protection:** Parameterized queries via Spring Data JPA prevent SQL injection. Strict CORS and security response headers (X-Content-Type-Options, X-Frame-Options, CSP).

---

## 📂 Project Structure

```
├── client/                     # React 18 + Vite frontend
│   ├── src/
│   │   ├── lib/api.js          # Unified HTTP client (JWT + CSRF)
│   │   ├── lib/AuthContext.jsx # Authentication state
│   │   ├── lib/UI.jsx          # UI component library
│   │   ├── lib/Layout.jsx      # Navigation, sidebar, theme switcher
│   │   └── pages.jsx           # All functional views
│   ├── vite.config.js          # Vite configuration & /api proxy to :8080
│   └── package.json
├── spring-backend/             # Java 21 + Spring Boot 3 backend
│   ├── src/main/java/com/linkbridge/
│   │   ├── controller/         # REST Controllers
│   │   ├── model/              # JPA Entities
│   │   ├── repository/         # Spring Data JPA Repositories
│   │   ├── service/            # Business logic
│   │   ├── security/           # Spring Security & JWT Filters
│   │   └── dto/                # Request & Response DTOs
│   ├── src/main/resources/     # application.properties & schema
│   └── pom.xml
├── tests/                      # Automated test suites
│   ├── test_api_compatibility.mjs  # API compatibility suite
│   ├── e2e_vite_proxy.mjs          # End-to-end proxy suite
│   └── test_security_matrix.mjs    # Security & RBAC matrix
├── package.json                # Project root scripts
└── README.md
```

---

## 💾 Database Backup & Restore

PostgreSQL backup and restore:

```bash
# Backup
pg_dump -U postgres -d linkbridge_db > backup.sql

# Restore
psql -U postgres -d linkbridge_db < backup.sql
```"# Backlink" 
