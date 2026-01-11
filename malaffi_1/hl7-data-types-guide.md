# HL7 Data Types Guide

This guide provides comprehensive information about HL7 data types to help resolve validation errors in MODAQEQ and other HL7 validation tools.

## Overview

HL7 data types define the structure, length, and expected content for various fields and components in HL7 messages. Understanding these data types is crucial for generating compliant HL7 messages that pass validation.

## Data Types Reference

### AD - Address
**Purpose**: Specifies the address of a person, place, or organization.

| Field | Data Type | Length | Code Set | Example | Remarks |
|-------|-----------|--------|----------|---------|---------|
| Street Name | ST | No max | | 10 ASH LN^#3^LIMA^OH^48132 | The Address (AD) data type specifies the address of a person, place, or organization. |
| Street Address | ST | No max | | | |
| Other Designation | ST | No max | | | |
| City | ST | No max | | | |
| State Or Province | ST | No max | | | |
| Zip Or Postal Code | ST | No max | | | |
| Country | ID | No max | | | |
| Address Type | ID | No max | | | |
| Other Geographic Designation | ST | No max | | | |

### AUI - Authorization Information
**Purpose**: Specifies the identifier or code for an insurance authorization instance and its associated detail.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Authorization Number | ST | 30 | | Identifier for the authorization. | |
| Date | DT | 8 | | | |
| Source | ST | 199 | | | |

### CE - Coded Element
**Purpose**: Transmits codes and the text associated with the codes.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Identifier | ST | 50 | | Code that uniquely identifies the item being referenced by Text. | 0134173^Wound cleaned^SNM |
| Text | ST | 2000 | | Descriptive name of the Identifier. | |
| Name of Coding System | ID | 200 | | Coding system used in the Identifier component. | |
| Alternate Identifier | ST | 50 | | Alternative code that uniquely identifies the item. | |
| Alternate Text | ST | 2000 | | Descriptive name of the Alternate Identifier. | |
| Name of Alternate Coding System | ID | 200 | | Coding system used in the Alternate Identifier component. | |

### CNE - Coded with No Exceptions
**Purpose**: Used for mandatory coded fields. A CNE field must have an HL7-defined or external table associated with it.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Identifier | ST | 20 | | Code that uniquely identifies the item being referenced by Text. | V^Verbal^HL70497^^^^2.8 |
| Text | ST | 199 | | Descriptive name of the Identifier. | |
| Name of Coding System | ID | 20 | | Coding system used in the Identifier component. | |
| Alternate Identifier | ST | 20 | | Alternative code that uniquely identifies the item. | |
| Alternate Text | ST | 199 | | Descriptive name of the Alternate Identifier. | |
| Name of Alternate Coding System | ID | 20 | | Coding system used in the Identifier component. | |
| Coding System Version ID | ST | 10 | | | |
| Alternate Coding System Version ID | ST | 10 | | | |
| Original Text | ST | 199 | | | |

### CNN - Composite ID Number and Name Simplified
**Purpose**: Specifies a person using both an identifier and the person's name.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| ID Number | ST | 15 | | | 1234^Admit^Alan^A^III^Dr^MD^^DOC^2.16.840.1.113883.19.4.6^ISO |
| Family Name | ST | 50 | | | |
| Given Name | ST | 30 | | | |
| Middle Initial or Name | ST | 30 | | | |
| Suffix | ST | 20 | | | |
| Prefix | ST | 20 | | | |
| Degree | IS | 5 | | | |
| Source Table | IS | 4 | | | |
| Assigning Authority Namespace ID | IS | 20 | | | |
| Assigning Authority Universal ID | ST | 199 | | | |
| Assigning Authority Universal ID Type | ID | 6 | | | |

### CP - Composite Price
**Purpose**: Often used to define a repeating field within a given segment.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Price | MO | 20 | | | 100.00&USD^UP^0^9^min^P~50.00&USD^UP^10^59^min^P |
| Price Type | ID | 2 | | | |
| From Value | NM | 16 | | | |
| To Value | NM | 16 | | | |
| Range Units | CE | 483 | | | |
| Range Type | ID | 1 | | | |
| Message Structure | ID | 7 | | | |

### CQ - Composite Quantity with Units
**Purpose**: Specifies a quantity and the units in which the quantity is expressed.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Quantity | NM | 16 | | | 150^m&meter&UCUM |
| Units | CE | 483 | | | |

### CWE - Coded with Exceptions
**Purpose**: Used when any of the following occurs:
- More than one table may apply
- The specified HL7 or externally-defined table may be extended with local values
- When Text is present and the Identifier may be omitted

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Identifier | ST | 20 | | | G44.1^Headache^I10^^^^^^generalheadache^^^^^2.16.840.1.113883.6.3 |
| Text | ST | 199 | | | |
| Name of Coding System | ID | 20 | | | |
| Alternate Identifier | ST | 20 | | | |
| Alternate Text | ST | 199 | | | |
| Name of Alternate Coding System | ID | 20 | | | |
| Coding System Version ID | ST | 10 | | | |
| Alternate Coding System Version ID | ST | 10 | | | |
| Original Text | ST | 199 | | | |

### CX - Extended Composite ID with Check Digit
**Purpose**: Specifies an identifier and its associated administrative detail.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| ID Number | ST | 50 | | | 1234567^4^M11^ADT01^MR^University Hospital |
| Check Digit | ST | 1 | | | |
| Check Digit Scheme | HD | 3 | | | |
| Assigning Authority | HD | 92 | | Unique name of the system creating the data. | |
| Identifier Type Code | ID | 50 | | May be used as a qualifier to Assigning Authority. | |
| Assigning Facility | HD | 92 | | | |
| Effective Date | DT | 8 | | | |
| Expiration Date | DT | 8 | | | |
| Assigning Jurisdiction | CWE | 705 | | | |
| Assigning Agency or Department | CWE | 705 | | | |

### DDI - Daily Deductible Information
**Purpose**: Specifies the details for the daily deductible.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Delay Days | NM | 3 | | | |
| Monetary Amount | MO | 16 | | | |
| Number Of Days | NM | 4 | | | |

### DLD - Discharge Location and Date
**Purpose**: Specifies the healthcare facility and the date when the patient was discharged.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Discharge Location | IS | 20 | | | |
| Effective Date | TS | 26 | | | |

### DLN - Driver's License Number
**Purpose**: Contains driver's license information.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| License Number | ST | 20 | | | |
| Issuing State Province Country | IS | 20 | | | |
| Expiration Date | DT | 24 | | | |

### DR - Date/Time Range
**Purpose**: Specifies a timeframe.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Range Start Date Time | TS | 26 | | | 20150612&20160528 |
| Range End Date Time | TS | 26 | | | |

### DT - Date
**Purpose**: Specifies the century and year with an optional precision of month and day.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Year | 2 Byte Short | 4 | | | 19880704 (July 4, 1988) |
| Month | 2 Byte Short | 2 | | | 199503 (March 1995) |
| Day | 2 Byte Short | 2 | | | |

### DTM - Date/Time
**Purpose**: Specifies a point in time using a 24-hour clock notation.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Year | 2 Byte Short | 4 | | | 19760704010159-0500 |
| Month | 2 Byte Short | 2 | | | |
| Day | 2 Byte Short | 2 | | | |
| Hours | 2 Byte Short | 2 | | | |
| Minutes | 2 Byte Short | 2 | | | |
| Seconds | 2 Byte Short | 2 | | | |
| Milliseconds | 2 Byte Short | 3 | | | |
| GMT Offset | ST | 5 | | | |

### ED - Encapsulated Data
**Purpose**: Transmits data from a source system to a destination system.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Source Application | HD | 227 | | | |
| Type of Data | ID | 9 | | | |
| Data Sub-type | ID | 18 | | | |
| Encoding | ID | 6 | | | |
| Data | TX | No max | | | |

### EI - Entity Identifier
**Purpose**: Defines a given entity within a specified series of identifiers.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Entity Identifier | ST | 199 | | | 72740541^USHCFA^SYS_A |
| Namespace ID | IS | 20 | | | |
| Universal ID | ST | 199 | | | |
| Universal ID Type | ID | 6 | | | |

### EIP - Entity Identifier Pair
**Purpose**: Specifies an identifier assigned to an entity by either the placer or filler system.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Placer Assigned Identifier | EI | 427 | | | ABC049&&CANNS^ABC049&&CANNS |
| Filler Assigned Identifier | EI | 427 | | | |

### FC - Financial Class
**Purpose**: Contains the financial class that is assigned to a person.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Financial Class Code | IS | 20 | | | |
| Effective Date | TS | 26 | | | |

### FN - Family Name
**Purpose**: Specifies the last name of a person.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Surname | ST | 40 | | | de Mum-van Haan&de&Mum&van&Haan |
| Own Surname Prefix | ST | 20 | | | |
| Own Surname | ST | 40 | | | |
| Surname Prefix from Partner | ST | 20 | | | |
| Surname from Partner | ST | 40 | | | |

### FT - Formatted Text Data
**Purpose**: A data type derived from the String data type by allowing the addition of embedded formatting instructions.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Text | ST | No max | | | "The cardiomediastinal silhouette is now within normal limits..." |

### HD - Hierarchic Designator
**Purpose**: Used to identify objects such as applications or facilities.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Namespace ID | IS | 64 | | | 1.2.34.4.1.5.1.5.1,1.13143143.131.3131.1^ISO |
| Universal ID | ST | 64 | | | |
| Universal ID Type | ID | 6 | | | |

### ID - Coded Values for HL7 Tables
**Purpose**: Standard HL7 table codes.

### IS - Coded Value for User-defined Tables
**Purpose**: User-defined table codes.

### JCC - Job Code/Class
**Purpose**: Contains a person's job code, description, and employee classification.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Job Code | IS | 20 | | | 1^F^Administrator |
| Job Class | IS | 20 | | | |
| Job Description Text | TX | 250 | | | |

### LA1 - Location with Address Variation 1
**Purpose**: Specifies a location and its address.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Point of Care | IS | No max | | | |
| Room | IS | No max | | | |
| Bed | IS | No max | | | |
| Facility | HD | No max | | | |
| Location Status | IS | No max | | | |
| Patient Location Type | IS | No max | | | |
| Building | IS | No max | | | |
| Floor | IS | No max | | | |
| Address | AD | No max | | | |

### LA2 - Location with Address Variation 2
**Purpose**: Specifies a location and its address.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Point of Care | IS | No max | | | |
| Room | IS | No max | | | |
| Bed | IS | No max | | | |
| Facility | HD | No max | | | |
| Location Status | IS | No max | | | |
| Patient Location Type | IS | No max | | | |
| Building | IS | No max | | | |
| Floor | IS | No max | | | |
| Street Address | ST | No max | | | |
| Other Designation | ST | No max | | | |
| City | ST | No max | | | |
| State or Province | ST | No max | | | |
| Zip or Postal Code | ST | No max | | | |
| Country | ID | No max | | | |
| Address Type | ID | No max | | | |
| Other Geographic Designation | ST | No max | | | |

### MO - Money
**Purpose**: Specifies an amount of money and the denomination in which it is expressed.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Quantity | NM | 16 | | | 99.50^USD |
| Denomination | ID | No max | | See ISO 4217 for recommended values. | |

### MOC - Money and Code
**Purpose**: Transmits monetary information and the associated charge code for the services performed.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Monetary Amount | MO | 20 | | | |
| Charge Code | CE | No max | | | |

### MSG - Message Type
**Purpose**: Contains the type of message being transmitted, the trigger event, and the message structure ID.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Message Code | ID | 3 | | For recommended values, see HL70076. | ORU^R01^ORU_R01 |
| Trigger Event | ID | 3 | | For recommended values, see HL70003. | VXU^V04 |

### NDL - Name with Date and Location
**Purpose**: Specifies the name of the person who performs the service as well as when and where the service was performed.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Name | CNN | 406 | | | |
| Start Date Time | TS | 26 | | | |
| End Date Time | TS | 26 | | | |
| Point of Care | IS | 20 | | | |
| Room | IS | 20 | | | |
| Bed | IS | 20 | | | |
| Facility | HD | 227 | | | |
| Location Status | IS | 20 | | | |
| Patient Location Type | IS | 20 | | | |
| Building | IS | 20 | | | |
| Floor | IS | 20 | | | |

### NM - Numeric
**Purpose**: Numeric values.

### PL - Person Location
**Purpose**: Used to specify a patient's location within the healthcare institution.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Point of Care | IS | 20 | | | 4E^136^B^CommunityHospital^^N^^^ |
| Room | IS | 20 | | | |
| Bed | IS | 20 | | | |
| Facility | HD | 227 | | | |
| Location Status | IS | 20 | | | |
| Person Location Type | IS | 20 | | See HL70305 for recommended values. | |
| Building | IS | 20 | | | |
| Floor | IS | 20 | | | |
| Location Description | ST | 199 | | | |
| Comprehensive Location Identifier | EI | 427 | | | |
| Assigning Authority for Location | HD | 227 | | | |

### PRL - Parent Result Link
**Purpose**: Uniquely identifies the parent result's OBX segment that is related to the current order.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Parent Observation Identifier | CE | 483 | | | Glucose^Glucose^L&hba1c&6.4 |
| Parent Observation Sub-identifier | ST | 20 | | | |
| Parent Observation Value Descriptor | TX | 250 | | | |

### PT - Processing Type
**Purpose**: Specifies if a message needs to be processed as defined in the HL7 Application processing rules.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Processing ID | ID | 1 | | See HL70103 for recommended values. | P |
| Processing Mode | ID | 1 | | See HL70207 for recommended values. | |

### PTA - Policy Type and Amount
**Purpose**: Specifies the policy type and the amount that is covered by insurance.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Policy Type | IS | 5 | | See HL70147 for recommended values. | |
| Amount Class | IS | 9 | | See HL70193 for recommended values. | |
| Amount | NM | 16 | | | |
| Money or Percentage | MOP | 23 | | | |

### RI - The Repeat Interval
**Purpose**: Contains the interval between repeated services.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Repeat Pattern | IS | No max | | See HL70335 for recommended values. | BID QOD |
| Explicit Time Interval | ST | No max | | | QID^0230,0830,1430,2030 |

### RMC - Room Coverage
**Purpose**: Specifies the insurance coverage details for a room.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Room Type | IS | 20 | | See HL70145 for recommended values. | |
| Amount Type | IS | 20 | | See HL70146 for recommended values. | |
| Coverage Amount | NM | 16 | | | |
| Money or Percentage | MOP | 23 | | | |

### RP - Reference Pointer
**Purpose**: Transmits information about the data stored on another system.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Pointer | ST | 15 | | | |
| Application ID | HD | 227 | | | /cdasvc/u28864099/s9076500a/e77534/d55378.xml^&ftp://www.saintelsewhere.org&URI^text^x-hl7-cda-level-one |
| Type of Data | ID | 9 | | See HL70834 for recommended values. | |
| Sub-type | ID | No max | | See HL70291 for recommended values. | |

### SAD - Street Address
**Purpose**: Specifies an entity's street address and associated detail.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Street or Mailing Address | ST | 100 | | | 840 Chester Ave |
| Street Name | ST | 40 | | | |
| Dwelling Number | ST | 10 | | | |

### SI - Sequence ID
**Purpose**: Sequence identifiers.

### SN - Structured Numeric
**Purpose**: Used to unambiguously express numeric clinical results along with qualifications.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Comparator | ST | 2 | | | >^100 (Greater than 100) |
| Num1 | NM | 15 | | | |
| Separator Suffix | ST | 1 | | | |
| Num2 | NM | 15 | | | |

### SPS - Specimen Source
**Purpose**: Identifies the site where the specimen should be obtained from or where the service should be performed.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Specimen Source Name or Code | CWE | No max | | | |
| Additives | CWE | No max | | | |
| Specimen Collection Method | TX | No max | | | |
| Body Site | CWE | No max | | | |
| Site Modifier | CWE | No max | | | |
| Collection Method Modifier Code | CWE | No max | | | |
| Specimen Role | CWE | No max | | | |

### ST - String
**Purpose**: String data.

### TM - Time
**Purpose**: Specifies the hour of the day with optional minutes, seconds, and the fraction of a second using a 24-hour clock notation and time zone.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Hours | 2 Byte Short | 2 | | | 13 (1 p.m. local time) |
| Minutes | 2 Byte Short | 2 | | | |
| Seconds | 2 Byte Short | 2 | | | |
| Milliseconds | 2 Byte Short | 3 | | | |
| GMT Offset | ST | 5 | | | |

### TQ - Timing Quantity
**Purpose**: Describes when and how frequently a service should be performed.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Quantity | CQ | 267 | | | |
| Interval | RI | 206 | | | |
| Duration | ST | No max | | | |
| Start Date Time | TS | 26 | | | |
| End Date Time | TS | 26 | | | |
| Priority | ST | No max | | | |
| Condition | ST | 199 | | | |
| Text | TX | 200 | | | |
| Conjunction | ID | 1 | | | |
| Order Sequencing | OSD | 110 | | | |
| Occurrence Duration | CE | 483 | | | |
| Total Occurrences | NM | 4 | | | |

### TS - Time Stamp
**Purpose**: Contains the date and time of an event.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Time | ST | 24 | | | 19760704010159-0600 |
| Precision | ST | 1 | | Ignored for date of birth and death. | |

### TX - Text Data
**Purpose**: Text data.

### VID - Version Identifier
**Purpose**: Specifies the HL7 version.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Version ID | ID | 5 | | Malaffi solutions recommend and use version 2.5.1 as the default HL7 version. | 2.5.1 |
| Internationalization Code | CE | 483 | | | |
| International Version ID | CE | 483 | | | |

### XAD - Extended Address
**Purpose**: Specifies the address of a person, place, or organization, and associated information.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Street Address | SAD | 184 | | | 4444 Healthcare Drive^Suite 123^Ann Arbor^MI^99999^USA^B |
| Other Designation | ST | 120 | | Second line of an address. | Suite 555, Fourth floor |
| City | ST | 50 | | | |
| State or Province | ST | 50 | | Address State | |
| Zip or Postal Code | ST | 12 | | Hyphens and spaces in the Zip or Postal Code field are accepted. | |
| Country | ID | 3 | | Country | |
| Address Type | ID | 3 | | Address Type | |
| Other Geographic Designation | ST | 50 | | | |
| County Code | IS | 20 | | | |
| Census Tract | IS | 20 | | | |
| Address Representation Code | ID | 1 | | | |
| Address Validity Range | DR | 53 | | Deprecated | |
| Effective Date | TS | 26 | | | |
| Expiration Date | TS | 26 | | | |

### XCN - Extended Composite ID Number and Name
**Purpose**: Used where there is a need to specify the ID number and name of a person.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| ID Number | ST | 50 | | | 1234567^Everyman^Adam^A^III^DR^PHD^ADT01^^L^4^M11^MR |
| Family Name | FN | 100 | | | |
| Given Name | ST | 100 | | | |
| Middle Initial or Name | ST | 100 | | | |
| Suffix | ST | 20 | | | |
| Prefix | ST | 20 | | | |
| Degree | IS | 5 | | | |
| Source Table | IS | 4 | | | |
| Assigning Authority | HD | No max | | Unique identifier of the system, organization, or agency that creates the data | |
| Name Type Code | ID | 1 | | | |
| Identifier Check Digit | ST | 1 | | | |
| Check Digit Scheme | ID | 3 | | | |
| Identifier Type Code | ID | No max | | | |
| Assigning Facility | HD | 227 | | | |
| Name Representation Code | ID | 1 | | | |
| Name Context | CE | 483 | | | |
| Name Validity Range | DR | 53 | | | |
| Name Assembly Order | ID | 1 | | | |
| Effective Date | TS | 26 | | | |
| Expiration Date | TS | 26 | | | |
| Professional Suffix | ST | 199 | | | |
| Assigning Jurisdiction | CWE | 705 | | | |
| Assigning Agency or Department | CWE | 705 | | | |

### XON - Extended Composite Name and ID Number for Organizations
**Purpose**: Used to specify the name and ID number of an organization.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Organization Name | ST | 256 | | | Level Seven Healthcare, Inc.^L^^^^&2.16.840.1.113883.19.4.6^ISO^XX^^^1234 |
| Organization Name Type Code | IS | 20 | | | |
| ID Number | NM | 50 | | | |
| Check Digit | NM | 1 | | | |
| Check Digit Scheme | ID | 3 | | | |
| Assigning Authority | HD | 227 | | | |
| Identifier Type Code | ID | 5 | | | |
| Assigning Facility | HD | 227 | | | |
| Name Representation Code | ID | 1 | | | |
| Organization Identifier | ST | 20 | | | |

### XPN - Extended Person Name
**Purpose**: Specifies how the different parts of a person's name are split and transmitted.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Family Name | FN | 194 | | | Jon&van^Haan^^^^^L |
| Given Name | ST | 40 | | | |
| Middle Initial or Name | ST | 30 | | | |
| Suffix | ST | 10 | | | |
| Prefix | ST | 8 | | | |
| Degree | IS | 6 | | | |
| Name Type Code | ID | 1 | | | |
| Name Representation Code | ID | 1 | | | |
| Name Context | CE | 483 | | | |
| Name Validity Range | DR | 53 | | | |
| Name Assembly Order | ID | 1 | | | |
| Effective Date | TS | 26 | | | |
| Expiration Date | TS | 26 | | | |
| Professional Suffix | ST | 199 | | | |

### XTN - Extended Telecommunications Number
**Purpose**: Transmits a telephone number.

| Field | Data Type | Length | Code Set | Guidance | Example |
|-------|-----------|--------|----------|----------|---------|
| Phone Number String | ST | 20 | | | ^WPN^FX^^^734^6777777 |
| Telecommunication Use Code | ID | 3 | | | |
| Telecommunication Equipment Type | ID | 8 | | Phone Type | |
| Email Address | ST | 199 | | | |
| Country Code | NM | 2 | | | |
| Area City Code | NM | 5 | | | |
| Local Number | NM | 9 | | | |
| Extension | NM | 5 | | | |
| Any Text | ST | 199 | | | |
| Extension Prefix | ST | 4 | | | |
| Speed Dial Code | ST | 6 | | | |
| Unformatted Telephone Number | ST | 199 | | | |

### ELD - Error Location and Description
**Purpose**: Error location and description.

### ERL - Error Location
**Purpose**: Error location.

## Common Validation Errors and Solutions

### Error 1006 - Required field missing

**Common Issues:**
- Missing Universal ID in XCN fields
- Missing Assigning Authority in CX fields
- Missing required components in composite data types

**Solutions:**
1. **XCN Fields**: Ensure the 10th component (Universal ID) is populated
2. **CX Fields**: Ensure Assigning Authority (4th component) is populated
3. **HD Fields**: Ensure Universal ID is provided when required

### Error 1008 - Field too long

**Common Issues:**
- Name Type Code exceeds 1 character
- Source Table exceeds 4 characters
- Text fields exceed maximum length

**Solutions:**
1. **Name Type Code**: Use single character codes (L, D, P, etc.)
2. **Source Table**: Limit to 4 characters maximum
3. **Text Fields**: Truncate to maximum allowed length

### Error 1014 - Field value not found in validation table

**Common Issues:**
- Using local codes not in validation tables
- Incorrect coding system names
- Invalid facility or doctor IDs

**Solutions:**
1. Use standard HL7 table codes
2. Use recognized coding systems (ICD10, SNOMED CT, etc.)
3. Use standard facility and doctor identifiers

### Error 1077 - Unexpected Value

**Common Issues:**
- Incorrect coding system names
- Invalid SNOMED CT representation
- Wrong system codes

**Solutions:**
1. Use standard coding system names (SCT for SNOMED CT)
2. Ensure proper format for coding systems
3. Use recognized system identifiers

## Best Practices

1. **Always use standard HL7 table codes** when available
2. **Validate field lengths** before sending messages
3. **Use recognized coding systems** (ICD10, SNOMED CT, etc.)
4. **Populate all required components** of composite data types
5. **Test with validation tools** before production use
6. **Follow MALAFFI-specific requirements** for UAE healthcare

## References

- HL7 Version 2.5.1 Standard
- MALAFFI Integration Guidelines
- MODAQEQ Validation Rules
- UAE Healthcare Data Standards
