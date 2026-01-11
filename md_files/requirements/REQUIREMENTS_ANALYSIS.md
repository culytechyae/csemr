# School Clinic Data Elements - Requirements Analysis

## Comparison: Required vs. Implemented

Based on the **School Clinic Data Elements.pdf** document, here's a comprehensive analysis of what's implemented and what's missing.

---

## ✅ IMPLEMENTED FIELDS

### School Information
| # | Field | Status | Location |
|---|-------|--------|----------|
| 1 | School Region | ⚠️ **Partial** | Not explicitly stored (could be in address) |
| 2 | School Name | ✅ **Implemented** | `School.name` |

### Student Demographics (ADT Interface)
| # | Field | Status | Location |
|---|-------|--------|----------|
| 4 | Student Number | ✅ **Implemented** | `Student.studentId` |
| 5 | Student EID | ⚠️ **Missing** | Not stored separately (using studentId) |
| 6 | Register Date | ✅ **Implemented** | `Student.enrolledAt` |
| 7 | DOB | ✅ **Implemented** | `Student.dateOfBirth` |
| 8 | Age At Visit | ✅ **Calculated** | Calculated from DOB at visit time |
| 9 | Gender | ✅ **Implemented** | `Student.gender` (MALE/FEMALE) |
| 10 | Nationality | ✅ **Implemented** | `Student.nationality` |

### Vital Signs (ORU-VITALS Interface)
| # | Field | Status | Location |
|---|-------|--------|----------|
| 12 | Height | ✅ **Implemented** | `ClinicalAssessment.height` (cm) |
| 15 | Weight | ✅ **Implemented** | `ClinicalAssessment.weight` (kg) |
| 16 | BMI | ✅ **Implemented** | `ClinicalAssessment.bmi` (calculated) |
| 19 | Systolic BP | ✅ **Implemented** | `ClinicalAssessment.bloodPressureSystolic` |
| 20 | Diastolic BP | ✅ **Implemented** | `ClinicalAssessment.bloodPressureDiastolic` |

### General Clinical Fields
| # | Field | Status | Location |
|---|-------|--------|----------|
| 32 | Chronic disease | ✅ **Implemented** | `Student.chronicConditions` |

---

## ❌ MISSING FIELDS

### Student Information
| # | Field | Required | Interface | Priority |
|---|-------|----------|-----------|----------|
| 3 | Grade | ❌ **Missing** | - | High |
| 5 | Student EID | ❌ **Missing** | ADT | High (separate from studentId) |
| 11 | General consent available/signed | ❌ **Missing** | - | Medium |

### Vital Signs & Measurements (ORU-VITALS)
| # | Field | Required | Interface | Priority |
|---|-------|----------|-----------|----------|
| 13 | Waist Measurement | ❌ **Missing** | ORU-VITALS | High |
| 14 | Did the student have breakfast this morning | ❌ **Missing** | - | Medium |
| 17 | Z score | ❌ **Missing** | - | High |
| 18 | Z Score Interpretation | ❌ **Missing** | - | High |
| 21 | Results Interpretation (BP) | ❌ **Missing** | - | Medium |

### Vision & Diagnostics (ORU-DIAGNOSTICS)
| # | Field | Required | Interface | Priority |
|---|-------|----------|-----------|----------|
| 22 | Color blindness | ❌ **Missing** | ORU-DIAGNOSTICS | High |
| 23 | Vision Testing Performed | ❌ **Missing** | - | High |
| 24 | Corrective Lenses | ❌ **Missing** | ORU-DIAGNOSTICS | High |
| 25 | Right eye | ❌ **Missing** | ORU-DIAGNOSTICS | High |
| 26 | Left eye | ❌ **Missing** | ORU-DIAGNOSTICS | High |
| 27 | Right eye with Corrective lenses | ❌ **Missing** | ORU-DIAGNOSTICS | High |
| 28 | Left eye with Corrective lenses | ❌ **Missing** | ORU-DIAGNOSTICS | High |
| 29 | Vision screening results | ❌ **Missing** | ORU-DIAGNOSTICS | High |

### Referrals & Follow-up
| # | Field | Required | Interface | Priority |
|---|-------|----------|-----------|----------|
| 30 | Referral | ⚠️ **Partial** | - | Medium (followUpRequired exists) |
| 31 | Referral to | ❌ **Missing** | - | Medium |

---

## 📊 SUMMARY STATISTICS

- **Total Required Fields**: 32
- **Fully Implemented**: 11 (34%)
- **Partially Implemented**: 3 (9%)
- **Missing**: 18 (56%)

### By Interface Category:
- **ADT Interface**: 5/6 fields (83%) ✅
- **ORU-VITALS Interface**: 5/8 fields (63%) ⚠️
- **ORU-DIAGNOSTICS Interface**: 0/8 fields (0%) ❌
- **PPR Interface**: 1/1 fields (100%) ✅

---

## 🚨 CRITICAL MISSING FIELDS

### High Priority (Required for Compliance)
1. **Grade** - Student grade level
2. **Student EID** - Emirates ID (separate from studentId)
3. **Waist Measurement** - Required for ORU-VITALS
4. **Z score** - BMI Z-score calculation
5. **Z Score Interpretation** - Based on age groups
6. **Vision Testing Fields** (8 fields) - Complete vision screening module
7. **Color Blindness** - Vision diagnostic

### Medium Priority
1. **General Consent** - Consent tracking
2. **Breakfast Status** - Morning visit context
3. **BP Results Interpretation** - Normal/Abnormal
4. **Referral Details** - Where to refer

---

## 🔧 RECOMMENDED IMPLEMENTATION PLAN

### Phase 1: Critical Missing Fields (High Priority)
1. Add `grade` field to `Student` model
2. Add `emiratesId` (EID) field to `Student` model
3. Add vision testing fields to `ClinicalAssessment`:
   - `colorBlindness` (Normal/Abnormal)
   - `visionTestingPerformed` (Yes/No)
   - `visionTestingNotPerformedReason` (if No)
   - `correctiveLenses` (enum: None, Glasses, Contact lenses, Surgical correction, Other)
   - `correctiveLensesOtherReason` (if Other)
   - `rightEye` (vision acuity)
   - `leftEye` (vision acuity)
   - `rightEyeWithCorrection` (vision acuity)
   - `leftEyeWithCorrection` (vision acuity)
   - `visionScreeningResult` (Normal/Abnormal)

4. Add waist measurement to `ClinicalAssessment`:
   - `waistMeasurement` (Float, cm)

5. Add Z-score calculation and interpretation:
   - `zScore` (Float)
   - `zScoreInterpretation` (enum based on age groups)

### Phase 2: Additional Fields (Medium Priority)
1. Add consent tracking to `Student`:
   - `generalConsentAvailable` (Boolean)
   - `generalConsentSigned` (Boolean)
   - `consentSignedDate` (DateTime)

2. Add visit context to `ClinicalVisit`:
   - `breakfastStatus` (Yes/No)

3. Enhance referral system:
   - `referralTo` (String) - where to refer
   - Enhance `followUpRequired` with more details

4. Add BP interpretation:
   - `bloodPressureInterpretation` (Normal/Abnormal)

---

## 📝 NOTES

1. **Student EID vs Student Number**: The document distinguishes between:
   - Student Number (school-specific ID) - ✅ Implemented as `studentId`
   - Student EID (Emirates ID) - ❌ Missing - needs separate field

2. **Z-Score Calculation**: Requires age-based calculation with different thresholds:
   - Ages 2-5 years
   - Ages 5-19 years  
   - Ages 19+ years

3. **Vision Acuity Values**: Need to support the full list:
   - 6/3, 6/3.8, 6/4.8, 6/6, 6/7.5, 6/9.5, 6/12, 6/15, 6/19, 6/24, 6/30, 6/38, 6/48, 6/60

4. **HL7 Interface Mapping**: Ensure all ORU-DIAGNOSTICS fields are included in HL7 message generation.

---

## ✅ NEXT STEPS

1. **Review this analysis** with stakeholders
2. **Prioritize missing fields** based on compliance requirements
3. **Create database migration** for Phase 1 fields
4. **Update UI forms** to capture new fields
5. **Update HL7 message generation** to include new fields in appropriate segments
6. **Add validation logic** for Z-score calculations and vision screening results

