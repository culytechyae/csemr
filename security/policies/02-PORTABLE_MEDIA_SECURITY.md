# Portable and Removable Media Security Policy
## School Clinic EMR System

**Policy Version:** 1.0  
**Effective Date:** January 2025  
**Review Frequency:** Annually  
**Owner:** IT Security & Compliance Team

---

## 1. Purpose

This policy establishes security controls to protect confidential and sensitive healthcare information stored on or transmitted via portable or removable media (USB drives, external hard drives, mobile devices, etc.) to prevent unauthorized access, data loss, or security breaches.

## 2. Scope

This policy applies to:
- All workforce members
- All portable storage devices (USB drives, external hard drives, SD cards, etc.)
- Mobile devices (smartphones, tablets, laptops) used to store or access healthcare data
- All organizational and personal devices used for work purposes

## 3. Policy Statement

The organization strictly controls the use of portable and removable media to protect healthcare information. All portable media must be encrypted, and copying sensitive data to removable media is restricted and must be authorized.

## 4. Portable Media Classification

### 4.1 Prohibited Media
The following media are **prohibited** for storing healthcare information:
- Unencrypted USB drives
- Unencrypted external hard drives
- Personal storage devices without encryption
- Unapproved mobile devices

### 4.2 Approved Media
The following media may be used **with proper authorization and encryption**:
- Organization-issued encrypted USB drives
- Organization-managed encrypted external hard drives
- Organization-managed mobile devices with encryption enabled
- Cloud storage approved by IT Security

## 5. Encryption Requirements

### 5.1 Mandatory Encryption
All portable media used to store healthcare information must:
- Use AES-256 encryption minimum
- Be encrypted at the device level (full disk encryption)
- Require authentication to access encrypted data
- Be managed by IT Security team

### 5.2 Approved Encryption Solutions
- **USB Drives:** BitLocker, VeraCrypt, or organization-approved encryption software
- **Laptops:** BitLocker (Windows), FileVault (Mac), or full disk encryption
- **Mobile Devices:** Device encryption enabled (iOS/Android built-in encryption)
- **External Drives:** Hardware-encrypted drives or software encryption

## 6. Data Copy Restrictions

### 6.1 General Restrictions
Copying healthcare information to portable media is **restricted** and requires:
- Written authorization from department head
- Valid business justification
- Encryption verification
- Audit trail documentation

### 6.2 Prohibited Activities
The following activities are **prohibited**:
- Copying patient data to personal devices without authorization
- Copying data to unencrypted media
- Copying data to unapproved cloud services
- Removing healthcare data from premises without authorization
- Using portable media to transfer data between systems unless approved

### 6.3 Exceptions
Exceptions may be granted for:
- Authorized backup procedures
- Emergency data recovery (with IT Security approval)
- Compliance with legal requirements
- Authorized system migrations

## 7. Mobile Device Management

### 7.1 Organization-Issued Devices
All organization-issued mobile devices must:
- Have device encryption enabled
- Use Mobile Device Management (MDM) software
- Have remote wipe capability enabled
- Require strong passcodes/PINs
- Have screen lock enabled (maximum 5 minutes)

### 7.2 Bring Your Own Device (BYOD)
Personal devices may access healthcare information only if:
- Approved by IT Security
- Enrolled in MDM solution
- Device encryption enabled
- Strong authentication required
- Organization policies and apps installed
- Remote wipe capability enabled

### 7.3 Lost or Stolen Devices
If a device containing healthcare information is lost or stolen:
- **Immediate Action:** Report to IT Security within 1 hour
- **IT Security Action:** Remote wipe device immediately
- **Incident Reporting:** Complete security incident report
- **Documentation:** Document incident in security log

## 8. Removable Media Scanning

### 8.1 Automatic Scanning
All removable media connected to organizational systems must:
- Be automatically scanned for malware before access
- Be blocked if malware detected
- Be logged in security monitoring system

### 8.2 Scanning Configuration
- **Auto-run Disabled:** Autorun/autoplay must be disabled
- **Real-time Scanning:** Anti-malware must scan on connection
- **Quarantine:** Infected media automatically quarantined
- **User Notification:** Users notified of scan results

## 8.3 User Responsibilities
Users must:
- Never disable scanning features
- Wait for scan completion before accessing media
- Report any scan alerts to IT Security
- Not attempt to bypass security controls

## 9. Access Controls

### 9.1 Device Authorization
Only authorized personnel may:
- Use portable media for healthcare information
- Access encrypted portable media
- Transfer data to portable media

### 9.2 Need-to-Know Principle
Data on portable media must:
- Be limited to information necessary for business purpose
- Follow principle of least privilege
- Not include unnecessary patient information

## 10. Audit and Monitoring

### 10.1 Audit Logging
The following activities are logged:
- All attempts to copy data to portable media
- All portable media connections to systems
- All access to encrypted portable media
- All violations of this policy

### 10.2 Monitoring
IT Security monitors:
- Unusual data copy activities
- Attempts to bypass security controls
- Use of unauthorized portable media
- Scanning violations

### 10.3 Regular Audits
- Quarterly review of portable media usage logs
- Annual review of encryption compliance
- Random audits of portable media devices
- Review of access authorizations

## 11. Data Loss Prevention (DLP)

### 11.1 DLP Controls
- Monitor data transfers to portable media
- Block unauthorized data copies
- Alert on suspicious data movement patterns
- Log all data transfer attempts

### 11.2 Violation Handling
- Automatic blocking of unauthorized transfers
- Alert to IT Security immediately
- User notification of policy violation
- Escalation for repeated violations

## 12. Secure Disposal

### 12.1 Media Sanitization
Before disposal, all portable media must:
- Be securely wiped using approved methods (DoD 5220.22-M standard or equivalent)
- Have encryption keys destroyed
- Be physically destroyed if containing sensitive data
- Be documented in disposal log

### 12.2 Disposal Procedures
- Return all organization-issued media to IT Security
- Never dispose of media containing healthcare data in regular trash
- Use certified disposal services for physical destruction
- Obtain certificate of destruction

## 13. Training Requirements

All workforce members must:
- Complete training on this policy within 30 days of hire
- Complete annual refresher training
- Understand encryption requirements
- Know how to report security incidents

## 14. Violations and Consequences

Violations of this policy may result in:
- Immediate revocation of portable media privileges
- Disciplinary action up to and including termination
- Legal action if healthcare data is compromised
- Regulatory penalties if Malaffi/ADHICS violations occur

## 15. Emergency Procedures

### 15.1 Lost or Stolen Media
If media containing healthcare data is lost/stolen:
1. Report to IT Security immediately (within 1 hour)
2. Complete security incident report
3. If remote wipe available, initiate immediately
4. Notify affected patients if breach confirmed
5. Notify regulatory authorities as required

### 15.2 Data Breach Response
If unauthorized access to portable media data is suspected:
1. Preserve evidence
2. Notify IT Security and management
3. Initiate incident response procedures
4. Assess scope of potential breach
5. Notify authorities per regulatory requirements

## 16. Compliance

This policy ensures compliance with:
- **Malaffi Security Assessment Template v3** - AC 3.1
- **ADHICS Requirements** - Portable media controls
- **HIPAA Requirements** - Mobile device security

## 17. Related Policies

- Remote Access Security Policy
- Data Classification and Handling Policy
- Incident Response Policy
- Mobile Device Management Policy

## 18. Review and Updates

This policy shall be reviewed:
- **Annually** or as technology changes
- **When new threats emerge**
- **After security incidents**
- **When regulations are updated**

---

**Policy Approval:**

**IT Security Manager:** _________________ Date: _________

**Chief Information Officer:** _________________ Date: _________

**Last Reviewed:** January 2025  
**Next Review:** January 2026

