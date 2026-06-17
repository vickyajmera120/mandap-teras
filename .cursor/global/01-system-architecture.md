# Mandap Billing System — System Architecture

> **Always in context.** This file is loaded with every AI interaction.

## Overview

The Mandap Billing System is a **full-stack web application** for managing rentals, inventory, billing, and customers for **Fagun Sud 13 Mandap Contractor** — a single annual event business.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (mandap-ui/)                   │
│  Angular 21 · Tailwind CSS 4 · DaisyUI 5 · Standalone      │
│                                                             │
│  ┌────────┐ ┌──────────┐ ┌─────────┐ ┌──────────────────┐  │
│  │ Auth   │ │ Dashboard│ │Inventory│ │  Rental Orders   │  │
│  │ Login  │ │ Metrics  │ │ Stock   │ │  Book/Dispatch   │  │
│  └────┬───┘ └─────┬────┘ └────┬────┘ └────────┬─────────┘  │
│       │           │           │                │            │
│  ┌────┴───┐ ┌─────┴────┐ ┌───┴───┐  ┌────────┴─────────┐  │
│  │Billing │ │Customers │ │ Users │  │  Roles/Perms     │  │
│  │Pay/Print│ │ CRM     │ │ RBAC  │  │  Admin Only      │  │
│  └────────┘ └──────────┘ └───────┘  └──────────────────┘  │
│                          │                                  │
│              HttpClient + JWT Interceptor                   │
│                   proxy → :8080                             │
└─────────────────────┬───────────────────────────────────────┘
                      │ REST API (/api/**)
┌─────────────────────┴───────────────────────────────────────┐
│                     BACKEND (src/)                          │
│  Java 17 · Spring Boot 3.2.3 · Maven                       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │               SecurityFilterChain                     │  │
│  │   JwtAuthenticationFilter → DaoAuthProvider           │  │
│  │   BCrypt · Stateless Sessions · Method Security       │  │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │ Controllers │→ │   Services   │→ │  Repositories   │   │
│  │  8 REST     │  │  6 Business  │  │  11 JPA/Envers  │   │
│  └─────────────┘  └──────────────┘  └────────┬────────┘   │
│                                               │             │
│  ┌────────────┐  ┌────────────────┐  ┌───────┴───────┐    │
│  │   DTOs     │  │  Entities (13) │  │  Flyway       │    │
│  │  19 Records│  │  + Auditing    │  │  Migrations   │    │
│  └────────────┘  └────────────────┘  └───────────────┘    │
└─────────────────────────────────────────────────────────────┘
                      │ JDBC
┌─────────────────────┴───────────────────────────────────────┐
│              DATABASE: MySQL 8                              │
│  Schema: mandap_billing  ·  Timezone: Asia/Kolkata          │
│  Managed by Flyway (V1–V11)                                 │
│  Hibernate Envers for audit trails                          │
└─────────────────────────────────────────────────────────────┘
```

## Key Modules

| Layer | Technology | Location |
|-------|-----------|----------|
| **Frontend** | Angular 21, Tailwind CSS 4, DaisyUI 5 | `mandap-ui/` |
| **Backend** | Java 17, Spring Boot 3.2.3 | `src/main/java/com/mandap/` |
| **Security** | Spring Security, JWT (jjwt 0.12.5) | `com.mandap.security/`, `com.mandap.config/` |
| **Data** | JPA/Hibernate, Hibernate Envers | `com.mandap.entity/`, `com.mandap.repository/` |
| **Migrations** | Flyway 10.8.1 | `src/main/resources/db/migration/` |
| **Database** | MySQL 8 | `mandap_billing` schema |
| **Logging** | Logback (file + console) | `src/main/resources/logback-spring.xml` |
| **Build** | Maven (backend), npm (frontend), `build-release.bat` | Root |

## Development Ports

- **Backend**: `http://localhost:8080`
- **Frontend**: `http://localhost:4200` (proxies `/api` → `:8080`)

## Production Deployment

Single unified JAR: Angular build artifacts are copied into `src/main/resources/static/`, then packaged via `mvn clean package`. Run with `java -jar target/mandap-billing-1.0.0.jar`.

## Core Business Constraint

> **One Order, One Bill per Customer per event cycle.** This is a hard rule enforced in the service layer. Do not create logic that allows multiple active orders or bills for a single customer.
