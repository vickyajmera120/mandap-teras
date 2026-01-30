# Mandap Billing System

A comprehensive web-based billing and customer management system for **Fagun Sud 13 Mandap Contractor** business.

## Features

### 🏠 Dashboard
- Quick overview of customers, events, and bills
- Revenue statistics
- Recent bills at a glance

### 👥 Customer Management
- Add, edit, and search customers
- Store name, mobile, alternate contact, address, and notes
- View customer billing history

### 📅 Event Management
- Create events (Fagun Sud 13 or Normal)
- Track yearly events
- Configure total Pals per event

### 📝 Billing
- Create bills with itemized pricing
- Two-column layout matching Excel format
- Auto-calculate totals
- Print-ready bill format in Gujarati

### 📊 Bill History
- Search bills by customer, year, or event
- View, print, or delete bills
- Filter by year or event type

### 📦 Inventory
- 60+ pre-loaded items from your Excel
- Update prices anytime
- Left/Right side organization

### 👤 User Management (Admin)
- Create users with different roles
- 3 default admin accounts
- Role-based access control

### 🛡️ Role Management (Admin)
- 4 pre-defined roles: ADMIN, MANAGER, BILLING_CLERK, VIEWER
- 12 granular permissions
- Customize permissions per role

## Quick Start

```bash
# Build
mvn clean package

# Run
mvn spring-boot:run
```

Open http://localhost:8080

**Login:** `admin1` / `Admin@123`

## Technology Stack

- **Backend:** Java 17, Spring Boot 3.2
- **Security:** Spring Security, JWT
- **Database:** MySQL 8
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Styling:** Modern dark theme with glassmorphism

## Project Structure

```
src/
├── main/
│   ├── java/com/mandap/
│   │   ├── controller/    # REST APIs
│   │   ├── service/       # Business logic
│   │   ├── repository/    # Database access
│   │   ├── entity/        # JPA entities
│   │   ├── dto/           # Data transfer objects
│   │   ├── security/      # JWT & authentication
│   │   └── config/        # Security config
│   └── resources/
│       ├── static/        # Frontend files
│       │   ├── css/
│       │   ├── js/
│       │   └── index.html
│       ├── application.properties
│       └── data.sql       # Initial data
```

## Documentation

See [SETUP.md](SETUP.md) for deployment instructions.
