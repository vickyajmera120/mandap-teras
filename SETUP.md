# Mandap Billing System - Deployment & Setup Guide

## Quick Start (For Developer)

### Prerequisites
- Java 17 or higher
- MySQL 8.x running on localhost:3306
- Maven 3.8+

### Build & Run
```bash
cd c:\Users\Vicky-PC\IdeaProjects\Mandap

# Build the project
mvn clean package -DskipTests

# Run the application
mvn spring-boot:run
```

Access the application at: **http://localhost:8080**

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
2. Run the installer and follow the prompts
3. Verify installation:
   ```cmd
   java -version
   ```
   Should show: `openjdk version "17.x.x"`

### Step 2: Install MySQL (One-Time Central Server Setup)
> **Note**: MySQL only needs to be installed on ONE computer (the server). Other laptops will connect to this server.

**On the Server Computer:**
1. Download MySQL 8 from: https://dev.mysql.com/downloads/installer/
2. During installation:
   - Choose "Developer Default" or "Server only"
   - Set root password: `root`
   - Enable "Allow Remote Connections"
3. After installation, open MySQL Workbench or command line:
   ```sql
   CREATE DATABASE mandap_billing;
   ```

### Step 3: Configure Employee Laptops

Each employee laptop needs to point to the central server. Edit the application properties:

1. Locate: `src/main/resources/application.properties`
2. Change the database URL to point to server:
   ```properties
   spring.datasource.url=jdbc:mysql://SERVER_IP:3306/mandap_billing?useSSL=false&serverTimezone=Asia/Kolkata
   ```
   Replace `SERVER_IP` with the actual IP address of the MySQL server.

### Step 4: Create Desktop Shortcut (Windows)

Create a batch file `start-mandap.bat`:
```batch
@echo off
cd /d "c:\Users\Vicky-PC\IdeaProjects\Mandap"
java -jar target\mandap-billing-1.0.0.jar
pause
```

Or run with Maven:
```batch
@echo off
cd /d "c:\Users\Vicky-PC\IdeaProjects\Mandap"
call mvn spring-boot:run
pause
```

---

## Production Deployment

### Build for Production
```bash
mvn clean package -DskipTests
```
This creates: `target/mandap-billing-1.0.0.jar`

### Run as JAR
```bash
java -jar target/mandap-billing-1.0.0.jar
```

### Run as Windows Service (Optional)
For automatic startup, use NSSM (Non-Sucking Service Manager):
1. Download NSSM from: https://nssm.cc/download
2. Install service:
   ```cmd
   nssm install MandapBilling "C:\path\to\java.exe" "-jar C:\path\to\mandap-billing-1.0.0.jar"
   nssm set MandapBilling Start SERVICE_AUTO_START
   ```

---

## Network Configuration (Multi-Computer Setup)

### Server Computer (MySQL + App)
1. Open Windows Firewall
2. Add Inbound Rule for Port 3306 (MySQL) and 8080 (Application)
3. Allow connections from local network

### Client Computers
Update `application.properties` or pass as command line:
```bash
java -jar mandap-billing-1.0.0.jar --spring.datasource.url=jdbc:mysql://192.168.1.100:3306/mandap_billing
```

---

## Troubleshooting

### "Connection refused" to MySQL
- Check MySQL service is running
- Verify firewall allows port 3306
- Confirm MySQL allows remote connections

### "Port 8080 already in use"
- Change port in `application.properties`:
  ```properties
  server.port=8081
  ```

### Login not working
- Clear browser cache and cookies
- Verify database has user data (check `users` table)
- Try incognito/private browsing mode

---

## Backup & Restore

### Backup Database
```bash
mysqldump -u root -p mandap_billing > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
mysql -u root -p mandap_billing < backup_20260130.sql
```

---

## Support
For technical support, contact the system administrator.
