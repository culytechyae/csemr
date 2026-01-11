# CMR Health Management System - Startup Guide

## Quick Start

### Option 1: Python Script (Recommended)
```bash
python start_cmr.py
```

### Option 2: Windows Batch File
```bash
start_cmr.bat
```

### Option 3: Direct Flask
```bash
python -m flask run --host=0.0.0.0 --port=5000 --debug
```

## Application Access

- **Web Interface**: http://localhost:5000
- **Login Credentials**: 
  - Username: `admin`
  - Password: `password123`

## Features Available

### Health Records
- **List**: http://localhost:5000/health-records/
- **Add**: http://localhost:5000/health-records/add
- **API**: http://localhost:5000/api/health-records/

### Students
- **List**: http://localhost:5000/students/
- **Add**: http://localhost:5000/students/add

### Visits
- **List**: http://localhost:5000/visits/
- **Add**: http://localhost:5000/visits/add

### Reports
- **Dashboard**: http://localhost:5000/reports/
- **Health Trends**: http://localhost:5000/reports/health-trends

### Admin
- **Users**: http://localhost:5000/admin/users
- **Settings**: http://localhost:5000/admin/settings

## HL7 Integration

### API Endpoints
- **Preview HL7**: `GET /api/health-records/<id>/hl7-preview`
- **Send HL7**: `POST /api/health-records/<id>/transmit-hl7`

### Test Messages
- **Location**: `test_msg/` folder
- **Fixed Messages**: All `*_fixed.hl7` files are ready for MODAQEQ validation
- **Latest Message**: `Latest Message HL7/` folder contains the most recent message

## Configuration

### Environment Variables

**Required for MALAFFI Integration:**

```bash
# Enable MALAFFI Integration
MALAFFI_ENABLED=true

# Environment: 'test' or 'production'
MALAFFI_ENVIRONMENT=test

# Facility Code (Your DOH-assigned code)
MALAFFI_FACILITY_CODE=MF7163

# Sending Application
MALAFFI_SENDING_APPLICATION=MF7163

# MALAFFI Endpoints
MALAFFI_HL7_ENDPOINT=https://test-hl7.malaffi.ae/receive

# API Key (Obtain from DOH/MALAFFI)
MALAFFI_API_KEY=your_api_key_here

# Doctor ID Validation (Critical for Modaqeq)
VALID_DOCTOR_IDS=GD18668,DOC001,DR001
DEFAULT_DOCTOR_ID=GD18668

# Modaqeq Validation
MODAQEQ_PATH=C:\Program Files\Modaqeq\modaqeq.exe
MODAQEQ_AUTO_VALIDATE=true
```

**See `GUIDE/malaffi-configuration-guide.md` for complete setup instructions.**

### Database
- **Type**: PostgreSQL
- **Connection**: Configured in `app/config.py`
- **Migrations**: Available in `migrations/` folder

## Troubleshooting

### Common Issues

1. **Port 5000 already in use**
   - Change port in `start_cmr.py`: `app.run(port=5001)`

2. **Database connection error**
   - Check PostgreSQL is running
   - Verify connection settings in `app/config.py`

3. **Module not found errors**
   - Ensure virtual environment is activated
   - Run `pip install -r requirements.txt`

### Logs
- **Application logs**: Check console output
- **Database logs**: Check PostgreSQL logs
- **HL7 logs**: Check `logs/` folder

## Development

### File Structure
```
CMR/
├── app/                    # Main application code
├── test_msg/              # HL7 test messages
├── Latest Message HL7/    # Latest HL7 message
├── temp_scripts/          # Temporary development scripts
├── test_scripts/          # Test scripts
└── start_cmr.py          # Main startup script
```

### Key Files
- `start_cmr.py` - Main startup script
- `app/__init__.py` - Flask application factory
- `app/config.py` - Configuration settings
- `requirements.txt` - Python dependencies

## Support

For issues or questions:
1. Check the logs for error messages
2. Verify all dependencies are installed
3. Ensure database is running and accessible
4. Check network connectivity for Malaffi integration

---
**CMR Health Management System**  
Version: 1.0  
Last Updated: 2025-10-22
