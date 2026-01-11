import { ClinicalVisit, Student, ClinicalAssessment, School } from '@prisma/client';

export interface HL7MessageOptions {
  messageControlId: string;
  sendingApplication: string;
  sendingFacility: string;
  receivingApplication: string;
  receivingFacility: string; // MSH-6: Receiving Facility (e.g., "ADHIE")
  processingId?: string; // MSH-11: Processing ID (default: 'P' for Production)
  hl7Version?: string; // MSH-12: Version (default: '2.5.1')
}

export class HL7MessageBuilder {
  private segments: string[] = [];
  private options: HL7MessageOptions;

  constructor(options: HL7MessageOptions) {
    this.options = options;
  }

  private addSegment(segment: string) {
    this.segments.push(segment);
  }

  private escapeField(value: string | null | undefined): string {
    if (!value) return '';
    return value
      .replace(/\\/g, '\\E\\')
      .replace(/\^/g, '\\S\\')
      .replace(/&/g, '\\T\\')
      .replace(/\|/g, '\\F\\')
      .replace(/\~/g, '\\R\\');
  }

  private formatDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0];
  }

  private formatDateWithOffset(date: Date, offset: string): string {
    // Use UTC date/time in HL7 format and append the offset suffix (e.g. +0400)
    return `${this.formatDate(date)}${offset}`;
  }

  // MSH - Message Header
  buildMSH(messageType: string) {
    const timestamp = this.formatDateWithOffset(new Date(), '+0400');
    // Format: MSH|^~\&|SendingApp^SendingApp|SendingFac^SendingFac|ReceivingApp^ReceivingApp|ReceivingFac|Timestamp|Security|MessageType|ControlID|ProcessingID|VersionID
    // Based on sample: MSH|^~\&|MF7163^MF7163|MF7163^MF7163|Rhapsody^MALAFFI|ADHIE|20251217131150+0400||ADT^A01|adt-20251217131150|P|2.5.1
    const processingId = this.options.processingId || 'P';
    const hl7Version = this.options.hl7Version || '2.5.1';
    const msh = [
      'MSH',
      '^~\\&',
      this.options.sendingApplication, // Already formatted as App^App
      this.options.sendingFacility, // Already formatted as Fac^Fac
      this.options.receivingApplication, // Already formatted as App^App
      this.options.receivingFacility,
      timestamp,
      '', // Security field (empty)
      messageType,
      this.options.messageControlId,
      processingId,
      hl7Version,
    ].join('|');
    this.addSegment(msh);
    return this;
  }

  // EVN - Event Type
  buildEVN(eventType: string, eventDate: Date) {
    // Format: EVN|EventTypeCode|RecordedDateTime
    // Based on working sample: EVN|A01|20251217131150 (no offset in EVN)
    const evn = [
      'EVN',
      eventType,
      this.formatDate(eventDate), // Just YYYYMMDDHHMMSS, no offset
    ].join('|');
    this.addSegment(evn);
    return this;
  }

  // PID - Patient Identification
  buildPID(student: Student, visit?: ClinicalVisit, school?: School) {
    const patientId = student.studentId || student.id;
    const schoolCode = school?.code || student.schoolId || 'SYSTEMCODE';
    
    // Format date of birth as YYYYMMDD (no time)
    const dob = student.dateOfBirth.toISOString().split('T')[0].replace(/-/g, '');
    
    // Format patient name: Last^First^Middle^Suffix^Prefix^Degree^NameTypeCode
    // Based on sample: KHAMIS OBAID BAHLOOL ALNAQBI^MOHAMMED^^^^P
    // Note: Carets (^) are field separators, not escaped characters
    const patientName = `${student.lastName || ''}^${student.firstName || ''}^^^^P`;
    
    // Administrative Sex: M, F, or U (Unknown)
    const adminSex = student.gender === 'MALE' ? 'M' : student.gender === 'FEMALE' ? 'F' : 'U';
    
    // Format phone numbers with type codes: PhoneNumber^^TypeCode
    // CH=Home, CB=Business, CF=Facsimile, CC=Mobile/Cellular
    const homePhone = student.parentPhone ? `${student.parentPhone.replace(/[^0-9]/g, '')}^^CH` : '';
    const businessPhone = student.parentPhone ? `${student.parentPhone.replace(/[^0-9]/g, '')}^^CB` : '';
    const faxPhone = student.parentPhone ? `${student.parentPhone.replace(/[^0-9]/g, '')}^^CF` : '';
    const mobilePhone = student.parentPhone ? `${student.parentPhone.replace(/[^0-9]/g, '')}^^CC` : '';
    
    // Combine phone numbers: Phone1^^CH~Phone2^^CB~Phone3^^CF
    const phoneNumbers = [homePhone, businessPhone, faxPhone].filter(p => p).join('~');
    
    // Format address: Street^Street2^City^State^Zip^Country^AddressType
    // Based on sample: UAE^^Al Ain^1^152662^ARE^H
    const addressParts = (student.address || '').split(',').map(s => s.trim());
    const formattedAddress = addressParts.length > 0 
      ? `${addressParts[0] || ''}^^${addressParts[1] || ''}^${addressParts[2] || ''}^${addressParts[3] || ''}^${addressParts[4] || ''}^ARE^H`
      : `UAE^^${school?.name || ''}^1^000000^ARE^H`;
    
    // Nationality code (default to ARE for UAE)
    const nationality = student.nationality || 'ARE';
    
    // Generate Emirates ID (if not available, use a placeholder format)
    const emiratesId = student.studentId || '000000000000000';

    const pid = [
      'PID',
      '1', // Set ID - PID
      '', // Patient ID (external) - empty
      `${patientId}^^^&${schoolCode}`, // Patient Identifier List - ESIS ID with assigning authority
      '', // Alternate Patient ID - PID
      patientName, // Patient Name - Last^First^Middle^Suffix^Prefix^Degree^NameTypeCode
      '', // Mother's Maiden Name
      dob, // Date/Time of Birth - YYYYMMDD
      adminSex, // Administrative Sex
      '', // Patient Alias
      'GCC^GCC National^MALAFFI', // Race - using GCC standard
      formattedAddress, // Patient Address
      nationality, // County Code
      phoneNumbers || '', // Phone Number - Home (with type codes)
      mobilePhone || '', // Phone Number - Business
      'ENGL^English^MALAFFI', // Primary Language
      'S^Single^MALAFFI', // Marital Status
      'MU^Muslim^MALAFFI', // Religion
      '', // Patient Account Number
      emiratesId, // SSN Number - Emirates ID
      '', // Driver's License Number
      '', // Mother's Identifier
      'GA^Gulf Arab^MALAFFI', // Ethnic Group
      '', // Birth Place
      '', // Multiple Birth Indicator
      '', // Birth Order
      '', // Citizenship
      '', // Veterans Military Status
      '', // Nationality
      '', // Patient Death Date and Time
      'N', // Patient Death Indicator
      '', // Identity Unknown Indicator
      '', // Identity Reliability Code
      '', // Last Update Date/Time
      '', // Last Update Facility
      '', // Species Code
      '', // Breed Code
      '', // Strain
      '', // Production Class Code
      '', // Tribal Citizenship
    ].join('|');
    this.addSegment(pid);
    return this;
  }

  // PV1 - Patient Visit
  buildPV1(visit: ClinicalVisit | Partial<ClinicalVisit>, school: School, doctorId?: string, doctorName?: string) {
    // Based on working sample: PV1|1|I|OR PERIOP^OR Periop^B1^MF3333&MF7163-DOHID^^^^^ICU||||GD18668^Ahmed^Sara^^^^^^&MF7163-DOHID||GD18668^Ahmed^Sara^^^^^^&MF7163-DOHID|7||||4|||||20251217041131^^^&MF7163|||||||||||||||||||||||||20251217081100||||||||
    const systemCode = school.code || 'SYSTEMCODE';
    const visitType = 'visitType' in visit ? visit.visitType : 'ROUTINE_CHECKUP';
    const visitDate = ('visitDate' in visit && visit.visitDate) ? visit.visitDate : new Date();
    
    // Patient Class: I=Inpatient, O=Outpatient, E=Emergency, P=Preadmit, R=Recurring, B=Obstetrics
    const patientClass = visitType === 'EMERGENCY' ? 'E' : visitType === 'ROUTINE_CHECKUP' ? 'I' : 'O';
    
    // Assigned Patient Location: PointOfCare^Room^Bed^Facility&Facility-DOHID^^^^^LocationType
    // Based on sample: OR PERIOP^OR Periop^B1^MF3333&MF7163-DOHID^^^^^ICU
    const pointOfCare = 'OR PERIOP';
    const room = 'OR Periop';
    const bed = 'B1';
    const facility = `${systemCode}&${systemCode}-DOHID`;
    const locationType = 'ICU';
    const assignedLocation = `${pointOfCare}^${room}^${bed}^${facility}^^^^^${locationType}`;
    
    // Doctor ID and Name - use provided or default
    const docId = doctorId || `GD${Math.floor(Math.random() * 100000)}`;
    const docFirstName = doctorName?.split(' ')[0] || 'Doctor';
    const docLastName = doctorName?.split(' ').slice(1).join(' ') || 'Name';
    const doctorFormat = `${docId}^${docFirstName}^${docLastName}^^^^^^&${systemCode}-DOHID`;
    
    // Format dates: YYYYMMDDHHMMSS^^^&Facility
    const admitDateFormatted = `${this.formatDate(visitDate)}^^^&${systemCode}`;
    const dischargeDate = 'visitDate' in visit && visit.visitDate ? new Date(visitDate.getTime() + 4 * 60 * 60 * 1000) : null; // 4 hours later
    const dischargeDateFormatted = dischargeDate ? `${this.formatDate(dischargeDate)}` : '';

    const pv1 = [
      'PV1',
      '1', // Set ID - PV1
      patientClass, // Patient Class
      assignedLocation, // Assigned Patient Location
      '', // Admission Type
      '', // Preadmit Number
      '', // Prior Patient Location
      '', // Attending Doctor
      '', // Referring Doctor
      '', // Consulting Doctor
      '', // Hospital Service
      '', // Temporary Location
      '', // Preadmit Test Indicator
      '', // Re-admission Indicator
      '', // Admit Source
      '', // Ambulatory Status
      '', // VIP Indicator
      doctorFormat, // Admitting Doctor - ID^First^Last^^^^^^&Facility-DOHID
      '', // Patient Type
      '', // Visit Number
      '', // Financial Class
      '', // Charge Price Indicator
      '', // Courtesy Code
      '', // Credit Rating
      '', // Contract Code
      '', // Contract Effective Date
      '', // Contract Amount
      '', // Contract Period
      '', // Interest Code
      '', // Transfer to Bad Debt Code
      '', // Transfer to Bad Debt Date
      '', // Bad Debt Agency Code
      '', // Bad Debt Transfer Amount
      '', // Bad Debt Recovery Amount
      '', // Delete Account Indicator
      '', // Delete Account Date
      '', // Discharge Disposition
      '', // Discharged to Location
      '', // Diet Type
      '', // Servicing Facility
      '', // Bed Status
      '', // Account Status
      '', // Pending Location
      '', // Prior Temporary Location
      admitDateFormatted, // Admit Date/Time - YYYYMMDDHHMMSS^^^&Facility
      dischargeDateFormatted, // Discharge Date/Time
      '', // Current Patient Balance
      '', // Total Charges
      '', // Total Adjustments
      '', // Total Payments
      '', // Alternate Visit ID
      '', // Visit Indicator
      '', // Other Healthcare Provider
    ].join('|');
    this.addSegment(pv1);
    return this;
  }

  // OBX - Observation/Result
  buildOBX(setId: number, valueType: string, observationId: string, observationValue: string, units?: string) {
    const obx = [
      'OBX',
      setId.toString(),
      valueType,
      observationId,
      '',
      observationValue,
      units || '',
      '', // References Range
      '', // Abnormal Flags
      '', // Probability
      '', // Nature of Abnormal Test
      'F', // Observation Result Status
      '', // Date/Time of the Observation
      '', // User Defined Access Checks
      '', // Date/Time of the Analysis
      '', // Performing Organization Name
      '', // Performing Organization Address
      '', // Performing Organization Medical Director
    ].join('|');
    this.addSegment(obx);
    return this;
  }

  // Build ADT^A04 (Register Patient - initial registration)
  buildADT_A04(student: Student, school: School) {
    this.buildMSH('ADT^A04');
    const now = new Date();
    this.buildEVN('A04', now);
    this.buildPID(student, undefined, school);

    // Minimal PV1 with outpatient context
    const fakeVisit = {
      id: 'TEMP',
      studentId: student.id,
      schoolId: school.id,
      visitDate: now,
      visitType: 'ROUTINE_CHECKUP' as const,
      chiefComplaint: null,
      notes: null,
      diagnosis: null,
      treatment: null,
      followUpRequired: false,
      followUpDate: null,
      createdBy: 'SYSTEM',
      createdAt: now,
      updatedAt: now,
    } as ClinicalVisit;

    this.buildPV1(fakeVisit, school);
    return this;
  }

  // Build ADT^A01 (Admit/Visit Notification)
  buildADT_A01(student: Student, visit: ClinicalVisit, school: School, doctorId?: string, doctorName?: string) {
    this.buildMSH('ADT^A01');
    this.buildEVN('A01', visit.visitDate);
    this.buildPID(student, visit, school);
    this.buildPV1(visit, school, doctorId, doctorName);
    return this;
  }

  // Build ADT^A03 (Discharge)
  buildADT_A03(student: Student, visit: ClinicalVisit, school: School, dischargeDate: Date, doctorId?: string, doctorName?: string) {
    this.buildMSH('ADT^A03');
    this.buildEVN('A03', dischargeDate);
    this.buildPID(student, visit, school);
    this.buildPV1(visit, school, doctorId, doctorName);
    return this;
  }

  // Build ADT^A08 (Update Patient Information)
  buildADT_A08(student: Student, visit: ClinicalVisit, school: School, assessment?: ClinicalAssessment, doctorId?: string, doctorName?: string) {
    this.buildMSH('ADT^A08');
    this.buildEVN('A08', visit.visitDate);
    this.buildPID(student, visit, school);
    this.buildPV1(visit, school, doctorId, doctorName);

    if (assessment) {
      let obxSetId = 1;
      if (assessment.temperature) {
        this.buildOBX(obxSetId++, 'NM', 'TEMP', assessment.temperature.toString(), 'C');
      }
      if (assessment.bloodPressureSystolic && assessment.bloodPressureDiastolic) {
        this.buildOBX(
          obxSetId++,
          'NM',
          'BP',
          `${assessment.bloodPressureSystolic}/${assessment.bloodPressureDiastolic}`,
          'mmHg'
        );
      }
      if (assessment.heartRate) {
        this.buildOBX(obxSetId++, 'NM', 'HR', assessment.heartRate.toString(), 'bpm');
      }
      if (assessment.respiratoryRate) {
        this.buildOBX(obxSetId++, 'NM', 'RR', assessment.respiratoryRate.toString(), '/min');
      }
      if (assessment.oxygenSaturation) {
        this.buildOBX(obxSetId++, 'NM', 'SPO2', assessment.oxygenSaturation.toString(), '%');
      }
      if (assessment.height) {
        this.buildOBX(obxSetId++, 'NM', 'HEIGHT', assessment.height.toString(), 'cm');
      }
      if (assessment.weight) {
        this.buildOBX(obxSetId++, 'NM', 'WEIGHT', assessment.weight.toString(), 'kg');
      }
      if (assessment.bmi) {
        this.buildOBX(obxSetId++, 'NM', 'BMI', assessment.bmi.toString(), 'kg/m2');
      }
      if (visit.chiefComplaint) {
        this.buildOBX(obxSetId++, 'TX', 'CHIEF_COMPLAINT', visit.chiefComplaint);
      }
      if (visit.diagnosis) {
        this.buildOBX(obxSetId++, 'TX', 'DIAGNOSIS', visit.diagnosis);
      }
      if (visit.treatment) {
        this.buildOBX(obxSetId++, 'TX', 'TREATMENT', visit.treatment);
      }
    }

    return this;
  }

  // Build ORU^R01 (Observation Result)
  buildORU_R01(student: Student, visit: ClinicalVisit, school: School, assessment: ClinicalAssessment, doctorId?: string, doctorName?: string) {
    this.buildMSH('ORU^R01');
    this.buildEVN('R01', visit.visitDate);
    this.buildPID(student, visit, school);
    this.buildPV1(visit, school, doctorId, doctorName);

    let obxSetId = 1;
    if (assessment.temperature) {
      this.buildOBX(obxSetId++, 'NM', 'TEMP', assessment.temperature.toString(), 'C');
    }
    if (assessment.bloodPressureSystolic && assessment.bloodPressureDiastolic) {
      this.buildOBX(
        obxSetId++,
        'NM',
        'BP',
        `${assessment.bloodPressureSystolic}/${assessment.bloodPressureDiastolic}`,
        'mmHg'
      );
    }
    if (assessment.heartRate) {
      this.buildOBX(obxSetId++, 'NM', 'HR', assessment.heartRate.toString(), 'bpm');
    }
    if (assessment.respiratoryRate) {
      this.buildOBX(obxSetId++, 'NM', 'RR', assessment.respiratoryRate.toString(), '/min');
    }
    if (assessment.oxygenSaturation) {
      this.buildOBX(obxSetId++, 'NM', 'SPO2', assessment.oxygenSaturation.toString(), '%');
    }
    if (assessment.height) {
      this.buildOBX(obxSetId++, 'NM', 'HEIGHT', assessment.height.toString(), 'cm');
    }
    if (assessment.weight) {
      this.buildOBX(obxSetId++, 'NM', 'WEIGHT', assessment.weight.toString(), 'kg');
    }
    if (assessment.bmi) {
      this.buildOBX(obxSetId++, 'NM', 'BMI', assessment.bmi.toString(), 'kg/m2');
    }

    return this;
  }

  build(): string {
    return this.segments.join('\r');
  }
}

export function generateMessageControlId(): string {
  return `MSG${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

export async function sendHL7ToMalaffi(
  message: string,
  messageControlId: string,
  environment: string = 'test'
): Promise<{ success: boolean; error?: string }> {
  // Support both environment variable names
  let malaffiUrl = process.env.MALAFFI_API_URL || process.env.MALAFFI_HL7_ENDPOINT;
  
  // If not set, use environment-based defaults
  if (!malaffiUrl) {
    if (environment === 'production') {
      malaffiUrl = 'https://hl7.malaffi.ae/receive';
    } else {
      malaffiUrl = 'https://test-hl7.malaffi.ae/receive';
    }
  }
  
  const apiKey = process.env.MALAFFI_API_KEY;

  if (!apiKey) {
    return { success: false, error: 'MALAFFI_API_KEY not configured' };
  }

  try {
    // Add timeout to fetch request (30 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(malaffiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/hl7-v2',
        'Authorization': `Bearer ${apiKey}`,
        'X-Message-Control-ID': messageControlId,
      },
      body: message,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = `HTTP ${response.status} ${response.statusText}`;
      }
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    return { success: true };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { success: false, error: 'Request timeout after 30 seconds' };
    }
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return { success: false, error: `Connection failed: ${error.message}. Check MALAFFI_API_URL and network connectivity.` };
    }
    if (error.message && error.message.includes('fetch failed')) {
      return { success: false, error: `Network error: ${error.message}. Check MALAFFI_API_URL (${malaffiUrl}) and network connectivity.` };
    }
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
}

