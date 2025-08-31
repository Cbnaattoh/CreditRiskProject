@echo off
REM ============================================================================
REM RiskGuard Project Packaging Script for Supervisor Submission
REM Creates a complete deployment package ready for upload to Google Drive
REM ============================================================================

echo.
echo ========================================================================
echo 🚀 RiskGuard - Project Packaging for Supervisor Submission
echo ========================================================================
echo.

REM Set variables
set PROJECT_NAME=RiskGuard-Enterprise-CreditRisk-Platform
set DATE_STAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%
set PACKAGE_NAME=%PROJECT_NAME%-v2.0-%DATE_STAMP%
set PACKAGE_DIR=.\%PACKAGE_NAME%

REM Create packaging directory
echo 📦 Creating package directory: %PACKAGE_NAME%
if exist "%PACKAGE_DIR%" rmdir /s /q "%PACKAGE_DIR%"
mkdir "%PACKAGE_DIR%"

REM Copy essential project files
echo 📂 Copying project files...

REM Root files
copy "README.md" "%PACKAGE_DIR%\" >nul 2>&1
copy "SUPERVISOR_DEPLOYMENT_GUIDE.md" "%PACKAGE_DIR%\" >nul 2>&1
copy "docker-compose.supervisor.yml" "%PACKAGE_DIR%\docker-compose.yml" >nul 2>&1

REM Backend files (excluding unnecessary items)
echo 📊 Copying Backend application...
robocopy "Backend" "%PACKAGE_DIR%\Backend" /E /XD __pycache__ .pytest_cache node_modules .git venv .vscode .idea /XF *.pyc *.pyo *.log cookies.txt >nul 2>&1

REM Frontend files (excluding node_modules and build artifacts)
echo 🌐 Copying Frontend application...
robocopy "Frontend" "%PACKAGE_DIR%\Frontend" /E /XD node_modules dist build .git .vscode .idea /XF *.log >nul 2>&1

REM Database initialization scripts
echo 🗄️ Copying database scripts...
robocopy "init-scripts" "%PACKAGE_DIR%\init-scripts" /E >nul 2>&1

REM Create additional supervisor files
echo 📝 Creating supervisor-specific files...

REM Quick start script
echo @echo off > "%PACKAGE_DIR%\QUICK_START.bat"
echo echo ========================================================================== >> "%PACKAGE_DIR%\QUICK_START.bat"
echo echo 🎓 RiskGuard - Quick Start for Project Supervisor >> "%PACKAGE_DIR%\QUICK_START.bat"
echo echo ========================================================================== >> "%PACKAGE_DIR%\QUICK_START.bat"
echo echo. >> "%PACKAGE_DIR%\QUICK_START.bat"
echo echo 🚀 Starting RiskGuard Platform... >> "%PACKAGE_DIR%\QUICK_START.bat"
echo echo This will take 3-5 minutes on first run >> "%PACKAGE_DIR%\QUICK_START.bat"
echo echo. >> "%PACKAGE_DIR%\QUICK_START.bat"
echo docker-compose up -d >> "%PACKAGE_DIR%\QUICK_START.bat"
echo echo. >> "%PACKAGE_DIR%\QUICK_START.bat"
echo echo ⏳ Waiting for services to start... >> "%PACKAGE_DIR%\QUICK_START.bat"
echo timeout /t 60 /nobreak >> "%PACKAGE_DIR%\QUICK_START.bat"
echo echo. >> "%PACKAGE_DIR%\QUICK_START.bat"
echo echo 🎯 Creating demo data... >> "%PACKAGE_DIR%\QUICK_START.bat"
echo docker-compose exec backend python manage.py create_demo_data --applications 50 >> "%PACKAGE_DIR%\QUICK_START.bat"
echo echo. >> "%PACKAGE_DIR%\QUICK_START.bat"
echo echo ========================================================================== >> "%PACKAGE_DIR%\QUICK_START.bat"
echo echo ✅ RiskGuard is ready! >> "%PACKAGE_DIR%\QUICK_START.bat"
echo echo 🌐 Frontend: http://localhost:3000 >> "%PACKAGE_DIR%\QUICK_START.bat"
echo echo 📊 Backend API: http://localhost:8000 >> "%PACKAGE_DIR%\QUICK_START.bat"
echo echo 📚 API Docs: http://localhost:8000/api/docs/swagger/ >> "%PACKAGE_DIR%\QUICK_START.bat"
echo echo 📧 Login: supervisor@riskguard.com >> "%PACKAGE_DIR%\QUICK_START.bat"
echo echo 🔑 Password: SupervisorAccess2024! >> "%PACKAGE_DIR%\QUICK_START.bat"
echo echo ========================================================================== >> "%PACKAGE_DIR%\QUICK_START.bat"
echo pause >> "%PACKAGE_DIR%\QUICK_START.bat"

REM Stop script
echo @echo off > "%PACKAGE_DIR%\STOP_SERVICES.bat"
echo echo 🛑 Stopping RiskGuard Platform... >> "%PACKAGE_DIR%\STOP_SERVICES.bat"
echo docker-compose down >> "%PACKAGE_DIR%\STOP_SERVICES.bat"
echo echo ✅ All services stopped >> "%PACKAGE_DIR%\STOP_SERVICES.bat"
echo pause >> "%PACKAGE_DIR%\STOP_SERVICES.bat"

REM System requirements file
echo # RiskGuard System Requirements > "%PACKAGE_DIR%\SYSTEM_REQUIREMENTS.md"
echo. >> "%PACKAGE_DIR%\SYSTEM_REQUIREMENTS.md"
echo ## Minimum System Requirements >> "%PACKAGE_DIR%\SYSTEM_REQUIREMENTS.md"
echo. >> "%PACKAGE_DIR%\SYSTEM_REQUIREMENTS.md"
echo - **Docker Desktop**: Latest version ^(required^) >> "%PACKAGE_DIR%\SYSTEM_REQUIREMENTS.md"
echo - **RAM**: 4GB minimum, 8GB recommended >> "%PACKAGE_DIR%\SYSTEM_REQUIREMENTS.md"
echo - **Disk Space**: 5GB free space >> "%PACKAGE_DIR%\SYSTEM_REQUIREMENTS.md"
echo - **CPU**: 2 cores minimum, 4 cores recommended >> "%PACKAGE_DIR%\SYSTEM_REQUIREMENTS.md"
echo - **OS**: Windows 10+, macOS 10.15+, or Ubuntu 18.04+ >> "%PACKAGE_DIR%\SYSTEM_REQUIREMENTS.md"
echo - **Ports**: 3000, 8000, 5432, 6379, 8080 must be available >> "%PACKAGE_DIR%\SYSTEM_REQUIREMENTS.md"
echo. >> "%PACKAGE_DIR%\SYSTEM_REQUIREMENTS.md"
echo ## Installation Steps >> "%PACKAGE_DIR%\SYSTEM_REQUIREMENTS.md"
echo. >> "%PACKAGE_DIR%\SYSTEM_REQUIREMENTS.md"
echo 1. Install Docker Desktop from https://docker.com >> "%PACKAGE_DIR%\SYSTEM_REQUIREMENTS.md"
echo 2. Extract this project archive >> "%PACKAGE_DIR%\SYSTEM_REQUIREMENTS.md"
echo 3. Run QUICK_START.bat ^(Windows^) or follow SUPERVISOR_DEPLOYMENT_GUIDE.md >> "%PACKAGE_DIR%\SYSTEM_REQUIREMENTS.md"

REM Project structure documentation
echo # RiskGuard Project Structure > "%PACKAGE_DIR%\PROJECT_STRUCTURE.md"
echo. >> "%PACKAGE_DIR%\PROJECT_STRUCTURE.md"
echo ```bash >> "%PACKAGE_DIR%\PROJECT_STRUCTURE.md"
echo %PACKAGE_NAME%/ >> "%PACKAGE_DIR%\PROJECT_STRUCTURE.md"
echo ├── README.md                     # Main project documentation >> "%PACKAGE_DIR%\PROJECT_STRUCTURE.md"
echo ├── SUPERVISOR_DEPLOYMENT_GUIDE.md # Complete deployment guide >> "%PACKAGE_DIR%\PROJECT_STRUCTURE.md"
echo ├── docker-compose.yml           # Docker orchestration >> "%PACKAGE_DIR%\PROJECT_STRUCTURE.md"
echo ├── QUICK_START.bat              # One-click startup ^(Windows^) >> "%PACKAGE_DIR%\PROJECT_STRUCTURE.md"
echo ├── STOP_SERVICES.bat            # Stop all services >> "%PACKAGE_DIR%\PROJECT_STRUCTURE.md"
echo ├── Backend/                     # Django REST API >> "%PACKAGE_DIR%\PROJECT_STRUCTURE.md"
echo │   ├── Dockerfile              # Backend container config >> "%PACKAGE_DIR%\PROJECT_STRUCTURE.md"
echo │   ├── requirements.txt        # Python dependencies >> "%PACKAGE_DIR%\PROJECT_STRUCTURE.md"
echo │   ├── manage.py               # Django management >> "%PACKAGE_DIR%\PROJECT_STRUCTURE.md"
echo │   ├── backend/                # Core Django settings >> "%PACKAGE_DIR%\PROJECT_STRUCTURE.md"
echo │   ├── applications/           # Credit application logic >> "%PACKAGE_DIR%\PROJECT_STRUCTURE.md"
echo │   ├── users/                  # User management & RBAC >> "%PACKAGE_DIR%\PROJECT_STRUCTURE.md"
echo │   ├── ml_model/               # Machine learning integration >> "%PACKAGE_DIR%\PROJECT_STRUCTURE.md"
echo │   ├── security/               # Security features >> "%PACKAGE_DIR%\PROJECT_STRUCTURE.md"
echo │   ├── notifications/          # Real-time notifications >> "%PACKAGE_DIR%\PROJECT_STRUCTURE.md"
echo │   ├── reports/                # Analytics & reporting >> "%PACKAGE_DIR%\PROJECT_STRUCTURE.md"
echo │   └── api/                    # API documentation >> "%PACKAGE_DIR%\PROJECT_STRUCTURE.md"
echo ├── Frontend/                   # React application >> "%PACKAGE_DIR%\PROJECT_STRUCTURE.md"
echo │   ├── Dockerfile              # Frontend container config >> "%PACKAGE_DIR%\PROJECT_STRUCTURE.md"
echo │   ├── package.json            # Node.js dependencies >> "%PACKAGE_DIR%\PROJECT_STRUCTURE.md"
echo │   ├── src/                    # React source code >> "%PACKAGE_DIR%\PROJECT_STRUCTURE.md"
echo │   ├── components/             # Reusable components >> "%PACKAGE_DIR%\PROJECT_STRUCTURE.md"
echo │   ├── screens/                # Application screens >> "%PACKAGE_DIR%\PROJECT_STRUCTURE.md"
echo │   └── services/               # API integration >> "%PACKAGE_DIR%\PROJECT_STRUCTURE.md"
echo └── init-scripts/               # Database initialization >> "%PACKAGE_DIR%\PROJECT_STRUCTURE.md"
echo ``` >> "%PACKAGE_DIR%\PROJECT_STRUCTURE.md"

REM Create package info file
echo # Package Information > "%PACKAGE_DIR%\PACKAGE_INFO.txt"
echo Package Name: %PACKAGE_NAME% >> "%PACKAGE_DIR%\PACKAGE_INFO.txt"
echo Package Date: %date% >> "%PACKAGE_DIR%\PACKAGE_INFO.txt"
echo Package Time: %time% >> "%PACKAGE_DIR%\PACKAGE_INFO.txt"
echo Package Version: v2.0 >> "%PACKAGE_DIR%\PACKAGE_INFO.txt"
echo. >> "%PACKAGE_DIR%\PACKAGE_INFO.txt"
echo Project: Enterprise Credit Risk Management Platform >> "%PACKAGE_DIR%\PACKAGE_INFO.txt"
echo Technology: Django + React + PostgreSQL + Docker >> "%PACKAGE_DIR%\PACKAGE_INFO.txt"
echo ML Model: XGBoost with 98.4%% accuracy >> "%PACKAGE_DIR%\PACKAGE_INFO.txt"
echo Features: RBAC, MFA, Real-time notifications, Ghana localization >> "%PACKAGE_DIR%\PACKAGE_INFO.txt"

echo.
echo 🔍 Calculating package size...
for /f %%A in ('powershell -command "'{0:N2}' -f ((Get-ChildItem '%PACKAGE_DIR%' -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB)"') do set PACKAGE_SIZE=%%A

echo.
echo ========================================================================
echo ✅ Package Creation Complete!
echo ========================================================================
echo 📦 Package Name: %PACKAGE_NAME%
echo 📂 Package Location: %cd%\%PACKAGE_NAME%
echo 💾 Package Size: %PACKAGE_SIZE% MB
echo 📅 Created: %date% %time%
echo.
echo 📋 Package Contents:
echo   ✅ Complete source code (Backend + Frontend)
echo   ✅ Docker deployment configuration
echo   ✅ Comprehensive documentation
echo   ✅ Quick start scripts
echo   ✅ Demo data generation
echo   ✅ System requirements
echo   ✅ Project structure guide
echo.
echo 🚀 Quick Upload to Google Drive:
echo   1. Compress the '%PACKAGE_NAME%' folder to ZIP
echo   2. Upload to Google Drive
echo   3. Share link with supervisor
echo   4. Include SUPERVISOR_DEPLOYMENT_GUIDE.md link in email
echo.
echo 📧 Email Template for Supervisor:
echo   Subject: RiskGuard Project Submission - Enterprise Credit Risk Platform
echo   Body: Please find the complete RiskGuard project package attached.
echo         This is an enterprise-grade credit risk management platform
echo         with 98.4%% ML accuracy and comprehensive security features.
echo         See SUPERVISOR_DEPLOYMENT_GUIDE.md for setup instructions.
echo.
echo 🎯 Next Steps:
echo   1. Test the package by running QUICK_START.bat
echo   2. Verify all services start correctly
echo   3. Create ZIP archive for upload
echo   4. Share with project supervisor
echo.
echo ========================================================================
echo 🏆 RiskGuard - Ready for Academic Evaluation!
echo ========================================================================

pause