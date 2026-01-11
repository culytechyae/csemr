# HL7 ADT Message Samples

This folder contains working sample HL7 ADT (Admit, Discharge, Transfer) messages that have been validated and confirmed to work with MALAFFI/Modaqeq.

## Sample Files

### ADT_A01_sample.hl7
**ADT^A01 - Admit/Visit Notification**
- Used when: A new patient visit is created or a patient is admitted
- Key Features:
  - Patient registration and admission
  - Visit information
  - Doctor assignments
  - Location details

### ADT_A03_sample.hl7
**ADT^A03 - Discharge Patient**
- Used when: A patient is discharged or a visit is completed
- Key Features:
  - Discharge date/time in PV1-45
  - Same patient and visit information as admission
  - Completion of encounter

### ADT_A04_sample.hl7
**ADT^A04 - Register Patient**
- Used when: Initial patient registration (before visit)
- Key Features:
  - Patient demographic registration
  - No visit information required
  - Initial enrollment

### ADT_A08_sample.hl7
**ADT^A08 - Update Patient/Encounter Information**
- Used when: Patient or encounter information needs to be updated
- Key Features:
  - Updated patient demographics
  - Modified visit information
  - Information corrections

## Message Structure

All ADT messages follow this structure:

1. **MSH** - Message Header
   - Format: `MSH|^~\&|SYSTEMCODE^SYSTEMCODE|SYSTEMCODE^SYSTEMCODE|Rhapsody^MALAFFI|ADHIE|YYYYMMDDHHMMSS+0400||ADT^AXX|MESSAGE_ID|P|2.5.1`
   - Contains: Sending/receiving application, timestamp, message type, control ID

2. **EVN** - Event Type
   - Format: `EVN|AXX|YYYYMMDDHHMMSS`
   - Contains: Event type code and timestamp

3. **PID** - Patient Identification
   - Format: `PID|1||PATIENT_ID^^^&SYSTEMCODE||LAST^FIRST^MIDDLE^^^^P||YYYYMMDD|GENDER||...`
   - Contains: Patient demographics, Emirates ID, address, contact info, language, religion, nationality

4. **PV1** - Patient Visit
   - Format: `PV1|1|I|LOCATION^ROOM^BED^FACILITY&SYSTEMCODE-DOHID^^^^^DESCRIPTION||||DOCTOR_ID^DOCTOR_NAME^^^^^^&SYSTEMCODE-DOHID|||7||||4|||||VISIT_NUMBER^^^&SYSTEMCODE|||||||||||||||||||||||||ADMIT_DATE`
   - Contains: Visit location, doctor assignments, visit number, dates

## Key Field Formats

### Patient Identifier (PID-3)
```
PATIENT_ID^^^&SYSTEMCODE
```
- Example: `789012^^^&MF7163`

### Doctor ID (PV1-7, PV1-9)
```
DOCTOR_ID^LAST^FIRST^^^^^^&SYSTEMCODE-DOHID
```
- Example: `GD45876^Example^Doctor^^^^^^&MF7163-DOHID`
- **Important**: Doctor IDs must be registered in Modaqeq validation tables

### Visit Location (PV1-3)
```
POINT_OF_CARE^ROOM^BED^FACILITY&SYSTEMCODE-DOHID^^^^^DESCRIPTION
```
- Example: `OR PERIOP^OR Periop^B1^MF3333&MF7163-DOHID^^^^^ICU`

### Visit Number (PV1-19)
```
VISIT_NUMBER^^^&SYSTEMCODE
```
- Example: `1005098765^^^&MF7163`

## Validation Requirements

All messages must:
1. Use valid doctor IDs registered in Modaqeq validation tables
2. Follow exact field formats as shown in samples
3. Include all required segments (MSH, EVN, PID, PV1)
4. Use proper date/time formats (YYYYMMDDHHMMSS+0400)
5. Include proper assigning authorities (SYSTEMCODE-DOHID format)

## Usage

These samples can be used to:
- Test Modaqeq validation
- Verify message format compliance
- Reference for implementation
- Training and documentation

## Notes

- Replace `SYSTEMCODE` with your actual system code (e.g., `MF7163`)
- Replace `GD45876` with valid doctor IDs from Modaqeq validation tables
- Replace patient data with actual patient information
- Ensure all timestamps are in UTC+4 format (+0400)
- Message Control IDs should be unique UUIDs

## Last Updated
December 2025

