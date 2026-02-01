# Mandap Billing System

A comprehensive web-based billing and customer management system for **Fagun Sud 13 Mandap Contractor** business.

## Features

### 🏠 Dashboard
- Quick overview of active rental orders, pending bills, and revenue.
- Stock alerts (low inventory).
- Revenue statistics visualization.

### 📦 Inventory Management
- **Real-time Stock**: Track Total, Available, Booked, and Dispatched quantities.
- **Usage Tracking**: See exactly which customers have specific items.
- **Bilingual**: English and Gujarati item names.
- **Categories**: Organized checklist view (Left/Right items).

### 🚚 Rental Orders
- **Booking System**: Create orders for customers.
- **Dispatch/Return**: Manage item movements (Dispatching items, Receiving returns).
- **Status Tracking**: Monitor order status (`BOOKED`, `DISPATCHED`, `RETURNED`).
- **Pal Numbers**: Track physical crate/bag numbers digitally.

### 📝 Billing & Payments
- **Auto-Generate**: Create bills directly from Rental Orders.
- **Deposit Handling**: Record optional initial deposits with Payment Method and Cheque No.
- **Payment History**: Track multiple partial payments.
- **Print Layout**: Professional Gujarati bill format with detailed payment summary.
- **Dynamic Totals**: Auto-calculation of Net Payable based on total bill value minus all payments used.

### 👥 Customer Management
- Add, edit, and search customers.
- View complete history (Current Order, Past Bills).
- Duplicate customer detection.

### 👤 User & Role Management
- **RBAC**: Role-Based Access Control (Admin, Manager, Viewer).
- **Secure**: JWT-based authentication.

### 🎨 Modern UI
- **Glassmorphism Design**: Sleek, modern interface.
- **Dark/Light Mode**: User-selectable themes.
- **Responsive**: Works on desktop and tablets.

## Quick Start

```bash
# Backend
cd root
mvn clean package
mvn spring-boot:run
```

```bash
# Frontend
cd mandap-ui
npm install
npm start
```

Open http://localhost:4200 (Frontend) or http://localhost:8080 (Backend API).

**Default Login:** `admin1` / `Admin@123`

## Technology Stack

- **Backend:** Java 17, Spring Boot 3.2
- **Security:** Spring Security, JWT
- **Database:** MySQL 8
- **Frontend:** Angular 21, Tailwind CSS 4, DaisyUI
- **Data:** JPA / Hibernate

## Documentation

- [SETUP.md](SETUP.md): Detailed installation and deployment guide.
- [.project-context.md](.project-context.md): Architecture and context reference.
