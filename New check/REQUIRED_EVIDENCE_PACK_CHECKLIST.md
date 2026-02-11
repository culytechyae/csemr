# Required Evidence Pack Checklist (One Page)
## To move the 17 “Evidence Pending” items to “Fully Compliant”

**Scope:** Evidence artifacts IT / Infrastructure / Facilities / Security Governance should attach for the **deployed environment**, to support the controls that are *policy-documented in the repo* but require *implementation proof*.

**How to use:** For each item below, attach the listed **screenshots / exports / documents** to your assessment package (PDF/ZIP). Redact secrets (passwords/keys) but keep settings visible.

---

## Evidence Items (17)

### 1) Q2 (PE 1.1) Physical & Environmental Security — **Evidence Pending**
- **Required documents**:
  - Physical Security Policy for clinic/server room (signed/approved)
  - Visitor access procedure + visitor log sample (last 30–90 days)
  - Access control method description (badge/biometric) + access log export (last 30–90 days)
  - CCTV coverage statement + sample screenshot showing camera coverage map (no sensitive angles)
  - Fire suppression maintenance certificate / inspection record (latest)
  - Environmental monitoring record (temperature/humidity) or BMS screenshot + alerting configuration

### 2) Q4 (AC 2.1) User Registration / De-registration Process — **Evidence Pending**
- **Required documents**:
  - User onboarding SOP (request → approval → provisioning → role assignment → MFA enablement)
  - User offboarding SOP (termination → deprovisioning → session revocation → access review)
  - Sample completed onboarding/offboarding tickets (redacted) showing approvals + timestamps
  - Access review cadence document (e.g., quarterly) + last review evidence (minutes/report)

### 3) Q12 (AC 5.7, CM 5.4) Wireless Access Secured — **Evidence Pending**
- **Required evidence (screenshots/exports)**:
  - WLC / AP configuration showing SSIDs, security mode, and admin access controls
  - Rogue AP detection / WIDS/WIPS enabled screenshot (or equivalent monitoring)
  - Wireless admin accounts list (redacted usernames OK) + MFA/2FA enabled proof (if supported)
  - Wireless firmware version + last update date

### 4) Q13 (AC 5.7) Guest Wi‑Fi Segregated — **Evidence Pending**
- **Required evidence (screenshots/exports)**:
  - VLAN mapping showing Guest SSID on separate VLAN/segment
  - Firewall rules/ACLs demonstrating Guest VLAN cannot access Internal VLANs
  - Captive portal configuration (if used) + session timeout limits

### 5) Q14 (AC 5.7, CM 5.4) Strong Wireless Encryption — **Evidence Pending**
- **Required evidence (screenshots/exports)**:
  - SSID security settings showing **WPA3** (preferred) or **WPA2‑Enterprise (802.1X)** + **AES**
  - Evidence that WEP/TKIP/WPS are disabled (or not used)
  - RADIUS config evidence (if WPA2‑Enterprise): server IP, auth method (redact shared secrets)

### 6) Q21 (OM 1, OM 2) Ops Procedures (SOPs, Change, Config, Baselines, etc.) — **Evidence Pending**
- **Required documents** (minimum set to close the “partially compliant” gap):
  - Change Management SOP + sample approved change ticket (redacted)
  - Configuration Management SOP (how configs are stored/versioned and reviewed)
  - Baseline / Minimum Security Configuration standard (OS hardening baseline, CIS mapping if used)
  - Malware Control SOP (ties into endpoint AV/EDR)
  - Backup SOP (may reference existing app backup capability) + restore test evidence (latest)
  - Logging & Monitoring SOP (what is monitored, who reviews, escalation)
  - Patch Management SOP (can reference Q22 evidence)

### 7) Q22 (OM 6.5) Patch Management Execution — **Evidence Pending**
- **Required evidence (exports/screenshots)**:
  - Patch schedule calendar or policy (monthly/weekly windows)
  - Last 2 patch cycles: change tickets + success report (OS + applications + network devices)
  - Firmware update records for firewalls/switches/WLC (last 6–12 months)
  - Exception register for deferred patches (with risk acceptance and target dates)

### 8) Q23 (OM 4.1) Real-time Anti‑Malware Deployed — **Evidence Pending**
- **Required evidence (EDR/AV console)**:
  - Endpoint coverage report (servers + workstations) showing **real‑time protection ON**
  - Policy assignment screenshot (which policy applies to which device group)
  - Server list + protection status (redacted hostnames acceptable)

### 9) Q24 (OM 4.1) Anti‑Malware Updates Current — **Evidence Pending**
- **Required evidence (EDR/AV console)**:
  - Signature/engine update status report (percent up-to-date; last update timestamps)
  - Update cadence configuration (automatic updates enabled)
  - Alerting for stale signatures (enabled) + sample alert (if any, redacted)

### 10) Q25 (OM 4.1) Removable Media Malware Scan on Connect — **Evidence Pending**
- **Required evidence (EDR/AV console + endpoint policy)**:
  - Policy showing “scan removable media on insertion” enabled
  - Device control policy showing enforcement mode (block/quarantine)
  - Sample log/event showing a removable media scan event (redacted)

### 11) Q26 (OM 4.1) AutoRun Disabled — **Evidence Pending**
- **Required evidence (Windows)**:
  - Group Policy (GPO) export or Intune configuration showing AutoRun/AutoPlay disabled
  - Screenshot of the policy settings (Computer Configuration → AutoPlay Policies)
  - Evidence of policy applied to endpoints (gpresult / Intune device compliance report)

### 12) Q29 (OM 7.1, OM 7.2) Periodic Independent Assessments — **Evidence Pending**
- **Required documents**:
  - Annual/Quarterly security assessment plan (scope, frequency, owner)
  - Latest independent assessment report (external pen test / vuln scan / audit) + remediation plan
  - Evidence of follow-up remediation tracking (tickets) and closure report

### 13) Q32 (CM 5.1) Network Components/Interconnections Documented — **Evidence Pending**
- **Required evidence (documents/exports)**:
  - Current network diagram(s): WAN/DMZ/Internal/VPN/Wi‑Fi segments
  - Inventory of network devices (make/model/serial/firmware/management IP) (redacted OK)
  - Firewall rulebase export summary (high-level) + change control reference
  - IP addressing scheme + VLAN matrix (including Guest vs Internal)

### 14) Q33 (CM 5.1) Threat & Vulnerability Identification Procedures Executed — **Evidence Pending**
- **Required evidence (scanner + process)**:
  - Vulnerability scan schedule (monthly internal, quarterly external)
  - Latest scan report(s) (Nessus/Qualys/OpenVAS/etc.) + severity summary
  - Remediation tickets for High/Critical findings + closure evidence
  - Threat intelligence source list + review cadence (e.g., advisories, vendor bulletins)

### 15) Q34 (CM 5.1) Network Controls Regularly Reviewed — **Evidence Pending**
- **Required evidence (governance)**:
  - Quarterly network security review minutes/report (firewall rules, segmentation, VPN, Wi‑Fi)
  - KPI dashboard screenshot (blocked attacks, alerts, patch compliance, vuln trends)
  - Risk register entries + approved exceptions (with expiry/renewal dates)

### 16) Q37 (CM 5.3) Network Segregation Implemented — **Evidence Pending**
- **Required evidence (network)**:
  - VLAN/VRF segmentation diagram showing separation by criticality (DMZ/internal/guest/management)
  - Firewall/ACL rules proving isolation (e.g., guest → internal denied; management restricted)
  - Evidence of separate management plane access (jump host/VPN-only/admin MFA)

### 17) Q38 (HI 1.1, HI 2.2) Management Commitment Policy — **Evidence Pending**
- **Required documents**:
  - Signed “Management Commitment to Protect Healthcare Information” statement (CIO/CEO)
  - Information Security Charter / Governance document (roles, responsibilities, oversight)
  - Evidence of communication to workforce (email memo / intranet post / policy acknowledgement)

---

## Packaging Requirements (Recommended)
- **Format**: One ZIP with folders `Q2`, `Q4`, `Q12`… or a single PDF binder with section tabs.
- **Redaction**: Remove secrets (shared keys, passwords), but keep configuration values visible.
- **Recency**: Prefer artifacts from the **last 90 days** (or latest available) and include dates.

**Result:** Attaching the above evidence should allow reclassification of the 17 items from **“Partially Compliant / Evidence Pending”** to **“Fully Compliant.”**


