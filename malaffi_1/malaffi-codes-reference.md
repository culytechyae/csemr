# MALAFFI Codes Quick Reference

**Last Updated:** December 17, 2025  
**Based on:** Working HL7 messages from `hl7_samples/actual/`

---

## System Codes

### Facility & Application Codes

| Setting | Value | Description |
|---------|-------|-------------|
| **Facility Code** | `MF7163` | Your DOH-assigned facility code |
| **Sending Application** | `MF7163` | Same as facility code |
| **Sending Facility** | `MF7163` | Same as facility code |
| **Receiving Application** | `Rhapsody` | MALAFFI receiving system |
| **Receiving Facility** | `MALAFFI` | MALAFFI facility identifier |
| **Processing ID** | `ADHIE` | Processing identifier |
| **HL7 Version** | `2.5.1` | HL7 standard version |

### MSH Segment Format

```
MSH|^~\&|MF7163^MF7163|MF7163^MF7163|Rhapsody^MALAFFI|ADHIE|YYYYMMDDHHMMSS+0400||ADT^A01|message_id|P|2.5.1
```

---

## Patient Class Codes (PV1-2)

**Critical:** Must match message type!

| Code | Description | Used In |
|------|-------------|---------|
| `I` | Inpatient | **ADT^A01** (Admit) - **MANDATORY** |
| `O` | Outpatient | **ADT^A04** (Register) - **MANDATORY** |
| `E` | Emergency | Emergency visits |
| `P` | Preadmit | Pre-admission |
| `R` | Recurring Patient | Recurring visits |

**Rules:**
- **ADT^A01**: Always use `I` (Inpatient)
- **ADT^A04**: Always use `O` (Outpatient)
- **ADT^A03/A08**: Use `I` or `O` based on visit type

---

## Doctor IDs

### Valid Doctor IDs (Registered in Modaqeq)

| Doctor ID | Status | Notes |
|-----------|--------|-------|
| `GD18668` | ✅ Valid | Default fallback ID |
| `DOC001` | ✅ Valid | Alternative ID |
| `DR001` | ✅ Valid | Alternative ID |

### Doctor ID Format in HL7

```
GD18668^Ahmed^Sara^^^^^^&MF7163-DOHID
```

**Components:**
1. Doctor ID: `GD18668`
2. Family Name: `Ahmed`
3. Given Name: `Sara`
4. Assigning Authority: `MF7163-DOHID`

### Adding New Doctor IDs

1. Register in Modaqeq validation tables
2. Add to `VALID_DOCTOR_IDS` in `.env`
3. Restart application

---

## ADT Message Types

| Message Type | Event Code | Description | Patient Class |
|--------------|------------|-------------|---------------|
| **ADT^A01** | `A01` | Admit/Visit Notification | `I` (Inpatient) |
| **ADT^A03** | `A03` | Discharge Patient | `I` or `O` |
| **ADT^A04** | `A04` | Register Patient | `O` (Outpatient) |
| **ADT^A08** | `A08` | Update Patient/Encounter | `I` or `O` |

---

## Demographics Codes

### Nationality (MALAFFI Table)

| Code | Description |
|------|-------------|
| `ARE` | Emirati |
| `IND` | Indian |
| `PAK` | Pakistani |
| `BGD` | Bangladeshi |
| `EGY` | Egyptian |
| `PHL` | Philippine |
| `LKA` | Sri Lankan |
| `NPL` | Nepalese |

### Gender

| Code | Description |
|------|-------------|
| `M` | Male |
| `F` | Female |
| `U` | Unknown |
| `N` | Not Available |
| `O` | Other |

### Marital Status

| Code | Description |
|------|-------------|
| `S` | Single |
| `M` | Married |
| `D` | Divorced |
| `W` | Widowed |
| `A` | Separated |
| `P` | Domestic Partner |
| `U` | Unknown |
| `NA` | Not Available |

### Religion

| Code | Description |
|------|-------------|
| `MU` | Muslim |
| `CHR` | Christianity |
| `HIN` | Hindu |
| `BUD` | Buddhist |
| `JH` | Jewish |
| `OTH` | Other |
| `VAR` | Unknown |

### Race

| Code | Description |
|------|-------------|
| `NT` | National |
| `NN` | Non-National |
| `GA` | Gulf Arab |
| `AS` | Asian |
| `AF` | African |
| `EU` | European |
| `AM` | American |
| `OC` | Oceanian |

---

## Phone Number Format

**Format:** `00971XXXXXXXXX`

**Components:**
- Country Code: `00971` (UAE)
- Number: 9 digits (without leading 0)

**Examples:**
- `00971501234567` ✅ Correct
- `0501234567` ❌ Missing country code
- `971501234567` ❌ Missing leading zeros

---

## Emirates ID Format

**Format:** 15 digits

**Example:** `784202155592524`

**Validation:**
- Must be exactly 15 digits
- Starts with `784` (UAE country code)
- No spaces or dashes

---

## Address Format

**HL7 Format:**
```
Street^Near^City^1^Postal^Country^H^Community^Area
```

**Example:**
```
123 Yas St^Near Corniche^Abu Dhabi^1^123456^ARE^H^AUH_12^Community_AUH_101
```

**Components:**
1. Street: `123 Yas St`
2. Near: `Near Corniche`
3. City: `Abu Dhabi`
4. State/Province: `1`
5. Postal Code: `123456`
6. Country: `ARE` (UAE)
7. Address Type: `H` (Home)
8. Community: `AUH_12`
9. Area: `Community_AUH_101`

---

## Visit Number Format

**Format:** Numeric (10+ digits)

**Example:** `20251217041131`

**Generation:**
- Use timestamp: `YYYYMMDDHHMMSS`
- Or simple numeric: `1005098765`

**In PV1 Segment:**
```
1005098765^^^&MF7163
```

---

## Date/Time Format

**Format:** `YYYYMMDDHHMMSS[+/-ZZZZ]`

**Examples:**
- `20251217131150` (without timezone)
- `20251217131150+0400` (with timezone - UAE is +0400)

**Components:**
- Year: 4 digits
- Month: 2 digits (01-12)
- Day: 2 digits (01-31)
- Hour: 2 digits (00-23)
- Minute: 2 digits (00-59)
- Second: 2 digits (00-59)
- Timezone: `+0400` (UAE Standard Time)

---

## Discharge Disposition (PV1-36)

**For ADT^A03 (Discharge) messages:**

| Code | Description |
|------|-------------|
| `8` | Discharged/transferred to home |
| `1` | Discharged to home or self-care |
| `2` | Discharged/transferred to another hospital |
| `3` | Discharged/transferred to skilled nursing facility |

**Required for ADT^A03 messages.**

---

## Modaqeq Validation Error Codes

| Error Code | Description | Common Cause | Fix |
|------------|-------------|--------------|-----|
| **1014** | Field value not found in validation table | Invalid doctor ID | Use ID from `VALID_DOCTOR_IDS` |
| **1061** | Unexpected Value | Wrong Patient Class | ADT^A01→`I`, ADT^A04→`O` |
| **Field too long** | Field exceeds maximum length | Data too long | Truncate to allowed length |
| **Required field missing** | Mandatory field empty | Missing data | Populate all required fields |

---

## Quick Configuration Checklist

- [ ] Facility code (`MF7163`) set in `.env`
- [ ] `VALID_DOCTOR_IDS` configured
- [ ] `DEFAULT_DOCTOR_ID` set to `GD18668`
- [ ] Patient Class rules understood (A01→`I`, A04→`O`)
- [ ] Modaqeq path configured
- [ ] Test messages validated successfully

---

## File Locations

- **Working Samples**: `hl7_samples/actual/`
- **Configuration Guide**: `GUIDE/malaffi-configuration-guide.md`
- **Generated Messages**: `MSG_Send/`
- **Config Template**: `config/config.template`

---

**Last Updated:** December 17, 2025  
**Version:** 1.0

