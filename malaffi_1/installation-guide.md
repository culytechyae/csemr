# CMR Installation and Deployment Guide (Clean, Step-by-Step)

This guide explains exactly how to install and run the CMR Health Management System on a new machine, with a clear folder layout and unambiguous commands.

## 1) Prerequisites

- Windows 10/11 or Linux (Ubuntu 20.04+)
- Python 3.11 (recommended)
- PostgreSQL 14+ (running locally or reachable over network)
- Git (optional if you copy files manually)

Verify versions:
```powershell
python --version
psql --version
```

## 2) Folder Layout (do this exactly)

Place the project in a single directory. Example:
```
C:\CMR\
├── app\                 # Application source code
├── docs\                # Documentation and summaries
├── GUIDE\               # How-to guides (this file lives here)
├── database_migrations\ # SQL migration files
├── logs\                # Log output (created at runtime if missing)
├── MSG_Send\            # Generated HL7 messages
├── uploads\             # User-uploaded files
├── venv\                # Python virtual environment (created later)
├── requirements.txt
├── start_cmr.py         # Start the web app
├── start_transmission_monitor.py  # Start HL7 monitor
└── README.md
```
If any of these folders don’t exist, create them now (especially `logs`, `MSG_Send`, `uploads`).

## 3) Create a Python Virtual Environment

From the project root (`C:\CMR`):
```powershell
python -m venv venv
./venv/Scripts/Activate.ps1
```
If PowerShell blocks script execution, run as Administrator:
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Then activate again.

## 4) Install Python Dependencies

With the virtual environment active:
```powershell
pip install --upgrade pip
pip install -r requirements.txt
```
If on Windows and that fails due to build tools, try:
```powershell
pip install -r requirements_windows.txt
```

## 5) Configure PostgreSQL

Create a PostgreSQL database and user.
```sql
-- In psql or your DB client
CREATE DATABASE cmr_db;
CREATE USER cmr_user WITH ENCRYPTED PASSWORD 'cmr_password';
GRANT ALL PRIVILEGES ON DATABASE cmr_db TO cmr_user;
```

## 6) Configure Environment

### Option A: Using .env File (Recommended)

Copy the template and configure:
```powershell
copy config\config.template .env
```

Edit `.env` with your settings. **Critical MALAFFI settings:**

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cmr_db
DB_USER=cmr_user
DB_PASSWORD=cmr_password

# MALAFFI Integration (Required for HL7 messages)
MALAFFI_ENABLED=true
MALAFFI_ENVIRONMENT=test
MALAFFI_FACILITY_CODE=MF7163
MALAFFI_SENDING_APPLICATION=MF7163
MALAFFI_HL7_ENDPOINT=https://test-hl7.malaffi.ae/receive
MALAFFI_API_KEY=your_api_key_here

# Doctor ID Validation (Critical for Modaqeq)
VALID_DOCTOR_IDS=GD18668,DOC001,DR001
DEFAULT_DOCTOR_ID=GD18668

# Modaqeq Validation
MODAQEQ_PATH=C:\Program Files\Modaqeq\modaqeq.exe
MODAQEQ_AUTO_VALIDATE=true
```

**See `GUIDE/malaffi-configuration-guide.md` for complete MALAFFI setup.**

### Option B: Environment Variables (PowerShell)

```powershell
$env:FLASK_ENV = "production"
$env:DATABASE_URL = "postgresql+psycopg2://cmr_user:cmr_password@localhost:5432/cmr_db"
$env:MALAFFI_ENABLED = "true"
$env:MALAFFI_ENVIRONMENT = "test"
$env:MALAFFI_FACILITY_CODE = "MF7163"
$env:VALID_DOCTOR_IDS = "GD18668,DOC001,DR001"
$env:DEFAULT_DOCTOR_ID = "GD18668"
```

## 7) Apply Database Schema (choose ONE path)

- A) Using included SQL migrations (recommended for clean installs):
  1. Open `database_migrations/` and run each `.sql` file against `cmr_db` in order shown by filename.
  2. Example (psql):
     ```powershell
     psql "postgres://cmr_user:cmr_password@localhost:5432/cmr_db" -f database_migrations/database_migration_user_management.sql
     psql "postgres://cmr_user:cmr_password@localhost:5432/cmr_db" -f database_migrations/database_migration_user_roles.sql
     psql "postgres://cmr_user:cmr_password@localhost:5432/cmr_db" -f database_migrations/database_migration_health_records_hl7.sql
     psql "postgres://cmr_user:cmr_password@localhost:5432/cmr_db" -f database_migrations/database_migration_visit_form.sql
     psql "postgres://cmr_user:cmr_password@localhost:5432/cmr_db" -f database_migrations/database_migration_doctor_integration.sql
     psql "postgres://cmr_user:cmr_password@localhost:5432/cmr_db" -f database_migrations/database_migration_consulting_doctor.sql
     ```

- B) Using the project’s Python migration helper (if provided in your build):
  ```powershell
  python run_migration.py
  ```

If seed data is needed, run:
```powershell
python seed.py
```

## 8) Verify Required Folders Exist

Ensure these exist in `C:\CMR` (create if missing):
- `logs` (for runtime logs)
- `MSG_Send` (for generated HL7 files)
- `uploads` (for user uploads)

## 9) Start the Application (Web UI)

From `C:\CMR` with venv active:
```powershell
python start_cmr.py
```
- Local access (default): `http://localhost:5000/`
- Login (default in docs): `admin` / `password123`

Note: In production you may configure the app to run on port 5005 behind a reverse proxy. The development default shown in our docs is port 5000.

## 10) Start HL7 Transmission Monitor (optional but recommended)

In a second terminal (with venv active):
```powershell
python start_transmission_monitor.py
```
Then visit the dashboard:
- Transmission monitor UI: `http://localhost:5000/transmission/monitor`

## 11) Files and Folders You Will Use

- `GUIDE/` — how-to guides (this installation document lives here)
- `docs/` — fixes, summaries, reports, implementation notes
- `documents/` and `documentation/` — additional curated documentation
- `MSG_Send/` — generated HL7 messages (.hl7) stored here automatically
- `logs/` — runtime logs (e.g., `hl7_transmission.log`)
- `uploads/` — user-uploaded files

Keep your app files inside `C:\CMR` and do not scatter scripts in other folders.

## 12) Health Checks

- App up: open `http://localhost:5000/` and ensure login screen loads
- Transmission status (if monitor started): `GET /api/transmission/status`
- Logs:
  - `logs/hl7_transmission_monitor.log`
  - `logs/hl7_transmission.log`

## 13) Production Notes (Windows or Linux server)

- Run the app as a service (NSSM on Windows; systemd on Linux)
- Configure reverse proxy (Nginx/Apache) to forward to the app port
- Use environment variables for secrets; never hardcode credentials
- Back up PostgreSQL regularly and rotate logs

Minimal Nginx reverse proxy example (Linux):
```
server {
    listen 80;
    server_name your.server.name;

    location / {
        proxy_pass http://127.0.0.1:5005;  # set app to run on 5005 in production
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 14) Common Issues and Fixes

- Cannot install dependencies on Windows:
  - Use `requirements_windows.txt`
  - Install Build Tools for Visual Studio if wheels are missing
- Database connection errors:
  - Check `$env:DATABASE_URL`
  - Confirm PostgreSQL service is running and credentials are correct
- Port already in use:
  - Edit `start_cmr.py` to use an open port, e.g., `app.run(port=5001)`
- HL7 messages not appearing:
  - Confirm `MSG_Send/` exists and has write permission
  - Start the transmission monitor
  - Check the logs under `logs/`

## 15) Quick Uninstall / Cleanup

- Stop app processes (web app and transmission monitor)
- Remove virtual environment: delete `venv/`
- Optional: drop the PostgreSQL database `cmr_db`

---

You now have a clean, repeatable setup process. Follow the order above and keep everything contained inside `C:\CMR` to avoid confusion with files and folders.
