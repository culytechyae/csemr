# Third-Party Security Policy
## School Clinic EMR System

**Policy Version:** 1.0  
**Effective Date:** January 2025  
**Review Frequency:** Annually  
**Owner:** IT Security & Compliance Team

---

## 1. Purpose

This policy establishes requirements and procedures to reduce risk probabilities concerning third-party access to confidential and sensitive systems, data, and networks, and to enforce and monitor adherence to established security policies with third parties.

## 2. Scope

This policy applies to:
- All third-party vendors with system access
- All contractors and consultants
- All service providers with network access
- All cloud service providers
- All managed service providers
- All organizations with data sharing agreements

## 3. Policy Statement

The organization requires all third parties with access to organizational systems, data, or networks to comply with security policies and undergo security assessments, monitoring, and regular audits to protect healthcare information.

## 4. Third-Party Risk Assessment

### 4.1 Risk Assessment Requirements
All third parties must undergo:
- **Pre-engagement risk assessment:** Before access is granted
- **Annual risk assessment:** While providing services
- **Post-incident assessment:** After security incidents
- **Exit assessment:** Upon contract completion

### 4.2 Risk Assessment Factors
Assess third parties based on:
- **Data Access Level:** Amount and sensitivity of data accessed
- **System Access Level:** Criticality of systems accessed
- **Network Access:** Type and extent of network access
- **Security Posture:** Vendor security controls and compliance
- **History:** Past security incidents or violations
- **Regulatory Compliance:** Malaffi/ADHICS/HIPAA compliance status

### 4.3 Risk Classification

#### High Risk
- Access to healthcare information
- Access to critical systems
- Direct network connections
- Remote access capabilities
- Long-term engagements

#### Medium Risk
- Limited data access
- Access to non-critical systems
- Cloud service providers
- Application vendors

#### Low Risk
- Public information only
- No system access
- One-time services
- Low data exposure

## 5. Third-Party Access Policies

### 5.1 Access Control Principles
Third-party access must follow:
- **Least Privilege:** Minimum access necessary
- **Need-to-Know:** Access only to required information
- **Time-Limited:** Access granted for specific duration
- **Role-Based:** Access based on vendor role
- **Audit Trail:** All access logged and monitored

### 5.2 Access Types

#### Network Access
- **VPN Required:** All remote access via VPN
- **MFA Mandatory:** Multi-factor authentication required
- **IP Restrictions:** Approved IP addresses only
- **Time Restrictions:** Access hours limited if possible
- **Session Monitoring:** All sessions logged

#### System Access
- **Separate Accounts:** Unique vendor accounts (no shared)
- **Strong Authentication:** Complex passwords and MFA
- **Privileged Access:** Escalated privileges approved and monitored
- **Session Timeouts:** Automatic timeout after inactivity
- **Access Reviews:** Quarterly access reviews

#### Data Access
- **Encrypted Transmission:** All data in transit encrypted
- **Encrypted Storage:** All data at rest encrypted
- **Access Logging:** All data access logged
- **Data Minimization:** Access only to required data
- **Right to Audit:** Organization can audit data access

### 5.3 Prohibited Access
Third parties are **prohibited** from:
- Sharing access credentials
- Accessing data beyond scope
- Copying data without authorization
- Using access for unauthorized purposes
- Bypassing security controls
- Installing unauthorized software
- Connecting unauthorized devices

## 6. Vendor Security Requirements

### 6.1 Security Controls Required
Third parties must implement:
- **Encryption:** AES-256 minimum for data at rest and in transit
- **Access Controls:** Role-based access control
- **Authentication:** Multi-factor authentication
- **Monitoring:** Security event monitoring
- **Audit Logging:** Comprehensive audit logs
- **Incident Response:** Incident response procedures
- **Vulnerability Management:** Regular vulnerability scanning
- **Patch Management:** Timely security patches

### 6.2 Compliance Requirements
Third parties must demonstrate:
- **Malaffi Compliance:** Compliance with Malaffi requirements
- **ADHICS Compliance:** Compliance with ADHICS requirements
- **HIPAA Compliance:** If applicable, HIPAA compliance
- **Data Protection:** Adequate data protection measures
- **Security Certifications:** ISO 27001, SOC 2, or equivalent

### 6.3 Security Documentation Required
Third parties must provide:
- Security policies and procedures
- Security architecture documentation
- Incident response plan
- Business continuity plan
- Security audit reports
- Compliance certifications
- Security assessment reports

## 7. Vendor Agreements

### 7.1 Required Contractual Provisions
All vendor agreements must include:
- **Security Requirements:** Detailed security requirements
- **Compliance Obligations:** Regulatory compliance requirements
- **Access Controls:** Access control provisions
- **Data Protection:** Data protection and encryption requirements
- **Incident Reporting:** Security incident reporting procedures
- **Audit Rights:** Right to audit vendor security
- **Breach Notification:** Breach notification requirements
- **Data Ownership:** Clear data ownership provisions
- **Termination:** Data return/destruction upon termination
- **Liability:** Security breach liability provisions

### 7.2 Service Level Agreements (SLAs)
SLAs must include:
- **Security Metrics:** Measurable security requirements
- **Uptime Requirements:** System availability requirements
- **Response Times:** Security incident response times
- **Update Requirements:** Security patch deployment timelines
- **Backup Requirements:** Data backup and recovery requirements
- **Penalties:** Penalties for SLA violations

### 7.3 Confidentiality Agreements
All third parties must sign:
- **Non-Disclosure Agreement (NDA):** Protect confidential information
- **Data Processing Agreement:** If processing healthcare data
- **Acceptable Use Policy:** Define acceptable use of systems
- **Security Policy Acknowledgment:** Acknowledge security policies

## 8. Third-Party Monitoring and Auditing

### 8.1 Ongoing Monitoring
Monitor third-party access:
- **Connection Logging:** All connections logged
- **Activity Monitoring:** User activity monitored
- **Access Reviews:** Quarterly access reviews
- **Security Alerts:** Real-time security alerts
- **Anomaly Detection:** Unusual activity detection
- **Compliance Monitoring:** Regular compliance checks

### 8.2 Audit Procedures

#### Internal Audits
- **Quarterly Reviews:** Access and activity reviews
- **Annual Audits:** Comprehensive security audits
- **Random Audits:** Unannounced audits when needed
- **Post-Incident Audits:** Audits after security incidents

#### External Audits
Third parties must:
- Provide annual security audit reports
- Allow on-site audits if requested
- Respond to audit findings
- Implement remediation plans

### 8.3 Audit Rights
Organization reserves right to:
- **Audit Access:** Audit vendor access and activities
- **Review Logs:** Review access and audit logs
- **On-Site Inspections:** Conduct on-site security inspections
- **Penetration Testing:** Perform security testing of vendor systems
- **Third-Party Assessments:** Engage third-party security assessors

## 9. Third-Party Incident Management

### 9.1 Incident Reporting
Third parties must:
- **Report Immediately:** Report security incidents within 1 hour
- **Provide Details:** Full incident details
- **Cooperate:** Cooperate in incident investigation
- **Remediate:** Take immediate remediation steps
- **Document:** Document incident and response

### 9.2 Incident Response Coordination
- **Communication:** Regular communication during incident
- **Containment:** Coordinate containment efforts
- **Investigation:** Joint investigation as needed
- **Remediation:** Coordinate remediation activities
- **Notification:** Coordinate breach notifications
- **Post-Incident Review:** Joint post-incident review

### 9.3 Breach Notification
Third parties must:
- **Notify Immediately:** Notify organization of breaches within 1 hour
- **Provide Details:** Full breach details
- **Assist Notifications:** Assist with regulatory notifications
- **Provide Evidence:** Provide evidence and documentation
- **Remediate:** Implement remediation measures

## 10. Vendor Management

### 10.1 Vendor Onboarding
Process for onboarding vendors:
1. **Risk Assessment:** Conduct security risk assessment
2. **Requirements Review:** Review security requirements
3. **Agreement Review:** Review and approve agreements
4. **Security Review:** Review vendor security documentation
5. **Access Provisioning:** Provision access with least privilege
6. **Training:** Provide security awareness training
7. **Monitoring Setup:** Configure monitoring and logging

### 10.2 Ongoing Vendor Management
- **Regular Reviews:** Quarterly business and security reviews
- **Access Reviews:** Quarterly access reviews
- **Security Updates:** Review vendor security updates
- **Compliance Verification:** Verify ongoing compliance
- **Performance Monitoring:** Monitor vendor performance
- **Relationship Management:** Maintain vendor relationships

### 10.3 Vendor Offboarding
Process for offboarding vendors:
1. **Access Revocation:** Immediately revoke all access
2. **Data Return:** Return all organizational data
3. **Data Destruction:** Confirm data destruction
4. **Asset Return:** Return all organizational assets
5. **Exit Interview:** Conduct exit security interview
6. **Documentation:** Update vendor records
7. **Post-Termination Monitoring:** Monitor for unauthorized access

## 11. Cloud Service Providers

### 11.1 Cloud Security Requirements
Cloud providers must:
- **Compliance:** Comply with Malaffi/ADHICS/HIPAA
- **Encryption:** Encrypt data at rest and in transit
- **Access Controls:** Implement strong access controls
- **Monitoring:** Provide security monitoring capabilities
- **Audit Logs:** Provide comprehensive audit logs
- **Backup:** Maintain regular backups
- **Disaster Recovery:** Implement disaster recovery

### 11.2 Cloud Data Residency
- **Location Requirements:** Data stored in approved locations
- **Cross-Border Restrictions:** Comply with data residency requirements
- **Data Sovereignty:** Respect data sovereignty requirements
- **Backup Locations:** Approved backup locations only

### 11.3 Cloud Access Controls
- **Authentication:** MFA required for all cloud access
- **Authorization:** Role-based access control
- **Network Controls:** IP restrictions and VPN requirements
- **Session Management:** Automatic session timeouts
- **Monitoring:** Continuous monitoring of cloud access

## 12. Managed Service Providers (MSPs)

### 12.1 MSP Security Requirements
MSPs must:
- **Meet All Vendor Requirements:** All standard vendor requirements
- **24/7 Monitoring:** Provide 24/7 security monitoring
- **Incident Response:** Immediate incident response capabilities
- **Security Expertise:** Demonstrate security expertise
- **Regular Reporting:** Provide regular security reports
- **Compliance:** Maintain compliance certifications

### 12.2 MSP Access Controls
- **Separate Networks:** Separate networks for MSP access
- **Privileged Access:** Closely monitor privileged access
- **Session Recording:** Record privileged sessions
- **Approval Workflows:** Require approval for critical actions
- **Regular Reviews:** Monthly privileged access reviews

## 13. Training and Awareness

### 13.1 Vendor Training
All third parties must:
- Complete security awareness training before access
- Complete annual refresher training
- Understand security policies and procedures
- Know incident reporting procedures
- Understand compliance requirements

### 13.2 Training Topics
Training must cover:
- Organizational security policies
- Access control requirements
- Data protection requirements
- Incident reporting procedures
- Compliance requirements (Malaffi/ADHICS)
- Acceptable use of systems
- Security best practices

## 14. Compliance and Enforcement

### 14.1 Compliance Monitoring
- **Regular Checks:** Quarterly compliance checks
- **Automated Monitoring:** Continuous automated monitoring
- **Manual Reviews:** Annual manual compliance reviews
- **Audit Reports:** Review vendor audit reports
- **Certification Verification:** Verify compliance certifications

### 14.2 Enforcement
Non-compliance may result in:
- **Warnings:** Written warnings for minor violations
- **Access Restrictions:** Temporary access restrictions
- **Remediation Plans:** Required remediation plans
- **Contract Termination:** Termination of contract for serious violations
- **Legal Action:** Legal action if data breach occurs
- **Regulatory Reporting:** Reporting to regulatory authorities

## 15. Compliance

This policy ensures compliance with:
- **Malaffi Security Assessment Template v3** - TP 1.1, TP 2.1, TP 2.2
- **ADHICS Requirements** - Third-party security controls
- **HIPAA Requirements** - Business associate agreements

## 16. Related Policies

- Access Control Policy
- Incident Response Policy
- Data Classification and Handling Policy
- Remote Access Security Policy
- Vendor Management Policy

## 17. Review and Updates

This policy shall be reviewed:
- **Annually** as part of security program review
- **When new vendors are engaged**
- **After vendor security incidents**
- **When regulations change**

---

**Policy Approval:**

**IT Security Manager:** _________________ Date: _________

**Chief Information Officer:** _________________ Date: _________

**Last Reviewed:** January 2025  
**Next Review:** January 2026

