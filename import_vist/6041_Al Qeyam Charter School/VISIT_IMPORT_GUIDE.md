# Visit Import Guide

This guide explains how to prepare files for importing backdated clinical visits into the School Clinic EMR system.

## Supported File Formats

The system supports the following file formats:
- **CSV** (.csv) - Comma-separated values
- **Excel** (.xlsx, .xls) - Microsoft Excel files
- **Text** (.txt) - Text files with delimiters (tab, comma, pipe, or semicolon)

## Required Columns

The following columns are **required** and must have valid data:

| Column Name | Description | Format | Example |
|------------|-------------|--------|---------|
| `Date` | Visit date | DD/MM/YYYY | `01/05/2026` |
| `ESIS No. / STUDENT No.` or `STUDENT No.` | Student number (must match existing student) | Text/Number | `658848` |
| `TIME-IN` | Visit time (optional but recommended) | HH:MM (24-hour format) | `08:54` |

## Optional Columns

The following columns are **optional** and can be left empty:

| Column Name | Description | Format | Example |
|------------|-------------|--------|---------|
| `CHIEF COMPLAINT` | Primary reason for visit | Text | `Diabetic` |
| `ASSESSMENT` | Clinical assessment findings | Text | `Blood Glucose 222 Mg/Dl` |
| `INTERVENTION (TREATMENT)` or `TREATMENT` | Treatment provided | Text | `6 Unit Novorapid Sc` |
| `TO WHOM COMMUNICATED` | Communication details | Text | `Send Back To Class` |
| `EVALUATION` | Clinical evaluation | Text | `Stable condition` |
| `REMARKS` | Additional notes | Text | `Follow up in 2 weeks` |
| `TIME-OUT` | Visit end time | HH:MM | `09:01` |
| `STUDENT NAME` | Student name (for reference, not used for matching) | Text | `Abdalla Fahad Abdalla` |
| `GRADE LEVEL / SECTION` | Grade information (for reference) | Text | `G10-F` |

## Date Format

**Important**: The `Date` field must be in **DD/MM/YYYY** format.

### Valid Date Formats:
- ✅ `01/05/2026` (Recommended - DD/MM/YYYY)
- ✅ `1/5/2026` (Will be normalized)
- ✅ `01-05-2026` (Dash separator accepted)
- ✅ `2026-05-01` (YYYY-MM-DD format also accepted)

### Invalid Date Formats (Will be skipped):
- ❌ `05/01/2026` (MM/DD/YYYY - ambiguous)
- ❌ `01 May 2026` (Text format)
- ❌ Empty or blank
- ❌ `2026/01/05` (YYYY/DD/MM - incorrect)

## Time Format

The `TIME-IN` field should be in **24-hour format (HH:MM)**:

### Valid Time Formats:
- ✅ `08:54` (Recommended)
- ✅ `8:54` (Will be normalized)
- ✅ `14:30` (2:30 PM)
- ✅ `00:00` (Midnight)

### Invalid Time Formats:
- ❌ `8:54 AM` (12-hour format with AM/PM)
- ❌ `8.54` (Dot separator)
- ❌ `854` (No separator)

**Note**: If time is not provided, the system will default to 12:00 PM (noon).

## Student Number Matching

**Critical**: The student number in your import file must **exactly match** an existing student's `studentId` in the system.

- The system will search for students by:
  - `studentId` (student number)
  - `schoolId` (selected school)
  - `isActive = true` (only active students)

- If a student is not found:
  - The visit will be **skipped**
  - An error message will indicate: `Student [number]: Student not found in school [name]`
  - **Solution**: Ensure students are imported first, or verify the student number is correct

## Visit Type Auto-Detection

If visit type is not specified, the system will automatically determine it based on the chief complaint and assessment:

| Keywords | Visit Type |
|----------|------------|
| `injury`, `hurt`, `wound`, `cut`, `bruise` | `INJURY` |
| `vaccination`, `vaccine`, `immunization` | `VACCINATION` |
| `emergency`, `urgent`, `critical` | `EMERGENCY` |
| `follow`, `recheck`, `review` | `FOLLOW_UP` |
| Default (most clinic visits) | `ILLNESS` |

## Duplicate Visit Prevention

The system automatically prevents duplicate visits:
- Checks for existing visits with:
  - Same student
  - Same date/time (within 1 hour window)
  - Same chief complaint
- If duplicate found, the visit will be **skipped** with an error message

## Example CSV File

```csv
Date,TIME-IN,ESIS No. / STUDENT No.,STUDENT NAME,GRADE LEVEL / SECTION,CHIEF COMPLAINT,ASSESSMENT,INTERVENTION (TREATMENT),TO WHOM COMMUNICATED,EVALUATION,REMARKS,TIME-OUT
01/05/2026,08:54,658848,Abdalla Fahad Abdalla,G10-F,Diabetic,Blood Glucose 222 Mg/Dl,6 Unit Novorapid Sc,,Send Back To Class,,09:01
01/05/2026,09:05,769669,Ibrahim Mohamed Abdalla,G11-E,Chest Pain During Breathing,"Clear Chest Sound, Hr 68, Spo2 99, Bp 108/70, Temp 36.7",Voltaren Gel,,Send Back To Class,,09:17
02/05/2026,10:30,658848,Abdalla Fahad Abdalla,G10-F,Follow-up,Blood Glucose 150 Mg/Dl,Continue medication,Parent,Stable condition,Monitor daily,11:00
```

## Column Name Variations

The system accepts various column name formats (case-insensitive, spaces and special characters handled):

- `Date`, `date`, `DATE`, `Visit Date`, `visit date`
- `ESIS No. / STUDENT No.`, `ESIS No`, `STUDENT No.`, `Student Number`, `studentnumber`, `student_id`
- `TIME-IN`, `Time In`, `time-in`, `TIME IN`, `Visit Time`, `visit time`
- `CHIEF COMPLAINT`, `Chief Complaint`, `chiefcomplaint`, `complaint`
- `ASSESSMENT`, `Assessment`, `assessment`, `Clinical Assessment`
- `INTERVENTION (TREATMENT)`, `TREATMENT`, `Treatment`, `Intervention`, `treatment`
- `EVALUATION`, `Evaluation`, `evaluation`
- `REMARKS`, `Remarks`, `remarks`, `Notes`, `notes`

## Text File Format (.txt)

Text files can use any of the following delimiters:
- **Tab** (`\t`) - Tab-delimited (TSV format)
- **Comma** (`,`) - Comma-delimited (CSV format)
- **Pipe** (`|`) - Pipe-delimited
- **Semicolon** (`;`) - Semicolon-delimited

The system will **automatically detect** the delimiter from the header row.

### Example Text File (Tab-delimited):
```
Date	TIME-IN	ESIS No. / STUDENT No.	CHIEF COMPLAINT	ASSESSMENT	TREATMENT
01/05/2026	08:54	658848	Diabetic	Blood Glucose 222 Mg/Dl	6 Unit Novorapid Sc
01/05/2026	09:05	769669	Chest Pain	Clear Chest Sound	Voltaren Gel
```

### Example Text File (Pipe-delimited):
```
Date|TIME-IN|ESIS No. / STUDENT No.|CHIEF COMPLAINT|ASSESSMENT|TREATMENT
01/05/2026|08:54|658848|Diabetic|Blood Glucose 222 Mg/Dl|6 Unit Novorapid Sc
01/05/2026|09:05|769669|Chest Pain|Clear Chest Sound|Voltaren Gel
```

## Import Process

1. **Prepare your file** (CSV, Excel, or Text) following the format above
2. **Ensure students exist** in the system (import students first if needed)
3. **Log in** to the EMR system
4. **Navigate** to: Import → Visits
5. **Select** your school (auto-selected for non-admin users)
6. **Upload** your file (CSV, Excel, or Text)
7. **Review** the import results:
   - ✅ Successfully imported visits
   - ⚠️ Skipped visits (with reasons)
   - ❌ Processing errors

## Data Mapping

The system maps CSV columns to visit fields as follows:

| CSV Column | Visit Field | Notes |
|-----------|-------------|-------|
| `Date` + `TIME-IN` | `visitDate` | Combined into single datetime |
| `CHIEF COMPLAINT` | `chiefComplaint` | Primary reason for visit |
| `ASSESSMENT` | `notes` | Combined with evaluation and remarks |
| `EVALUATION` | `diagnosis` | Clinical diagnosis/evaluation |
| `INTERVENTION (TREATMENT)` | `treatment` | Treatment provided |
| `REMARKS` | `notes` | Added to notes section |
| Auto-detected | `visitType` | Based on chief complaint keywords |

## Common Issues and Solutions

### Issue: "Student not found in school"
**Solution**: 
- Verify the student number matches exactly (no extra spaces)
- Ensure the student has been imported to the system first
- Check that the student is active (`isActive = true`)
- Verify you selected the correct school

### Issue: "Invalid visit date format"
**Solution**: 
- Ensure dates are in DD/MM/YYYY format (e.g., `01/05/2026`)
- Check for extra spaces or special characters
- Verify date values are not empty

### Issue: "Visit already exists"
**Solution**: 
- This means a visit with the same student, date/time, and chief complaint already exists
- The system prevents duplicates automatically
- If you need to import it anyway, modify the date/time slightly or remove the existing visit first

### Issue: "Missing required fields"
**Solution**: 
- Ensure `Date` and `ESIS No. / STUDENT No.` columns have data
- Empty required fields will cause the row to be skipped

### Issue: "No valid visit data found"
**Solution**: 
- Check that your file has a header row
- Verify at least one row has both date and student number
- Ensure the file format is supported (CSV, Excel, or Text)

## Tips for Successful Import

1. ✅ Use **DD/MM/YYYY** format for dates (e.g., `01/05/2026`)
2. ✅ Use **24-hour time format** for TIME-IN (e.g., `08:54`)
3. ✅ Ensure students are imported **before** importing visits
4. ✅ Verify student numbers match exactly (case-sensitive, no spaces)
5. ✅ Check for special characters in column headers (the system handles these automatically)
6. ✅ Save files with **UTF-8 encoding** to avoid character issues
7. ✅ Remove empty rows at the end of the file
8. ✅ Test with a small sample file first (5-10 records)
9. ✅ For text files, use consistent delimiters throughout the file
10. ✅ Ensure the first row contains column headers
11. ✅ Use quotes around values containing commas (CSV format)
12. ✅ Verify the selected school matches the students' school

## File Size Recommendations

- Maximum recommended: 1000-2000 visits per file
- For larger imports, split into multiple files
- Processing time: ~1-2 seconds per 100 visits
- Large files may take several minutes to process

## Visit Display After Import

Once imported, visits will:
- ✅ Appear in the student's visit history
- ✅ Be visible when viewing the student profile
- ✅ Show up when entering new visits for the same student
- ✅ Be included in visit reports and statistics
- ✅ Be sorted chronologically (newest first by default)

## Backdating Visits

This import feature is specifically designed for **backdating visits**:
- Visits can have dates in the past
- The system preserves the original visit date and time
- All visits (backdated and new) are shown together in chronological order
- No restrictions on how far back dates can be

## Support

If you encounter issues:
1. Check the error messages in the import results
2. Verify your CSV format matches the examples above
3. Ensure dates are in DD/MM/YYYY format
4. Verify student numbers match existing students
5. Check that you selected the correct school
6. Contact system administrator if problems persist

---

**Last Updated**: 2026-01-21
**System Version**: School Clinic EMR v1.0
**Feature**: Backdated Visit Import

