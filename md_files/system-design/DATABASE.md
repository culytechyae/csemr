# Taaleem CS EMR — Database Design

> Document version: 1.0 · Last updated: February 2026

---

## 1. Overview

| Property | Value |
|----------|-------|
| **DBMS** | PostgreSQL |
| **ORM** | Prisma Client v5.7.x |
| **Schema file** | `prisma/schema.prisma` |
| **Models** | 18 tables |
| **Migrations** | Prisma Migrate (`prisma/migrations/`) |
| **Connection** | Pooled via `DATABASE_URL` query params |

---

## 2. Entity-Relationship Diagram

```
┌──────────┐     ┌──────────┐     ┌─────────────┐
│  School   │────<│   User   │     │   Student   │
│           │     │          │     │             │
│ id (PK)   │     │ id (PK)  │     │ id (PK)     │
│ name      │     │ email    │     │ studentId   │
│ code (UQ) │     │ role     │     │ firstName   │
│ address   │     │ schoolId │>────│ schoolId    │>──┐
│ phone     │     │ ...      │     │ ...         │   │
└──────┬───┘     └──────┬───┘     └──────┬──────┘   │
       │                │                │           │
       │         ┌──────▼───┐     ┌──────▼──────┐   │
       │         │ Session   │     │ClinicalVisit│   │
       │         │          │     │             │   │
       │         │ id (PK)  │     │ id (PK)     │   │
       │         │ userId   │     │ studentId   │   │
       │         │ token    │     │ schoolId    │>──┘
       │         │ ...      │     │ createdBy   │>──── User
       │         └──────────┘     │ visitType   │
       │                          │ ...         │
       │                          └──────┬──────┘
       │                                 │
       │                          ┌──────▼──────────┐
       │                          │ClinicalAssessment│
       │                          │                  │
       │                          │ id (PK)          │
       │                          │ visitId (UQ)     │>── ClinicalVisit
       │                          │ studentId        │
       │                          │ vitals...        │
       │                          │ vision...        │
       │                          └──────────────────┘
       │
       │    ┌──────────────┐     ┌──────────────┐
       ├───<│ HealthRecord │     │  HL7Message   │
       │    │ id (PK)      │     │ id (PK)       │
       │    │ studentId    │     │ messageType   │
       │    │ schoolId     │     │ schoolId      │>──── School
       │    │ height/weight│     │ studentId     │
       │    │ vision...    │     │ visitId       │
       │    └──────────────┘     │ status        │
       │                         └───────────────┘
       │
       └───<│ SchoolHL7Config │
            │ id (PK)          │
            │ schoolId (UQ)    │
            │ facilityCode     │
            │ ...              │
            └──────────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│PasswordHistory│  │ LoginAttempt │  │SecurityEvent │
│ id (PK)      │  │ id (PK)      │  │ id (PK)      │
│ userId       │  │ userId       │  │ eventType    │
│ passwordHash │  │ email        │  │ userId       │
│ createdAt    │  │ success      │  │ severity     │
└──────────────┘  │ ipAddress    │  │ description  │
                  └──────────────┘  │ metadata     │
                                    └──────────────┘

┌──────────────┐  ┌──────────────────┐  ┌──────────────┐
│  AuditLog    │  │SecurityIncident  │  │    Vendor    │
│ id (PK)      │  │ id (PK)          │  │ id (PK)      │
│ userId       │  │ title            │  │ name         │
│ action       │  │ severity         │  │ status       │
│ entityType   │  │ status           │  │ riskLevel    │
│ entityId     │  │ reportedBy       │  │ ...          │
│ changes      │  │ assignedTo       │  └──────────────┘
│ severity     │  │ ...              │
└──────────────┘  └──────────────────┘

┌──────────────┐  ┌──────────────────┐
│  EmailLog    │  │SecurityTraining  │
│ id (PK)      │  │ id (PK)          │
│ to           │  │ userId           │
│ subject      │  │ trainingType     │
│ status       │  │ status           │
│ templateType │  │ title            │
│ sentBy       │  │ ...              │
└──────────────┘  └──────────────────┘
```

---

## 3. Model Reference

### 3.1 Core Clinical Models

#### `User`

The system user (nurse, doctor, admin, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String | PK, cuid | Unique identifier |
| `email` | String | Unique | Login email |
| `passwordHash` | String | — | bcrypt hash |
| `firstName` | String | — | First name |
| `lastName` | String | — | Last name |
| `role` | UserRole | Enum | ADMIN, CLINIC_MANAGER, NURSE, DOCTOR, STAFF |
| `schoolId` | String? | FK → School | Assigned school (null for super-admin) |
| `isActive` | Boolean | Default: true | Account active flag |
| `passwordChangedAt` | DateTime? | — | Last password change |
| `passwordExpiresAt` | DateTime? | — | Password expiry date |
| `failedLoginAttempts` | Int | Default: 0 | Failed login counter |
| `lockedUntil` | DateTime? | — | Account lockout expiry |
| `lastLoginAt` | DateTime? | — | Last successful login |
| `lastLoginIp` | String? | — | Last login IP address |
| `mfaEnabled` | Boolean | Default: false | MFA toggle |
| `mfaSecret` | String? | — | TOTP secret (encrypted) |

**Indexes**: `email`, `schoolId`, `isActive`

#### `School`

A school clinic location.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String | PK, cuid | Unique identifier |
| `name` | String | — | School name |
| `code` | String | Unique | School code (e.g., "6041") |
| `address` | String | — | Physical address |
| `phone` | String | — | Contact phone |
| `email` | String? | — | School email |
| `principalName` | String | — | Principal name |
| `currentAcademicYear` | String? | — | e.g., "2025-2026" |
| `isActive` | Boolean | Default: true | Active flag |

**Index**: `code`

#### `Student`

A student enrolled at a school.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String | PK, cuid | Unique identifier |
| `schoolId` | String | FK → School | Enrolled school |
| `studentId` | String | — | School-specific student ID |
| `academicYear` | String | — | e.g., "2025-2026" |
| `firstName` | String | — | First name |
| `lastName` | String | — | Last name |
| `dateOfBirth` | DateTime | — | Date of birth |
| `gender` | Gender | Enum | MALE, FEMALE |
| `nationality` | String? | — | Nationality |
| `bloodType` | BloodType | Enum, Default: UNKNOWN | Blood type |
| `grade` | String? | — | Grade level |
| `homeroom` | String? | — | Homeroom class |
| `studentEmiratesId` | String? | — | UAE Emirates ID |
| `parentName` | String | — | Parent/guardian name |
| `parentPhone` | String | — | Parent phone |
| `parentEmail` | String? | — | Parent email (for notifications) |
| `emergencyContact` | String | — | Emergency contact name |
| `emergencyPhone` | String | — | Emergency phone |
| `allergies` | String? | — | Known allergies |
| `chronicConditions` | String? | — | Chronic conditions |
| `medications` | String? | — | Current medications |
| `isActive` | Boolean | Default: true | Enrollment status |

**Unique constraint**: `(schoolId, studentId, academicYear)`
**Indexes**: `schoolId`, `studentId`, `academicYear`

#### `ClinicalVisit`

A single clinic visit event.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | String | PK, cuid | Unique identifier |
| `studentId` | String | FK → Student | Patient |
| `schoolId` | String | FK → School | Visit location |
| `visitDate` | DateTime | Default: now() | Visit date/time |
| `visitType` | VisitType | Enum | ROUTINE_CHECKUP, ILLNESS, INJURY, VACCINATION, EMERGENCY, FOLLOW_UP |
| `chiefComplaint` | String? | — | Primary complaint |
| `notes` | String? | — | Clinical notes |
| `diagnosis` | String? | — | Diagnosis text |
| `treatment` | String? | — | Treatment plan |
| `followUpRequired` | Boolean | Default: false | Follow-up flag |
| `followUpDate` | DateTime? | — | Scheduled follow-up date |
| `createdBy` | String | FK → User | Clinician who created the visit |

**Indexes**: `studentId`, `schoolId`, `visitDate`
**Relations**: Has one `ClinicalAssessment` (optional), has many `HL7Message`

#### `ClinicalAssessment`

Vital signs and clinical examination data attached to a visit.

| Column | Type | Description |
|--------|------|-------------|
| `id` | String (PK) | Unique identifier |
| `visitId` | String (UQ, FK) | One-to-one with ClinicalVisit |
| `studentId` | String (FK) | Patient |
| **Vitals** | | |
| `temperature` | Float? | Body temperature (°C) |
| `bloodPressureSystolic` | Int? | Systolic BP (mmHg) |
| `bloodPressureDiastolic` | Int? | Diastolic BP (mmHg) |
| `heartRate` | Int? | Heart rate (bpm) |
| `respiratoryRate` | Int? | Respiratory rate (/min) |
| `oxygenSaturation` | Float? | SpO₂ (%) |
| `height` | Float? | Height (cm) |
| `weight` | Float? | Weight (kg) |
| `bmi` | Float? | Calculated BMI |
| `painScale` | Int? | 0–10 scale |
| **Physical Exam** | | |
| `generalAppearance` | String? | General appearance notes |
| `skinCondition` | String? | Skin examination |
| `eyes` | String? | Eye examination |
| `ears` | String? | Ear examination |
| `throat` | String? | Throat examination |
| `cardiovascular` | String? | Cardiovascular exam |
| `respiratory` | String? | Respiratory exam |
| `abdomen` | String? | Abdominal exam |
| `neurological` | String? | Neurological exam |
| `otherFindings` | String? | Other findings |
| **Vision Data** | | |
| `colorBlindness` | String? | Normal/Abnormal |
| `visionTestingPerformed` | Boolean? | Yes/No |
| `visionTestingNotPerformedReason` | String? | Reason if not performed |
| `correctiveLenses` | String? | None, Glasses, Contact lenses, etc. |
| `rightEye` / `leftEye` | String? | Vision acuity (6/3 to 6/60) |
| `rightEyeWithCorrection` / `leftEyeWithCorrection` | String? | Corrected acuity |
| `visionScreeningResult` | String? | Normal/Abnormal |

**Indexes**: `studentId`, `visitId`

#### `HealthRecord`

Standalone health screening record (annual checkups, vision screenings).

| Column | Type | Description |
|--------|------|-------------|
| `id` | String (PK) | Unique identifier |
| `studentId` | String (FK) | Patient |
| `schoolId` | String (FK) | School |
| `height` / `weight` / `bmi` | Float? | Body measurements |
| `colorBlindness` | String? | Normal/Abnormal |
| `visionTestingPerformed` | Boolean? | Yes/No |
| `rightEye` / `leftEye` | String? | Vision acuity |
| `visionScreeningResult` | String? | Normal/Abnormal |
| `recordedBy` | String (FK) | User who recorded |
| `recordedAt` | DateTime | Recording date |

**Indexes**: `studentId`, `schoolId`, `recordedAt`

---

### 3.2 HL7 / Integration Models

#### `HL7Message`

Tracks HL7 messages generated for Malaffi HIE.

| Column | Type | Description |
|--------|------|-------------|
| `id` | String (PK) | Unique identifier |
| `messageType` | String | ADT, ORU, etc. |
| `messageControlId` | String (UQ) | HL7 message control ID |
| `studentId` | String? (FK) | Related patient |
| `visitId` | String? (FK) | Related visit |
| `schoolId` | String (FK) | Origin school |
| `messageContent` | Text | Full HL7 message body |
| `status` | HL7MessageStatus | PENDING, SENT, FAILED, ACKNOWLEDGED |
| `sentAt` | DateTime? | Transmission timestamp |
| `acknowledgedAt` | DateTime? | ACK received timestamp |
| `errorMessage` | Text? | Error details if failed |
| `retryCount` | Int | Number of transmission retries |

**Indexes**: `status`, `schoolId`, `messageControlId`, `createdAt`

#### `SchoolHL7Config`

Per-school HL7 integration configuration.

| Column | Type | Description |
|--------|------|-------------|
| `id` | String (PK) | Unique identifier |
| `schoolId` | String (UQ, FK) | One-to-one with School |
| `facilityCode` | String | DOH facility code (e.g., "MF7163") |
| `sendingApplication` | String | Default: "SchoolClinicEMR" |
| `sendingFacility` | String | Usually facility code |
| `receivingApplication` | String | Default: "Rhapsody" |
| `receivingFacility` | String | Default: "MALAFFI" |
| `processingId` | String | Default: "ADHIE" |
| `hl7Version` | String | Default: "2.5.1" |
| `autoSend` | Boolean | Auto-send on visit creation |
| `retryAttempts` | Int | Default: 3 |
| `validDoctorIds` | Text? | Comma-separated list |
| `defaultDoctorId` | String? | Fallback doctor ID |
| `autoSendMessageTypes` | Text? | JSON array of enabled types |
| `environment` | String | "test" or "production" |
| `enabled` | Boolean | Enable/disable HL7 |

---

### 3.3 Security & Audit Models

#### `Session`

Active user sessions (DB-backed for server-side revocation).

| Column | Type | Description |
|--------|------|-------------|
| `id` | String (PK) | Unique identifier |
| `userId` | String (FK) | Session owner |
| `token` | String (UQ) | JWT token string |
| `expiresAt` | DateTime | Token expiry |
| `ipAddress` | String? | Client IP |
| `userAgent` | String? | Browser user-agent |
| `isActive` | Boolean | Default: true |
| `lastActivityAt` | DateTime | Last API call timestamp |

**Indexes**: `userId`, `token`, `isActive`, `expiresAt`

#### `PasswordHistory`

Stores previous password hashes to prevent reuse.

| Column | Type | Description |
|--------|------|-------------|
| `userId` | String (FK) | User |
| `passwordHash` | String | Previous bcrypt hash |
| `createdAt` | DateTime | When set |

#### `LoginAttempt`

Tracks every login attempt (success and failure).

| Column | Type | Description |
|--------|------|-------------|
| `userId` | String? (FK) | User (null if email unknown) |
| `email` | String | Attempted email |
| `success` | Boolean | Login result |
| `ipAddress` | String? | Client IP |
| `failureReason` | String? | Why it failed |

**Indexes**: `email`, `userId`, `success`, `createdAt`, `ipAddress`

#### `SecurityEvent`

System-wide security events (logins, lockouts, breaches).

| Column | Type | Description |
|--------|------|-------------|
| `eventType` | String | LOGIN_SUCCESS, LOGIN_FAILURE, ACCOUNT_LOCKED, etc. |
| `userId` | String? | Related user |
| `severity` | String | LOW, MEDIUM, HIGH, CRITICAL |
| `description` | Text | Event details |
| `metadata` | Text? | JSON additional data |
| `resolved` | Boolean | Default: false |

**Indexes**: `eventType`, `userId`, `severity`, `resolved`, `createdAt`

#### `AuditLog`

Comprehensive audit trail for all significant actions.

| Column | Type | Description |
|--------|------|-------------|
| `userId` | String? | Actor |
| `action` | String | CREATE, UPDATE, DELETE, LOGIN, etc. |
| `entityType` | String | User, Student, Visit, etc. |
| `entityId` | String | Target entity ID |
| `changes` | Text? | JSON diff (before → after) |
| `ipAddress` | String? | Client IP |
| `severity` | String | INFO, WARNING, ERROR, CRITICAL |

**Indexes**: `userId`, `(entityType, entityId)`, `createdAt`, `severity`, `action`

#### `SecurityIncident`

Security incident tracking and management.

| Column | Type | Description |
|--------|------|-------------|
| `title` | String | Incident title |
| `severity` | IncidentSeverity | CRITICAL, HIGH, MEDIUM, LOW |
| `status` | IncidentStatus | OPEN, INVESTIGATING, CONTAINED, RESOLVED, CLOSED |
| `category` | String | UNAUTHORIZED_ACCESS, MALWARE, DATA_BREACH, etc. |
| `reportedBy` | String? (FK) | Reporter user |
| `assignedTo` | String? (FK) | Investigator user |
| `impact` / `rootCause` / `remediation` | Text? | Investigation details |
| `breachConfirmed` | Boolean | Data breach flag |

#### `Vendor`

Third-party vendor security management.

| Column | Type | Description |
|--------|------|-------------|
| `name` | String | Vendor name |
| `status` | VendorStatus | PENDING, APPROVED, ACTIVE, SUSPENDED, TERMINATED |
| `riskLevel` | RiskLevel | LOW, MEDIUM, HIGH |
| `hasSystemAccess` / `hasDataAccess` / `hasNetworkAccess` | Boolean | Access flags |
| `complianceStatus` | String? | MALAFFI_COMPLIANT, ADHICS_COMPLIANT, etc. |
| `ndaSigned` / `agreementSigned` | Boolean | Contract status |

#### `SecurityTraining`

Employee security awareness training tracking.

| Column | Type | Description |
|--------|------|-------------|
| `userId` | String (FK) | Trainee |
| `trainingType` | TrainingType | SECURITY_AWARENESS, ANNUAL_REFRESHER, etc. |
| `status` | TrainingStatus | PENDING, IN_PROGRESS, COMPLETED, EXPIRED |
| `score` / `maxScore` | Int? | Assessment results |
| `completedAt` | DateTime? | Completion date |
| `expiresAt` | DateTime? | Certification expiry |

### 3.4 Communication Model

#### `EmailLog`

Tracks all outbound emails.

| Column | Type | Description |
|--------|------|-------------|
| `to` | String | Recipient email |
| `subject` | String | Email subject |
| `body` / `html` | Text | Email content |
| `status` | EmailStatus | PENDING, SENT, FAILED, BOUNCED, DELIVERED |
| `templateType` | String? | WELCOME, PASSWORD_RESET, PARENT_VISIT_NOTIFICATION |
| `sentBy` | String? (FK) | Triggering user |

---

## 4. Enums

| Enum | Values |
|------|--------|
| `UserRole` | ADMIN, CLINIC_MANAGER, NURSE, DOCTOR, STAFF |
| `Gender` | MALE, FEMALE |
| `BloodType` | A_POSITIVE, A_NEGATIVE, B_POSITIVE, B_NEGATIVE, AB_POSITIVE, AB_NEGATIVE, O_POSITIVE, O_NEGATIVE, UNKNOWN |
| `VisitType` | ROUTINE_CHECKUP, ILLNESS, INJURY, VACCINATION, EMERGENCY, FOLLOW_UP |
| `HL7MessageStatus` | PENDING, SENT, FAILED, ACKNOWLEDGED |
| `EmailStatus` | PENDING, SENT, FAILED, BOUNCED, DELIVERED |
| `IncidentSeverity` | CRITICAL, HIGH, MEDIUM, LOW |
| `IncidentStatus` | OPEN, INVESTIGATING, CONTAINED, RESOLVED, CLOSED |
| `VendorStatus` | PENDING, APPROVED, ACTIVE, SUSPENDED, TERMINATED |
| `RiskLevel` | LOW, MEDIUM, HIGH |
| `TrainingStatus` | PENDING, IN_PROGRESS, COMPLETED, EXPIRED |
| `TrainingType` | SECURITY_AWARENESS, ANNUAL_REFRESHER, ROLE_SPECIFIC, INCIDENT_RESPONSE, VENDOR_SECURITY, COMPLIANCE |

---

## 5. Indexing Strategy

All models follow a consistent indexing strategy:

1. **Primary keys** — Auto-generated `cuid()` strings
2. **Foreign keys** — Indexed for join performance
3. **Unique constraints** — On natural keys (email, school code, message control ID)
4. **Composite unique** — `Student (schoolId, studentId, academicYear)` prevents duplicate enrollments
5. **Date columns** — Indexed for time-range queries (`createdAt`, `visitDate`, `recordedAt`)
6. **Status/enum columns** — Indexed for filtered queries (`isActive`, `status`, `severity`)
7. **Search columns** — Indexed for text lookups (`email`, `studentId`)

---

## 6. Prisma Configuration

### Schema Generator

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Connection URL Format

```
postgresql://user:password@host:5432/database?connection_limit=20&pool_timeout=20
```

| Parameter | Recommended Value | Purpose |
|-----------|------------------|---------|
| `connection_limit` | 20–50 | Max pooled connections per PM2 instance |
| `pool_timeout` | 20 | Seconds to wait for a free connection |

### Migration Commands

```bash
npx prisma migrate dev       # Development (creates migration + applies)
npx prisma migrate deploy    # Production (applies pending migrations)
npx prisma generate          # Regenerate Prisma Client after schema changes
npx prisma studio            # Visual database browser (dev only)
npx prisma db seed           # Run seed script (tsx scripts/seed.ts)
```

---

## 7. Data Flow Diagrams

### 7.1 Create Visit Flow

```
Client POST /api/visits
  │
  ├─ Validate auth (JWT + Session)
  ├─ Validate inputs
  │
  ├─ BEGIN TRANSACTION
  │   ├─ INSERT ClinicalVisit
  │   ├─ INSERT ClinicalAssessment (if vitals provided)
  │   ├─ UPDATE Student (lastVisitDate)
  │   └─ INSERT AuditLog
  │
  ├─ Generate HL7 Message (async)
  │   ├─ Build ADT^A01 message
  │   ├─ INSERT HL7Message (status: PENDING)
  │   └─ Queue for transmission
  │
  ├─ Send Parent Email (async, if requested)
  │   ├─ Build HTML from template
  │   ├─ INSERT EmailLog (status: PENDING)
  │   └─ SMTP send → UPDATE EmailLog status
  │
  └─ Return { visit, assessment } JSON
```

### 7.2 Login Flow

```
Client POST /api/auth/login
  │
  ├─ Find User by email
  ├─ Check isActive + lockedUntil
  ├─ bcrypt.compare(password, hash)
  │
  ├─ IF failure:
  │   ├─ INCREMENT failedLoginAttempts
  │   ├─ IF attempts >= 5: SET lockedUntil (+30 min)
  │   ├─ INSERT LoginAttempt (success: false)
  │   ├─ INSERT SecurityEvent (LOGIN_FAILURE)
  │   └─ Return 401
  │
  ├─ IF success:
  │   ├─ RESET failedLoginAttempts
  │   ├─ UPDATE lastLoginAt, lastLoginIp
  │   ├─ CHECK MFA → if enabled, return { requireMfa: true }
  │   ├─ GENERATE JWT token
  │   ├─ INSERT Session
  │   ├─ SET auth-token cookie
  │   ├─ INSERT LoginAttempt (success: true)
  │   ├─ INSERT SecurityEvent (LOGIN_SUCCESS)
  │   └─ Return { user }
```

---

## 8. Backup & Recovery

- **PM2 log rotation**: Automatic via `pm2-logrotate` module
- **Database backup**: Admin can trigger via `POST /api/admin/backup`
- **WAL archiving**: Recommended for PostgreSQL production setup
- **Migration history**: All schema changes tracked in `prisma/migrations/`

