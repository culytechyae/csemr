# Student Import Guide

This guide explains how to prepare files for importing students into the School Clinic EMR system.

## Supported File Formats

The system supports the following file formats:
- **CSV** (.csv) - Comma-separated values
- **Excel** (.xlsx, .xls) - Microsoft Excel files
- **Text** (.txt) - Text files with delimiters (tab, comma, pipe, or semicolon)

## Required Columns

The following columns are **required** and must have valid data:

| Column Name | Description | Format | Example |
|------------|-------------|--------|---------|
| `studentId` | Unique student identifier | Text/Number | `308002` |
| `firstName` | Student's first name | Text | `Shaikha` |
| `lastName` | Student's last name | Text | `Alnuaimi` |
| `dateOfBirth` | Date of birth | YYYY-MM-DD | `2009-02-20` |
| `gender` | Gender | MALE or FEMALE | `FEMALE` |
| `parentName` | Parent/Guardian name | Text | `MUHSEN ALNUAIMI` |
| `parentPhone` | Parent phone number | Text/Number | `504737366` |
| `emergencyContact` | Emergency contact name | Text | `ASMA ALJUNAIDI` |
| `emergencyPhone` | Emergency contact phone | Text/Number | `554737366` |

## Optional Columns

The following columns are **optional** and can be left empty:

| Column Name | Description | Format | Example |
|------------|-------------|--------|---------|
| `nationality` | Student nationality | Text | `UAE` |
| `bloodType` | Blood type | A_POSITIVE, A_NEGATIVE, B_POSITIVE, B_NEGATIVE, AB_POSITIVE, AB_NEGATIVE, O_POSITIVE, O_NEGATIVE | `A_POSITIVE` |
| `grade` | Student grade level | Text/Number | `12` |
| `homeroom` | Homeroom class | Text | `G12G-E` |
| `studetnemiratesid` or `studentEmiratesId` | UAE Emirates ID | Text/Number | `784200904051396` |
| `parentEmail` | Parent email address | Valid email | `parent@example.com` |
| `address` | Student address | Text | `Abu Dhabi, UAE` |
| `allergies` | Known allergies | Text | `Peanuts, Shellfish` |
| `chronicConditions` | Chronic medical conditions | Text | `Asthma` |
| `medications` | Current medications | Text | `Inhaler` |

## Date Format

**Important**: The `dateOfBirth` must be in **YYYY-MM-DD** format.

### Valid Date Formats:
- ✅ `2009-02-20` (Recommended)
- ✅ `2009-2-20` (Will be normalized)
- ✅ `2009/02/20` (Will be converted)

### Invalid Date Formats (Will be skipped):
- ❌ `20-02-2009` (DD-MM-YYYY)
- ❌ `02/20/2009` (MM/DD/YYYY)
- ❌ `20 Feb 2009` (Text format)
- ❌ Empty or blank

## Gender Format

The `gender` field accepts:
- `MALE` or `M` → Will be converted to `MALE`
- `FEMALE` or `F` → Will be converted to `FEMALE`
- Case insensitive

## Email Validation

- Valid emails will be stored
- Invalid emails will be skipped (field will be empty)
- Empty email fields are allowed

## Missing Data Handling

### Required Fields:
If required fields are missing or empty, the system will:
- Use default value `"Not Provided"` for: `parentName`, `parentPhone`, `emergencyContact`, `emergencyPhone`
- **Skip the record** if: `studentId`, `firstName`, `lastName`, or `dateOfBirth` is missing or invalid

### Optional Fields:
- Empty optional fields are allowed and will be stored as `null` in the database

## Example CSV File

```csv
studentId,firstName,lastName,dateOfBirth,gender,nationality,grade,homeroom,studetnemiratesid,parentName,parentPhone,parentEmail,emergencyContact,emergencyPhone,address,allergies,chronicConditions,medications
308002,Shaikha,Alnuaimi,2009-02-20,FEMALE,UAE,12,G12G-E,784200904051396,MUHSEN ALNUAIMI,504737366,parent@example.com,ASMA ALJUNAIDI,554737366,Abu Dhabi,None,None,None
667325,Maryam,Attaelemam,2009-03-25,FEMALE,Egypt,11,G11G-A,784200974380600,MOHAMMED ELEMAM,559414358,parent2@example.com,NAGLAA ELSHORBAGE,527227592,Cairo,Peanuts,None,None
628994,Faisal,Alkhalaqi,2010-11-12,MALE,UAE,10,G10B-F,784201052095912,NAWFAL ALKHALAQI,506663557,parent3@example.com,ABRAR ALDHRI,505365969,Abu Dhabi,None,Asthma,Inhaler
```

## Column Name Variations

The system accepts various column name formats (case-insensitive, spaces removed):

- `studentId`, `studentid`, `student id`, `Student ID`
- `firstName`, `firstname`, `first name`, `First Name`
- `dateOfBirth`, `dateofbirth`, `date of birth`, `DOB`, `dob`
- `studetnemiratesid` or `studentEmiratesId` (handles typo in original file)

## Text File Format (.txt)

Text files can use any of the following delimiters:
- **Tab** (`\t`) - Tab-delimited (TSV format)
- **Comma** (`,`) - Comma-delimited (CSV format)
- **Pipe** (`|`) - Pipe-delimited
- **Semicolon** (`;`) - Semicolon-delimited

The system will **automatically detect** the delimiter from the header row.

### Example Text File (Tab-delimited):
```
studentId	firstName	lastName	dateOfBirth	gender	nationality
308002	Shaikha	Alnuaimi	2009-02-20	FEMALE	UAE
667325	Maryam	Attaelemam	2009-03-25	FEMALE	Egypt
```

### Example Text File (Pipe-delimited):
```
studentId|firstName|lastName|dateOfBirth|gender|nationality
308002|Shaikha|Alnuaimi|2009-02-20|FEMALE|UAE
667325|Maryam|Attaelemam|2009-03-25|FEMALE|Egypt
```

## Import Process

1. **Prepare your file** (CSV, Excel, or Text) following the format above
2. **Log in** to the EMR system
3. **Navigate** to: Import → Students
4. **Select** your school and academic year
5. **Upload** your file (CSV, Excel, or Text)
6. **Review** the import results:
   - ✅ Successfully imported records
   - ⚠️ Skipped records (with reasons)
   - ❌ Processing errors

## Common Issues and Solutions

### Issue: "Invalid date of birth"
**Solution**: Ensure dates are in YYYY-MM-DD format (e.g., `2009-02-20`)

### Issue: "Missing required fields"
**Solution**: Ensure all required columns have data. Empty required fields will use defaults or skip the record.

### Issue: "Invalid email"
**Solution**: Invalid emails are automatically skipped (field will be empty). Fix email format or leave empty.

### Issue: "Student already exists"
**Solution**: The system will update existing students with the same `studentId` and `academicYear`. This is expected behavior.

## Tips for Successful Import

1. ✅ Use **YYYY-MM-DD** format for dates
2. ✅ Ensure all required fields have data
3. ✅ Use proper email format for `parentEmail` (or leave empty)
4. ✅ Check for special characters in column headers (the system handles these automatically)
5. ✅ Save files with **UTF-8 encoding** to avoid character issues
6. ✅ Remove empty rows at the end of the file
7. ✅ Test with a small sample file first (5-10 records)
8. ✅ For text files, use consistent delimiters throughout the file
9. ✅ Ensure the first row contains column headers
10. ✅ Avoid using the delimiter character within data values (use quotes if necessary)

## File Size Recommendations

- Maximum recommended: 2000-3000 records per file
- For larger imports, split into multiple files
- Processing time: ~1-2 seconds per 100 records

## Support

If you encounter issues:
1. Check the error messages in the import results
2. Verify your CSV format matches the examples above
3. Ensure dates are in YYYY-MM-DD format
4. Contact system administrator if problems persist

---

**Last Updated**: 2025-02-10
**System Version**: School Clinic EMR v1.0

