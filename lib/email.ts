/**
 * Email Service
 * Handles sending emails using SMTP configuration with Nodemailer
 */

import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  html?: string;
  templateType?: string;
  sentBy?: string;
  metadata?: Record<string, any>;
}

interface SMTPConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
  enableTLS: boolean;
}

/**
 * Get SMTP configuration from environment or settings
 * In production, this should fetch from database
 */
async function getSMTPConfig(): Promise<SMTPConfig | null> {
  // Check environment variables first
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD || '',
      fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
      fromName: process.env.SMTP_FROM_NAME || 'Taaleem Clinic Management',
      enableTLS: process.env.SMTP_TLS !== 'false',
    };
  }

  // TODO: Fetch from database settings table
  // For now, return null if not configured
  return null;
}

/**
 * Replace template variables in text
 */
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, any>
): string {
  let result = template;

  // Replace simple variables {{variableName}}
  Object.keys(variables).forEach((key) => {
    const value = variables[key];
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value !== null && value !== undefined ? String(value) : '');
  });

  // Handle conditional blocks {{#if variable}}...{{/if}}
  const ifRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  result = result.replace(ifRegex, (match, condition, content) => {
    const conditionValue = variables[condition];
    if (conditionValue && conditionValue !== '' && conditionValue !== false && conditionValue !== null) {
      return content;
    }
    return '';
  });

  return result;
}

/**
 * Log email to database
 */
async function logEmail(
  options: EmailOptions,
  status: 'PENDING' | 'SENT' | 'FAILED' | 'BOUNCED' | 'DELIVERED',
  errorMessage?: string
): Promise<string> {
  try {
    const emailLog = await prisma.emailLog.create({
      data: {
        to: options.to,
        subject: options.subject,
        body: options.body,
        html: options.html,
        status,
        templateType: options.templateType,
        sentBy: options.sentBy,
        sentAt: status === 'SENT' || status === 'DELIVERED' ? new Date() : null,
        deliveredAt: status === 'DELIVERED' ? new Date() : null,
        errorMessage: errorMessage || null,
        metadata: options.metadata ? JSON.stringify(options.metadata) : null,
      },
    });
    return emailLog.id;
  } catch (error) {
    console.error('Failed to log email:', error);
    return '';
  }
}

/**
 * Update email log status
 */
async function updateEmailLogStatus(
  logId: string,
  status: 'SENT' | 'FAILED' | 'BOUNCED' | 'DELIVERED',
  errorMessage?: string
): Promise<void> {
  try {
    await prisma.emailLog.update({
      where: { id: logId },
      data: {
        status,
        sentAt: status === 'SENT' || status === 'DELIVERED' ? new Date() : undefined,
        deliveredAt: status === 'DELIVERED' ? new Date() : undefined,
        errorMessage: errorMessage || null,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Failed to update email log:', error);
  }
}

/**
 * Send email using SMTP with Nodemailer
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string; logId?: string }> {
  const config = await getSMTPConfig();

  // Log email as PENDING first
  const logId = await logEmail(options, 'PENDING');

  if (!config) {
    const error = 'SMTP not configured';
    if (logId) {
      await updateEmailLogStatus(logId, 'FAILED', error);
    }
    console.warn('SMTP not configured. Email not sent:', options);
    // In development, just log the email
    if (process.env.NODE_ENV === 'development') {
      console.log('=== EMAIL (Not Sent - SMTP Not Configured) ===');
      console.log('To:', options.to);
      console.log('Subject:', options.subject);
      console.log('Body:', options.body);
      console.log('==============================================');
      if (logId) {
        await updateEmailLogStatus(logId, 'SENT'); // Mark as sent in dev mode
      }
      return { success: true, logId }; // Return success in dev mode
    }
    return { success: false, error, logId };
  }

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465, // true for 465, false for other ports
      auth: {
        user: config.user,
        pass: config.password,
      },
      tls: {
        rejectUnauthorized: config.enableTLS,
      },
    });

    // Verify connection
    await transporter.verify();

    // Send email
    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      text: options.body,
      html: options.html || options.body.replace(/\n/g, '<br>'),
    });

    // Update log as SENT
    if (logId) {
      await updateEmailLogStatus(logId, 'SENT');
    }

    console.log('Email sent successfully:', info.messageId);
    return { success: true, logId };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Email send error:', errorMessage);
    
    // Update log as FAILED
    if (logId) {
      await updateEmailLogStatus(logId, 'FAILED', errorMessage);
    }

    return {
      success: false,
      error: errorMessage,
      logId,
    };
  }
}

/**
 * Send parent notification email for visit
 */
export async function sendParentVisitNotification(
  student: { firstName: string; lastName: string; studentId: string; parentEmail: string },
  visit: {
    visitType: string;
    visitDate: Date;
    chiefComplaint?: string | null;
    diagnosis?: string | null;
    treatment?: string | null;
    followUpRequired: boolean;
    followUpDate?: Date | null;
  },
  assessment?: {
    temperature?: number | null;
    bloodPressureSystolic?: number | null;
    bloodPressureDiastolic?: number | null;
    heartRate?: number | null;
    respiratoryRate?: number | null;
    oxygenSaturation?: number | null;
    height?: number | null;
    weight?: number | null;
    bmi?: number | null;
  } | null,
  sentBy?: string
): Promise<{ success: boolean; error?: string; logId?: string }> {
  try {
    // Get template from centralized template storage
    const { getEmailTemplate } = await import('@/lib/email-templates');
    const template = getEmailTemplate('PARENT_VISIT_NOTIFICATION');
    
    if (!template) {
      throw new Error('Parent visit notification template not found');
    }

    // Format visit date
    const visitDate = new Date(visit.visitDate);
    const formattedDate = visitDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = visitDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Build summary report
    let summaryReport = '\n\n=== VISIT SUMMARY REPORT ===\n\n';
    summaryReport += `Student: ${student.firstName} ${student.lastName}\n`;
    summaryReport += `Student ID: ${student.studentId}\n`;
    summaryReport += `Visit Date: ${formattedDate} at ${formattedTime}\n`;
    summaryReport += `Visit Type: ${visit.visitType.replace(/_/g, ' ')}\n\n`;

    if (visit.chiefComplaint) {
      summaryReport += `Chief Complaint: ${visit.chiefComplaint}\n`;
    }
    if (visit.diagnosis) {
      summaryReport += `Diagnosis: ${visit.diagnosis}\n`;
    }
    if (visit.treatment) {
      summaryReport += `Treatment: ${visit.treatment}\n`;
    }

    if (assessment) {
      summaryReport += '\n--- Vital Signs ---\n';
      if (assessment.temperature) {
        summaryReport += `Temperature: ${assessment.temperature}°C\n`;
      }
      if (assessment.bloodPressureSystolic && assessment.bloodPressureDiastolic) {
        summaryReport += `Blood Pressure: ${assessment.bloodPressureSystolic}/${assessment.bloodPressureDiastolic} mmHg\n`;
      }
      if (assessment.heartRate) {
        summaryReport += `Heart Rate: ${assessment.heartRate} bpm\n`;
      }
      if (assessment.respiratoryRate) {
        summaryReport += `Respiratory Rate: ${assessment.respiratoryRate} /min\n`;
      }
      if (assessment.oxygenSaturation) {
        summaryReport += `Oxygen Saturation: ${assessment.oxygenSaturation}%\n`;
      }
      if (assessment.height) {
        summaryReport += `Height: ${assessment.height} cm\n`;
      }
      if (assessment.weight) {
        summaryReport += `Weight: ${assessment.weight} kg\n`;
      }
      if (assessment.bmi) {
        summaryReport += `BMI: ${assessment.bmi.toFixed(1)}\n`;
      }
    }

    if (visit.followUpRequired && visit.followUpDate) {
      const followUpDate = new Date(visit.followUpDate);
      summaryReport += `\nFollow-up Required: Yes\n`;
      summaryReport += `Follow-up Date: ${followUpDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}\n`;
    }

    summaryReport += '\n================================\n';

    // Prepare variables for template
    const variables = {
      studentName: `${student.firstName} ${student.lastName}`,
      studentId: student.studentId,
      visitDate: formattedDate,
      visitTime: formattedTime,
      visitType: visit.visitType.replace(/_/g, ' '),
      chiefComplaint: visit.chiefComplaint || 'Not specified',
      diagnosis: visit.diagnosis || 'Not specified',
      treatment: visit.treatment || 'Not specified',
      followUpRequired: visit.followUpRequired,
      followUpDate: visit.followUpDate
        ? new Date(visit.followUpDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : '',
    };

    // Replace template variables
    const subject = replaceTemplateVariables(template.subject, variables);
    let body = replaceTemplateVariables(template.body, variables);
    
    // Append summary report
    body += summaryReport;

    // Send email with logging
    return await sendEmail({
      to: student.parentEmail,
      subject,
      body,
      html: body.replace(/\n/g, '<br>'),
      templateType: 'PARENT_VISIT_NOTIFICATION',
      sentBy,
      metadata: {
        studentId: student.studentId,
        visitType: visit.visitType,
        visitDate: visit.visitDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Parent notification error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
