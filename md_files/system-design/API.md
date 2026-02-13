# Taaleem CS EMR — API Reference

> Document version: 1.0 · Last updated: February 2026

---

## 1. Overview

All API endpoints live under `app/api/` and use **Next.js Route Handlers** (exported `GET`, `POST`, `PUT`, `DELETE` functions). Every endpoint:

- Returns JSON (`Content-Type: application/json`)
- Authenticates via JWT token in `auth-token` HTTP-only cookie
- Is subject to security middleware (headers, rate limiting)
- Logs significant actions to `AuditLog`

### Base URL

```
http://<SERVER_IP>:8000/api
```

### Authentication Header

No `Authorization` header is needed — the JWT is stored as an HTTP-only cookie named `auth-token`, automatically sent by the browser with every request.

---

## 2. Authentication Endpoints

### 2.1 Login

```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "nurse@school.local",
  "password": "SecureP@ss1"
}
```

**Response (200):**
```json
{
  "user": { "id": "...", "email": "...", "role": "NURSE", "firstName": "...", "lastName": "..." },
  "requireMfa": false
}
```

**Error Responses:**
- `401` — Invalid credentials
- `403` — Account locked (too many failed attempts)
- `400` — MFA required (`requireMfa: true`)

**Side Effects:**
- Creates `Session` record in DB
- Sets `auth-token` cookie (7-day expiry)
- Logs `LoginAttempt` and `SecurityEvent`

### 2.2 Logout

```
POST /api/auth/logout
```

Invalidates the session and clears the cookie.

### 2.3 Current User

```
GET /api/auth/me
```

Returns the authenticated user's profile or `{ user: null }` if not authenticated.

### 2.4 Change Password

```
POST /api/auth/change-password
```

**Request Body:**
```json
{
  "currentPassword": "OldP@ss1",
  "newPassword": "NewP@ss2"
}
```

Enforces password policy: min 8 chars, uppercase, lowercase, number, special char, no reuse of last 5 passwords.

### 2.5 Activity Ping

```
POST /api/auth/activity
```

Updates `Session.lastActivityAt` to extend the inactivity timer.

### 2.6 MFA Endpoints

```
GET  /api/auth/mfa/status       # Check MFA status for current user
POST /api/auth/mfa/setup        # Generate TOTP secret + QR code
POST /api/auth/mfa/verify       # Verify TOTP code during login
POST /api/auth/mfa/disable      # Disable MFA
```

---

## 3. Dashboard & Analytics Endpoints

### 3.1 Dashboard Stats

```
GET /api/dashboard/stats
```

**Response:**
```json
{
  "totalSchools": 5,
  "totalStudents": 1200,
  "totalVisits": 350,
  "visitsToday": 12,
  "pendingHL7Messages": 3,
  "recentVisits": [...]
}
```

### 3.2 Analytics Dashboard

```
GET /api/analytics/dashboard
```

Returns aggregated data for charts:
- `visitTrends` — Daily visit counts (last 30 days)
- `visitTypes` — Visit type distribution
- `schoolComparison` — Per-school visit counts
- `monthlyData` — Month-over-month comparison

### 3.3 Analytics Export

```
GET /api/analytics/export?format=csv|xlsx
```

Exports analytics data as CSV or XLSX file download.

---

## 4. Schools Endpoints

### 4.1 List Schools

```
GET /api/schools
```

Returns all schools. Non-admin users only see their assigned school.

### 4.2 Create School

```
POST /api/schools
```

**Request Body:**
```json
{
  "name": "Al Qeyam Charter School",
  "code": "6041",
  "address": "Abu Dhabi, UAE",
  "phone": "+971-2-XXX-XXXX",
  "email": "info@alqeyam.ae",
  "principalName": "Dr. Ahmed"
}
```

**Required Role:** `ADMIN`

### 4.3 Get / Update / Delete School

```
GET    /api/schools/[id]
PUT    /api/schools/[id]
DELETE /api/schools/[id]
```

### 4.4 School HL7 Configuration

```
GET  /api/schools/[id]/hl7-config
PUT  /api/schools/[id]/hl7-config
GET  /api/schools/hl7-config          # List all configs
```

Manages per-school Malaffi HL7 integration settings (facility codes, auto-send rules, etc.).

### 4.5 Academic Year

```
GET  /api/schools/[id]/academic-year
PUT  /api/schools/[id]/academic-year
```

---

## 5. Students Endpoints

### 5.1 List Students

```
GET /api/students?schoolId=xxx&search=xxx&page=1&limit=50
```

Supports pagination, search (by name or student ID), and school filtering.

### 5.2 Create Student

```
POST /api/students
```

**Request Body:**
```json
{
  "schoolId": "...",
  "studentId": "STU001",
  "academicYear": "2025-2026",
  "firstName": "Ali",
  "lastName": "Ahmed",
  "dateOfBirth": "2015-03-15",
  "gender": "MALE",
  "parentName": "Mohammed Ahmed",
  "parentPhone": "+971-50-XXX-XXXX",
  "emergencyContact": "Fatima Ahmed",
  "emergencyPhone": "+971-55-XXX-XXXX"
}
```

### 5.3 Get / Update / Delete Student

```
GET    /api/students/[id]
PUT    /api/students/[id]
DELETE /api/students/[id]
```

### 5.4 Student Analytics

```
GET /api/students/[id]/analytics
```

Returns visit history, trends, and health metrics for a specific student.

### 5.5 Student Summary

```
GET /api/students/[id]/summary
```

Returns health summary (allergies, chronic conditions, medications), visit statistics, and grade info.

### 5.6 Student Visits

```
GET /api/students/[id]/visits
```

Returns all clinical visits for a specific student (used in the New Assessment sidebar).

---

## 6. Clinical Visits Endpoints

### 6.1 List Visits

```
GET /api/visits?search=xxx&schoolId=xxx&from=xxx&to=xxx&visitType=xxx
```

Supports search (by student name, ID, or complaint), date range, visit type, and school filtering.

### 6.2 Create Visit

```
POST /api/visits
```

**Request Body:**
```json
{
  "studentId": "...",
  "schoolId": "...",
  "visitType": "ILLNESS",
  "chiefComplaint": "Headache and fever",
  "diagnosis": "Viral fever",
  "treatment": "Rest and fluids, paracetamol 500mg",
  "notes": "Student looks pale",
  "followUpRequired": true,
  "followUpDate": "2026-02-20",
  "notifyParent": true,
  "assessment": {
    "temperature": 38.2,
    "bloodPressureSystolic": 110,
    "bloodPressureDiastolic": 70,
    "heartRate": 88,
    "respiratoryRate": 18,
    "oxygenSaturation": 97,
    "height": 145,
    "weight": 40,
    "painScale": 3
  }
}
```

**Side Effects:**
1. Creates `ClinicalVisit` record
2. Creates `ClinicalAssessment` record (if `assessment` provided)
3. Generates HL7 ADT^A01 message (if school has HL7 config with `autoSend: true`)
4. Sends parent notification email (if `notifyParent: true`)
5. Creates `AuditLog` entry

### 6.3 Get / Update / Delete Visit

```
GET    /api/visits/[id]
PUT    /api/visits/[id]
DELETE /api/visits/[id]
```

---

## 7. Health Records Endpoints

### 7.1 List / Create

```
GET  /api/health-records?schoolId=xxx&studentId=xxx
POST /api/health-records
```

### 7.2 Get / Update / Delete

```
GET    /api/health-records/[id]
PUT    /api/health-records/[id]
DELETE /api/health-records/[id]
```

### 7.3 Latest Health Record for Student

```
GET /api/health-records/student/[studentId]/latest
```

Used to auto-populate vision/health fields in the New Assessment form.

---

## 8. HL7 Message Endpoints

### 8.1 List Messages

```
GET /api/hl7?status=PENDING|SENT|FAILED|ACKNOWLEDGED&schoolId=xxx
```

### 8.2 Generate Message

```
POST /api/hl7/generate
```

Manually triggers HL7 message generation for a specific visit.

---

## 9. User Management Endpoints

### 9.1 List / Create Users

```
GET  /api/users?search=xxx&role=xxx
POST /api/users
```

**Required Role:** `ADMIN`

### 9.2 Get / Update / Delete User

```
GET    /api/users/[id]
PUT    /api/users/[id]
DELETE /api/users/[id]
```

### 9.3 Unlock User Account

```
POST /api/admin/users/[id]/unlock
```

---

## 10. Import Endpoints (Bulk CSV)

```
POST /api/import/students        # Bulk student import
POST /api/import/visits          # Bulk visit import
POST /api/import/assessments     # Bulk assessment import
POST /api/import/health-records  # Bulk health record import
POST /api/import/users           # Bulk user import
```

All accept `multipart/form-data` with a CSV file upload.

---

## 11. Email Endpoints

```
GET  /api/email/templates              # List email templates
GET  /api/email/templates/[type]       # Get template by type
PUT  /api/email/templates/[type]       # Update template
GET  /api/email/logs                   # Email delivery logs
```

---

## 12. Security Endpoints

### 12.1 Events & Alerts

```
GET /api/security/events    # Security event log (logins, lockouts, etc.)
GET /api/security/alerts    # Active security alerts
```

### 12.2 Incident Management

```
GET    /api/security/incidents
POST   /api/security/incidents
GET    /api/security/incidents/[id]
PUT    /api/security/incidents/[id]
```

### 12.3 Vendor Management

```
GET  /api/security/vendors
POST /api/security/vendors
```

### 12.4 Security Training

```
GET    /api/security/training
POST   /api/security/training
GET    /api/security/training/[id]
PUT    /api/security/training/[id]
```

---

## 13. Admin Endpoints

### 13.1 Admin Stats

```
GET /api/admin/stats
```

Returns system-wide statistics for the admin dashboard.

### 13.2 Database Backup

```
POST /api/admin/backup
```

Triggers a database backup (requires ADMIN role).

### 13.3 Data Export

```
GET /api/admin/export?type=students|visits|users&format=csv|xlsx
```

### 13.4 Audit Logs

```
GET /api/audit-logs?userId=xxx&action=xxx&from=xxx&to=xxx
```

---

## 14. Reports Endpoints

```
GET /api/reports/visits?schoolId=xxx&from=xxx&to=xxx
GET /api/reports/students?schoolId=xxx
GET /api/reports/hl7?schoolId=xxx&status=xxx
```

---

## 15. Health Check

```
GET /api/health
```

Returns `{ status: "ok" }` — used by the watchdog and PM2 for uptime monitoring.

---

## 16. Error Response Format

All error responses follow a consistent format:

```json
{
  "error": "Human-readable error message"
}
```

**HTTP Status Codes:**

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad request (validation error) |
| `401` | Unauthorized (missing or invalid token) |
| `403` | Forbidden (insufficient role) |
| `404` | Not found |
| `409` | Conflict (duplicate record) |
| `500` | Internal server error |

---

## 17. Role-Based Access Control

| Endpoint Group | ADMIN | CLINIC_MANAGER | NURSE | DOCTOR | STAFF |
|---------------|-------|----------------|-------|--------|-------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ |
| Schools (CRUD) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Students | ✅ | ✅ | ✅ | ✅ | 👁 |
| Visits | ✅ | ✅ | ✅ | ✅ | 👁 |
| Health Records | ✅ | ✅ | ✅ | ✅ | 👁 |
| Users (CRUD) | ✅ | ❌ | ❌ | ❌ | ❌ |
| HL7 Config | ✅ | ✅ | ❌ | ❌ | ❌ |
| Import | ✅ | ✅ | ❌ | ❌ | ❌ |
| Security | ✅ | ❌ | ❌ | ❌ | ❌ |
| Admin Panel | ✅ | ❌ | ❌ | ❌ | ❌ |

`👁` = Read-only access (scoped to their assigned school)

