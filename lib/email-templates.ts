/**
 * Email Templates
 * Centralized email template storage and retrieval
 */

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: string;
}

export const emailTemplates: Record<string, EmailTemplate> = {
  WELCOME: {
    id: '1',
    name: 'Welcome Email',
    subject: 'Welcome to Taaleem Clinic Management',
    body: `Dear {{firstName}} {{lastName}},

Welcome to Taaleem Clinic Management System!

Your account has been created successfully.

Email: {{email}}
Role: {{role}}

Please log in using your credentials and change your password on first login.

Best regards,
Taaleem Clinic Management Team`,
    type: 'WELCOME',
  },
  PASSWORD_RESET: {
    id: '2',
    name: 'Password Reset',
    subject: 'Password Reset Request',
    body: `Dear {{firstName}} {{lastName}},

You have requested to reset your password for Taaleem Clinic Management.

Click the link below to reset your password:
{{resetLink}}

This link will expire in 24 hours.

If you did not request this password reset, please ignore this email.

Best regards,
Taaleem Clinic Management Team`,
    type: 'PASSWORD_RESET',
  },
  PARENT_VISIT_NOTIFICATION: {
    id: '3',
    name: 'Parent Visit Notification',
    subject: 'Student Visit Notification - {{studentName}}',
    body: `Dear Parent/Guardian,

This is to inform you that your child {{studentName}} (Student ID: {{studentId}}) visited the school clinic on {{visitDate}}.

Visit Details:
- Visit Type: {{visitType}}
- Chief Complaint: {{chiefComplaint}}
- Diagnosis: {{diagnosis}}
- Treatment: {{treatment}}
{{#if followUpRequired}}
- Follow-up Required: Yes
- Follow-up Date: {{followUpDate}}
{{/if}}

If you have any questions or concerns, please contact the school clinic.

Best regards,
Taaleem Clinic Management`,
    type: 'PARENT_VISIT_NOTIFICATION',
  },
  PARENT_HEALTH_RECORD: {
    id: '4',
    name: 'Parent Health Record Update',
    subject: 'Health Record Update - {{studentName}}',
    body: `Dear Parent/Guardian,

This is to inform you that a health record has been updated for your child {{studentName}} (Student ID: {{studentId}}).

Health Record Details:
- Record Date: {{recordDate}}
{{#if height}}Height: {{height}} cm{{/if}}
{{#if weight}}Weight: {{weight}} kg{{/if}}
{{#if bmi}}BMI: {{bmi}}{{/if}}
{{#if visionScreeningResult}}Vision Screening Result: {{visionScreeningResult}}{{/if}}
{{#if colorBlindness}}Color Blindness: {{colorBlindness}}{{/if}}

If you have any questions or concerns, please contact the school clinic.

Best regards,
Taaleem Clinic Management`,
    type: 'PARENT_HEALTH_RECORD',
  },
  PARENT_EMERGENCY: {
    id: '5',
    name: 'Parent Emergency Notification',
    subject: 'URGENT: Emergency Visit - {{studentName}}',
    body: `Dear Parent/Guardian,

URGENT NOTIFICATION

Your child {{studentName}} (Student ID: {{studentId}}) was seen in the school clinic for an emergency visit on {{visitDate}} at {{visitTime}}.

Emergency Details:
- Visit Type: {{visitType}}
- Chief Complaint: {{chiefComplaint}}
- Diagnosis: {{diagnosis}}
- Treatment Provided: {{treatment}}
- Status: {{status}}

{{#if requiresImmediateAttention}}
⚠️ IMMEDIATE ATTENTION REQUIRED
Please contact the school clinic immediately or seek medical attention if needed.
{{/if}}

For any questions, please contact the school clinic immediately.

Best regards,
Taaleem Clinic Management`,
    type: 'PARENT_EMERGENCY',
  },
};

export function getEmailTemplate(type: string): EmailTemplate | null {
  return emailTemplates[type] || null;
}

export function getAllEmailTemplates(): EmailTemplate[] {
  return Object.values(emailTemplates);
}

