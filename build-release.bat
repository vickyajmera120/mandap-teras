@echo off
echo ========================================
echo   Mandap Billing - Production Builder
echo ========================================

echo 1/3 Building Frontend (Angular)...
cd mandap-ui
call npm run build
if %errorlevel% neq 0 (
    echo Error building frontend!
    pause
    exit /b %errorlevel%
)

echo 2/3 Bundling UI into Backend...
cd ..
if not exist "src\main\resources\static" mkdir "src\main\resources\static"
powershell -Command "Remove-Item -Path src\main\resources\static\* -Recurse -Force -ErrorAction SilentlyContinue"
powershell -Command "Copy-Item -Path mandap-ui\dist\mandap-ui\browser\* -Destination src\main\resources\static -Recurse -Force"

echo 3/3 Packaging Backend (JAR)...
call mvn clean package -DskipTests
if %errorlevel% neq 0 (
    echo Error building backend JAR!
    pause
    exit /b %errorlevel%
)

echo ========================================
echo SUCCESS! 
echo Your new version is in: target\mandap-billing-1.0.0.jar
echo ========================================
pause
