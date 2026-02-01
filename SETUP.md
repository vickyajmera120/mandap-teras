# Mandap Billing System - Deployment & Setup Guide

## Quick Start (For Developer)

### Prerequisites
- Java 17 or higher
- MySQL 8.x running on localhost:3306
- Maven 3.8+
- Node.js (v18+) and npm

### 1. Database Setup
Create the database:
```sql
CREATE DATABASE mandap_billing;
```
*(Tables will be auto-created by Hibernate on first run)*

### 2. Backend Setup
```bash
# From root directory
mvn clean package -DskipTests
mvn spring-boot:run
```
Backend runs on: **http://localhost:8080**

### 3. Frontend Setup
```bash
# From mandap-ui directory
cd mandap-ui
npm install
npm start
```
Frontend runs on: **http://localhost:4200**

*> Note: The frontend is configured to proxy API requests to localhost:8080.*

---

### Default Login Credentials
| Username | Password | Role |
|----------|----------|------|
| admin1 | Admin@123 | ADMIN |
| admin2 | Admin@123 | ADMIN |
| admin3 | Admin@123 | ADMIN |

---

## Employee Laptop Setup

### Step 1: Install Java 17
1. Download Java 17 from: https://adoptium.net/temurin/releases/
2. Run the installer and verify: `java -version`

### Step 2: Install MySQL (Server Only)
> **Note**: Only the central server needs MySQL installed.
1. Download MySQL 8.
2. Create database `mandap_billing`.
3. Enable "Allow Remote Connections" in MySQL user settings.

### Step 3: Configure Client Laptops
Edit `src/main/resources/application.properties` (or pass as args) to point to the server IP:
```properties
spring.datasource.url=jdbc:mysql://SERVER_IP:3306/mandap_billing?useSSL=false&serverTimezone=Asia/Kolkata
```

---

## Production Deployment

### Build Backend (JAR)
```bash
mvn clean package -DskipTests
# Output: target/mandap-billing-1.0.0.jar
```

### Build Frontend (Static Files)
```bash
cd mandap-ui
npm run build
# Output: dist/mandap-ui/browser/ (or similar)
```

*> For a unified deployment, copy the contents of `dist/mandap-ui/browser/` to `src/main/resources/static/` in the backend before packaging the JAR.*

### Run Logic
```bash
java -jar target/mandap-billing-1.0.0.jar
```

---

## Troubleshooting

### "Connection refused" (MySQL)
- Check MySQL service status.
- Ensure Port 3306 is open in Firewall.
- Verify `application.properties` credentials.

### "CORS Error" (Frontend)
- Ensure the Backend is running.
- Ensure you are accessing via `localhost:4200` (dev) or the correct production URL.
- Check `proxy.conf.json` in `mandap-ui/` for dev proxy settings.

### Login Issues
- If database was reset, default users are re-created on startup (check `data.sql` or `DatabaseInitializer`).
