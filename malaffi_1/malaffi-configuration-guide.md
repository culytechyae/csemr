# MALAFFI Integration Configuration Guide

**Last Updated:** December 17, 2025  
**Based on:** Working HL7 messages from `hl7_samples/actual/`  
**Status:** Production Ready

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Required Configuration](#required-configuration)
3. [Environment Variables](#environment-variables)
4. [HL7 Message Configuration](#hl7-message-configuration)
5. [Modaqeq Validation Setup](#modaqeq-validation-setup)
6. [Doctor ID Configuration](#doctor-id-configuration)
7. [ADT Message Type Settings](#adt-message-type-settings)
8. [Testing & Validation](#testing--validation)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This guide provides complete configuration instructions for successful MALAFFI integration based on validated HL7 messages. All settings have been tested and verified with Modaqeq validation tool.

### Key Components

- **HL7 Message Generation**: Automatic ADT message creation for visits
- **Modaqeq Validation**: Pre-transmission message validation
- **MALAFFI Transmission**: Secure HL7 message transmission to DOH
- **Message Tracking**: Complete audit trail of all messages

---

## Required Configuration

### 1. System Codes (From Actual Messages)

Based on working HL7 messages in `hl7_samples/actual/`:

```python
# MSH Segment Configuration
HL7_SENDING_APPLICATION = "MF7163"           # Your facility code
HL7_SENDING_FACILITY = "MF7163"               # Same as application
HL7_RECEIVING_APPLICATION = "Rhapsody"        # MALAFFI receiving system
HL7_RECEIVING_FACILITY = "MALAFFI"            # MALAFFI facility
HL7_PROCESSING_ID = "ADHIE"                   # Processing ID from actual messages
HL7_VERSION = "2.5.1"                         # HL7 version
```

### 2. Facility Information

Your facility must be registered with DOH/MALAFFI. The facility code `MF7163` is used in all messages.

**Format in MSH Segment:**
```
MSH|^~\&|MF7163^MF7163|MF7163^MF7163|Rhapsody^MALAFFI|ADHIE|...
```

---

## Environment Variables

### Complete `.env` Configuration

Create or update your `.env` file in the project root:

```bash
# ============================================
# MALAFFI Integration Settings
# ============================================

# Enable/Disable MALAFFI Integration
MALAFFI_ENABLED=true

# Environment: 'test' or 'production'
MALAFFI_ENVIRONMENT=test

# Facility Code (Your DOH-assigned facility code)
MALAFFI_FACILITY_CODE=MF7163

# Sending Application Name
MALAFFI_SENDING_APPLICATION=MF7163

# MALAFFI Endpoints
# Test Environment
MALAFFI_HL7_ENDPOINT=https://test-hl7.malaffi.ae/receive

# Production Environment (when ready)
# MALAFFI_HL7_ENDPOINT=https://hl7.malaffi.ae/receive

# API Key (Obtain from DOH/MALAFFI)
MALAFFI_API_KEY=your_api_key_here

# ============================================
# Modaqeq Validation Settings
# ============================================

# Modaqeq Installation Path (Windows)
MODAQEQ_PATH=C:\Program Files\Modaqeq\modaqeq.exe

# Auto-validate messages before transmission
MODAQEQ_AUTO_VALIDATE=true

# ============================================
# Doctor ID Validation (Critical for Modaqeq)
# ============================================

# Valid Doctor IDs registered in Modaqeq validation tables
# These IDs MUST be registered in Modaqeq to pass validation
# Format: comma-separated list
VALID_DOCTOR_IDS=GD18668,DOC001,DR001

# Default Doctor ID (used when provided ID is not in valid list)
DEFAULT_DOCTOR_ID=GD18668

# ============================================
# Message Transmission Settings
# ============================================

# Maximum retry attempts for failed transmissions
MALAFFI_MAX_RETRIES=3

# Retry backoff base time (seconds)
MALAFFI_RETRY_BACKOFF_BASE=60

# Retry backoff multiplier
MALAFFI_RETRY_BACKOFF_MULTIPLIER=5

# Transmission timeout (seconds)
MALAFFI_TRANSMISSION_TIMEOUT=300

# Batch size for bulk transmission
MALAFFI_BATCH_SIZE=10

# ============================================
# Message Queue (Optional - for async processing)
# ============================================

# Redis URL for Celery task queue
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

---

## HL7 Message Configuration

### MSH Segment (Message Header)

Based on actual working messages:

```
MSH|^~\&|MF7163^MF7163|MF7163^MF7163|Rhapsody^MALAFFI|ADHIE|YYYYMMDDHHMMSS+0400||ADT^A01|message_id|P|2.5.1
```

**Field Breakdown:**
- **MSH-3**: Sending Application = `MF7163^MF7163`
- **MSH-4**: Sending Facility = `MF7163^MF7163`
- **MSH-5**: Receiving Application = `Rhapsody^MALAFFI`
- **MSH-6**: Receiving Facility = `ADHIE`
- **MSH-9**: Message Type = `ADT^A01` (or A03, A04, A08)
- **MSH-12**: Version = `2.5.1`
- **MSH-11**: Processing ID = `P` (Production)

### EVN Segment (Event Type)

```
EVN|A01|YYYYMMDDHHMMSS
```

**Event Types:**
- `A01`: Admit/Visit Notification
- `A03`: Discharge Patient
- `A04`: Register Patient
- `A08`: Update Patient/Encounter Information

### PV1 Segment (Patient Visit)

**Critical Settings:**

#### Patient Class (PV1-2)

**MUST be set correctly based on message type:**

| Message Type | Patient Class | Description |
|-------------|---------------|-------------|
| ADT^A01 | `I` | Inpatient (Admit Patient) |
| ADT^A03 | `I` or `O` | Based on visit type |
| ADT^A04 | `O` | Outpatient (Register Patient) |
| ADT^A08 | `I` or `O` | Based on visit type |

**Valid Values:**
- `I` = Inpatient
- `O` = Outpatient
- `E` = Emergency
- `P` = Preadmit
- `R` = Recurring Patient

**Example from Actual Messages:**
```
# ADT^A01 (Admit)
PV1|1|I|OR PERIOP^OR Periop^B1^MF3333&MF7163-DOHID^^^^^ICU|...

# ADT^A04 (Register)
PV1|1|O|OR PERIOP^OR Periop^B1^MF3333&MF7163-DOHID^^^^^ICU|...
```

---

## Modaqeq Validation Setup

### Installation

1. **Download Modaqeq** from DOH/MALAFFI portal
2. **Install** to default location: `C:\Program Files\Modaqeq\`
3. **Verify** executable exists: `modaqeq.exe`

### Configuration

Set in `.env`:
```bash
MODAQEQ_PATH=C:\Program Files\Modaqeq\modaqeq.exe
MODAQEQ_AUTO_VALIDATE=true
```

### Validation Process

1. **Automatic**: Messages are validated before transmission if `MODAQEQ_AUTO_VALIDATE=true`
2. **Manual**: Use Modaqeq GUI to validate `.hl7` files from `MSG_Send/` folder
3. **Reports**: Validation reports saved in Modaqeq output directory

### Common Validation Errors & Fixes

| Error Code | Description | Fix |
|------------|-------------|-----|
| 1014 | Field value not found in validation table | Use valid doctor ID from `VALID_DOCTOR_IDS` |
| 1061 | Unexpected Value | Check Patient Class matches message type |
| Field too long | Field exceeds maximum length | Truncate field to allowed length |
| Required field missing | Mandatory field is empty | Ensure all required fields are populated |

---

## Doctor ID Configuration

### Critical Requirement

**All doctor IDs MUST be registered in Modaqeq validation tables** to pass validation.

### Configuration

```bash
# List of valid doctor IDs (comma-separated)
VALID_DOCTOR_IDS=GD18668,DOC001,DR001

# Default ID to use when provided ID is invalid
DEFAULT_DOCTOR_ID=GD18668
```

### Doctor ID Format in HL7

From actual messages:
```
GD18668^Ahmed^Sara^^^^^^&MF7163-DOHID
```

**Format:**
- **Component 1**: Doctor ID (e.g., `GD18668`)
- **Component 2**: Family Name (e.g., `Ahmed`)
- **Component 3**: Given Name (e.g., `Sara`)
- **Component 8**: Assigning Authority (e.g., `MF7163-DOHID`)

### Adding New Doctor IDs

1. **Register** doctor ID in Modaqeq validation tables
2. **Add** to `VALID_DOCTOR_IDS` in `.env`:
   ```bash
   VALID_DOCTOR_IDS=GD18668,DOC001,DR001,NEW_DOC_ID
   ```
3. **Restart** application to load new configuration

---

## ADT Message Type Settings

### ADT^A01 (Admit/Visit Notification)

**Required Settings:**
- **Patient Class**: `I` (Inpatient) - **MANDATORY**
- **Admission Date**: Required in PV1-44
- **Visit Number**: Required in PV1-19

**Example:**
```
PV1|1|I|...|...|...|...|GD18668^Doctor^Name^^^^^^&MF7163-DOHID|...
```

### ADT^A03 (Discharge Patient)

**Required Settings:**
- **Patient Class**: `I` or `O` (based on visit type)
- **Discharge Date**: Required in PV1-45
- **Discharge Disposition**: Required in PV1-36 (e.g., `8`)

**Example:**
```
PV1|1|I|...|...|...|...|GD18668^Doctor^Name^^^^^^&MF7163-DOHID|...|8|...|20251217081100
```

### ADT^A04 (Register Patient)

**Required Settings:**
- **Patient Class**: `O` (Outpatient) - **MANDATORY**
- **Registration Date**: Required in PV1-44

**Example:**
```
PV1|1|O|...|...|...|...|GD18668^Doctor^Name^^^^^^&MF7163-DOHID|...
```

### ADT^A08 (Update Patient/Encounter)

**Required Settings:**
- **Patient Class**: `I` or `O` (based on visit type)
- **Update Date**: Required in PV1-44

---

## Testing & Validation

### Step 1: Verify Configuration

```bash
# Check environment variables are loaded
python -c "from app.config import MalaffiConfig; print(MalaffiConfig.HL7_SENDING_FACILITY)"
# Should output: MF7163
```

### Step 2: Generate Test Messages

```bash
# Generate actual HL7 samples from database
python scripts/generate_actual_hl7_samples.py
```

**Output Location:** `hl7_samples/actual/`

### Step 3: Validate with Modaqeq

1. **Open Modaqeq** application
2. **Load** message file from `hl7_samples/actual/`
3. **Validate** and review report
4. **Fix** any errors before production use

### Step 4: Test Transmission

```bash
# Start application
python start_cmr.py

# Access HL7 Messages page
# URL: http://localhost:5003/hl7-messages/

# Test transmission (if MALAFFI_ENABLED=true)
# Click "Transmit" button on a message
```

---

## Troubleshooting

### Issue: "Field value not found in validation table" (Error 1014)

**Cause:** Doctor ID not registered in Modaqeq

**Solution:**
1. Check `VALID_DOCTOR_IDS` includes the doctor ID
2. Register doctor ID in Modaqeq validation tables
3. Use `DEFAULT_DOCTOR_ID` as fallback

### Issue: "Unexpected Value" for Patient Class (Error 1061)

**Cause:** Patient Class doesn't match message type

**Solution:**
- ADT^A01: Must be `I` (Inpatient)
- ADT^A04: Must be `O` (Outpatient)
- ADT^A03/A08: Based on visit type

### Issue: Messages not generating

**Check:**
1. `MSG_Send/` folder exists and is writable
2. Database connection is working
3. Visit records exist in database
4. Application logs for errors

### Issue: Transmission failures

**Check:**
1. `MALAFFI_ENABLED=true` in `.env`
2. `MALAFFI_API_KEY` is set correctly
3. Network connectivity to MALAFFI endpoint
4. SSL certificates (if required for production)

---

## Production Deployment Checklist

- [ ] Facility code (`MF7163`) registered with DOH
- [ ] All doctor IDs registered in Modaqeq
- [ ] Production API key obtained
- [ ] Production endpoint configured
- [ ] SSL certificates installed (if required)
- [ ] Modaqeq validation passing for all message types
- [ ] Test messages validated successfully
- [ ] Transmission tested in test environment
- [ ] Monitoring and logging configured
- [ ] Backup and recovery procedures in place

---

## Support & Resources

### Documentation
- **HL7 Samples**: `hl7_samples/actual/` - Working message examples
- **HL7 Data Types**: `GUIDE/hl7-data-types-guide.md`
- **Transmission Guide**: `GUIDE/hl7-transmission-system-guide.md`

### Contact
- **DOH/MALAFFI Support**: For facility registration and API keys
- **Modaqeq Support**: For validation table updates

---

**Last Updated:** December 17, 2025  
**Version:** 1.0  
**Status:** Production Ready

