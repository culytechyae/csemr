# MALAFFI Integration Quick Start Checklist

**Last Updated:** December 17, 2025  
**Based on:** Working HL7 messages from `hl7_samples/actual/`

---

## ✅ Pre-Installation Checklist

### 1. Obtain from DOH/MALAFFI

- [ ] **Facility Code** (e.g., `MF7163`)
- [ ] **API Key** for test environment
- [ ] **API Key** for production (when ready)
- [ ] **Modaqeq Installation** files
- [ ] **Doctor ID Registration** access

---

## ✅ Installation Steps

### Step 1: Install Modaqeq

- [ ] Download Modaqeq from DOH/MALAFFI portal
- [ ] Install to: `C:\Program Files\Modaqeq\`
- [ ] Verify executable: `modaqeq.exe` exists
- [ ] Test Modaqeq opens successfully

### Step 2: Configure Environment

- [ ] Copy `config/config.template` to `.env`
- [ ] Set `MALAFFI_ENABLED=true`
- [ ] Set `MALAFFI_FACILITY_CODE=MF7163` (your code)
- [ ] Set `MALAFFI_API_KEY=your_test_api_key`
- [ ] Set `VALID_DOCTOR_IDS=GD18668,DOC001,DR001`
- [ ] Set `DEFAULT_DOCTOR_ID=GD18668`
- [ ] Set `MODAQEQ_PATH=C:\Program Files\Modaqeq\modaqeq.exe`

### Step 3: Register Doctor IDs

- [ ] Register all doctor IDs in Modaqeq validation tables
- [ ] Add registered IDs to `VALID_DOCTOR_IDS` in `.env`
- [ ] Test doctor ID validation in Modaqeq

---

## ✅ Verification Steps

### Step 1: Generate Test Messages

```bash
python scripts/generate_actual_hl7_samples.py
```

- [ ] Messages generated in `hl7_samples/actual/`
- [ ] All ADT types created (A01, A03, A04, A08)

### Step 2: Validate with Modaqeq

- [ ] Open Modaqeq application
- [ ] Load `hl7_samples/actual/ADT_A01_*.hl7`
- [ ] Run validation
- [ ] **Check:** No errors (or only expected warnings)
- [ ] Repeat for A03, A04, A08 messages

### Step 3: Verify Message Format

**Check MSH Segment:**
```
MSH|^~\&|MF7163^MF7163|MF7163^MF7163|Rhapsody^MALAFFI|ADHIE|...
```

- [ ] Facility code correct (`MF7163`)
- [ ] Receiving application correct (`Rhapsody^MALAFFI`)
- [ ] HL7 version correct (`2.5.1`)

**Check PV1 Segment:**
- [ ] ADT^A01: Patient Class = `I` (Inpatient)
- [ ] ADT^A04: Patient Class = `O` (Outpatient)
- [ ] Doctor IDs are from `VALID_DOCTOR_IDS` list

### Step 4: Test Application

```bash
python start_cmr.py
```

- [ ] Application starts without errors
- [ ] Access: `http://localhost:5003/hl7-messages/`
- [ ] Messages visible in dashboard
- [ ] No validation errors in logs

---

## ✅ Production Deployment Checklist

### Pre-Production

- [ ] All test messages validated successfully
- [ ] Modaqeq validation passing for all message types
- [ ] Production API key obtained
- [ ] Production endpoint configured
- [ ] SSL certificates installed (if required)
- [ ] Network connectivity verified

### Configuration Updates

- [ ] Update `.env`:
  ```bash
  MALAFFI_ENVIRONMENT=production
  MALAFFI_HL7_ENDPOINT=https://hl7.malaffi.ae/receive
  MALAFFI_API_KEY=your_production_api_key
  ```

### Final Verification

- [ ] Test transmission in production environment
- [ ] Verify message delivery
- [ ] Check acknowledgment receipts
- [ ] Monitor logs for errors
- [ ] Set up alerting for failures

---

## 📚 Documentation Reference

| Document | Purpose |
|----------|---------|
| `GUIDE/malaffi-configuration-guide.md` | Complete setup instructions |
| `GUIDE/malaffi-codes-reference.md` | Quick code reference |
| `GUIDE/installation-guide.md` | System installation |
| `GUIDE/startup-guide.md` | Application startup |
| `GUIDE/hl7-transmission-system-guide.md` | Transmission system details |
| `hl7_samples/actual/` | Working message examples |

---

## 🔧 Common Issues & Quick Fixes

### Issue: "Field value not found in validation table" (Error 1014)

**Fix:**
1. Check doctor ID in `VALID_DOCTOR_IDS`
2. Register doctor ID in Modaqeq
3. Restart application

### Issue: "Unexpected Value" for Patient Class (Error 1061)

**Fix:**
- ADT^A01: Change Patient Class to `I`
- ADT^A04: Change Patient Class to `O`

### Issue: Messages not generating

**Fix:**
1. Check `MSG_Send/` folder exists
2. Verify database connection
3. Check application logs

---

## 📞 Support

- **DOH/MALAFFI**: For facility registration and API keys
- **Modaqeq Support**: For validation table updates
- **Documentation**: See `GUIDE/` folder for detailed guides

---

**Status:** ✅ Ready for Production  
**Last Updated:** December 17, 2025

