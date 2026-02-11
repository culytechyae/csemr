# Infrastructure Security Guidance Document
## School Clinic EMR System

**Document Version:** 1.0  
**Effective Date:** January 2025  
**Review Frequency:** Annually  
**Owner:** IT Security & Infrastructure Team

---

## 1. Purpose

This document provides guidance for infrastructure-level security controls that complement application-level security. These controls are managed at the infrastructure/deployment level and are required for complete Malaffi compliance.

## 2. Scope

This document addresses infrastructure-level security requirements:
- Physical and environmental security
- Wireless network security
- Network architecture and segmentation
- Anti-malware deployment and management
- Patch management procedures
- Network vulnerability management
- Network security controls review

## 3. Physical and Environmental Security (PE 1.1)

### 3.1 Requirements
Physical and environmental security policies must ensure adequate physical and environmental protection of information assets.

### 3.2 Recommendations

#### Data Center/Server Room Security
- **Access Controls:** Controlled access with badge readers or biometrics
- **Visitor Logging:** All visitors logged and escorted
- **Surveillance:** CCTV cameras covering entrances and critical areas
- **Environmental Controls:** Temperature, humidity, and fire suppression systems
- **Physical Locks:** Secure locks on server room doors
- **Alarms:** Intrusion detection and alarm systems

#### Workstation Security
- **Clean Desk Policy:** Clear desk when unattended
- **Screen Locks:** Automatic screen locks after 5 minutes
- **Secure Storage:** Lock filing cabinets for sensitive documents
- **Visitor Access:** Controlled visitor access to work areas
- **Secure Disposal:** Secure disposal of sensitive documents

### 3.3 Documentation Required
- Physical security policy document
- Access control procedures
- Visitor access procedures
- Environmental monitoring procedures
- Incident response procedures for physical security

---

## 4. Wireless Network Security (AC 5.7, CM 5.4)

### 4.1 Requirements
- Controls to ensure wireless access is secured
- Strong encryption for all wireless connections
- Segregation of public/guest networks from internal networks

### 4.2 Recommendations

#### Wireless Encryption
- **WPA3 Preferred:** Use WPA3 for new deployments
- **WPA2-Enterprise Minimum:** WPA2-Enterprise as minimum for existing
- **AES Encryption:** Use AES encryption (not TKIP)
- **Strong Passwords:** Enterprise authentication with strong passwords
- **No WEP:** WEP is prohibited

#### Network Segregation
- **Separate VLANs:** Guest network on separate VLAN
- **Firewall Rules:** Firewall rules to prevent guest access to internal network
- **Bandwidth Limiting:** Limit bandwidth for guest networks
- **Captive Portal:** Captive portal for guest network access
- **Time-Limited Access:** Guest access time-limited if possible

#### Wireless Access Points
- **Centralized Management:** Centralized wireless management
- **Regular Updates:** Regular firmware updates
- **Monitoring:** Monitor for rogue access points
- **Strong Passwords:** Change default passwords immediately
- **Disabled Features:** Disable unnecessary features (WPS if not needed)

### 4.3 Documentation Required
- Wireless network security policy
- Network architecture diagram showing segregation
- Wireless access configuration documentation
- Guest network access procedures
- Rogue access point detection procedures

---

## 5. Network Architecture and Components (CM 5.1)

### 5.1 Requirements
- All network components and interconnections identified, documented, controlled and protected
- Procedures to regularly identify threats and vulnerabilities
- Security controls implemented and regularly reviewed
- Controls to only allow trusted devices and users
- Procedures to continually monitor control effectiveness
- Network segregation based on criticality

### 5.2 Recommendations

#### Network Documentation
- **Network Diagram:** Complete network topology diagram
- **Component Inventory:** Inventory of all network devices
- **Interconnection Map:** Document all network interconnections
- **IP Address Schema:** Document IP addressing scheme
- **VLAN Configuration:** Document VLAN assignments
- **Firewall Rules:** Document firewall rules and policies

#### Network Segmentation
- **DMZ:** Demilitarized zone for public-facing systems
- **Internal Networks:** Separate networks for internal systems
- **Guest Networks:** Isolated guest networks
- **Management Networks:** Separate management networks
- **Wireless Networks:** Separate wireless networks with appropriate access
- **VPN Networks:** Separate VPN network segments

#### Network Security Controls
- **Firewalls:** Firewalls at network boundaries
- **Intrusion Prevention:** IPS/IDS systems
- **Network Access Control (NAC):** NAC for device trust
- **Network Monitoring:** Network monitoring and logging
- **Traffic Analysis:** Regular traffic analysis
- **Threat Intelligence:** Threat intelligence integration

### 5.3 Documentation Required
- Complete network architecture documentation
- Network component inventory
- Network security controls documentation
- Network monitoring procedures
- Vulnerability management procedures

---

## 6. Anti-Malware Protection (OM 4.1)

### 6.1 Requirements
- Real-time anti-malware protection on all end user devices and servers
- Anti-malware mechanisms regularly updated and current
- Removable media scanned automatically
- Auto-run features disabled for removable media

### 6.2 Recommendations

#### Anti-Malware Deployment
- **Centralized Management:** Centralized anti-malware management
- **All Endpoints:** Anti-malware on all workstations, servers, and mobile devices
- **Real-Time Scanning:** Real-time scanning enabled
- **Scheduled Scans:** Daily scheduled full scans
- **Quarantine:** Automatic quarantine of detected malware

#### Anti-Malware Updates
- **Automatic Updates:** Automatic signature updates enabled
- **Update Frequency:** Multiple updates daily if available
- **Update Verification:** Verify updates are successful
- **Engine Updates:** Regular engine updates
- **Monitoring:** Monitor update status

#### Removable Media Protection
- **Automatic Scanning:** Auto-scan removable media on connection
- **Block Infected Media:** Block access to infected media
- **Alert Users:** Alert users of infections
- **Log Scanning:** Log all scanning activities
- **Disable Auto-run:** Disable Windows AutoRun/AutoPlay

### 6.3 Documentation Required
- Anti-malware deployment policy
- Anti-malware configuration documentation
- Update procedures
- Incident response procedures for malware infections
- Exception handling procedures

---

## 7. Patch Management (OM 1, OM 2, OM 6.5)

### 7.1 Requirements
- Timely software updates/patches applied to systems, servers and network devices
- Formal patch management procedures

### 7.2 Recommendations

#### Patch Management Process
- **Inventory:** Maintain inventory of all systems and software
- **Patch Sources:** Identify and monitor patch sources
- **Risk Assessment:** Assess patch criticality and risk
- **Testing:** Test patches in non-production environment
- **Deployment:** Deploy patches following change control
- **Verification:** Verify patch installation
- **Documentation:** Document all patch activities

#### Patch Prioritization
- **Critical Patches:** Deploy critical security patches within 7 days
- **High Patches:** Deploy high-severity patches within 30 days
- **Medium Patches:** Deploy medium-severity patches within 90 days
- **Low Patches:** Deploy low-severity patches in next maintenance window

#### Application Dependencies
- **npm audit:** Regular npm audit for Node.js dependencies
- **Automated Scanning:** Automated vulnerability scanning
- **Update Procedures:** Procedures for updating application dependencies
- **Testing:** Test dependency updates before production

### 7.3 Documentation Required
- Patch management policy and procedures
- Patch deployment schedule
- Change control procedures
- Patch testing procedures
- Patch rollback procedures

---

## 8. Network Vulnerability Management (CM 5.1)

### 8.1 Requirements
- Procedures to regularly identify threats and vulnerabilities affecting network components
- Security controls implemented and regularly reviewed
- Procedures to continually monitor control effectiveness

### 8.2 Recommendations

#### Vulnerability Scanning
- **Regular Scanning:** Monthly vulnerability scans minimum
- **External Scans:** Quarterly external vulnerability scans
- **Internal Scans:** Monthly internal vulnerability scans
- **Authenticated Scans:** Authenticated scans for deeper analysis
- **Compliance Scanning:** Regular compliance scanning

#### Threat Identification
- **Threat Intelligence:** Subscribe to threat intelligence feeds
- **Security Advisories:** Monitor security advisories
- **Vulnerability Databases:** Monitor vulnerability databases (CVE, NVD)
- **Industry Sources:** Monitor industry-specific threat sources

#### Vulnerability Remediation
- **Prioritization:** Prioritize vulnerabilities by risk
- **Remediation Plans:** Develop remediation plans
- **Tracking:** Track remediation progress
- **Verification:** Verify remediation effectiveness
- **Exception Handling:** Document and approve exceptions

#### Control Review
- **Quarterly Reviews:** Quarterly review of security controls
- **Annual Assessments:** Annual comprehensive security assessment
- **Effectiveness Metrics:** Track control effectiveness metrics
- **Improvement Plans:** Develop control improvement plans

### 8.3 Documentation Required
- Vulnerability management policy
- Vulnerability scanning schedule
- Threat identification procedures
- Remediation procedures
- Control review procedures

---

## 9. Implementation Checklist

### 9.1 Physical Security
- [ ] Physical security policy documented
- [ ] Access controls implemented
- [ ] Visitor logging implemented
- [ ] CCTV surveillance installed
- [ ] Environmental controls in place
- [ ] Clean desk policy implemented

### 9.2 Wireless Security
- [ ] Wireless encryption configured (WPA3/WPA2-Enterprise)
- [ ] Network segregation implemented
- [ ] Guest network isolated
- [ ] Wireless access points secured
- [ ] Rogue access point detection implemented

### 9.3 Network Architecture
- [ ] Network diagram documented
- [ ] Network components inventoried
- [ ] Network segmentation implemented
- [ ] Firewall rules documented
- [ ] Network monitoring implemented

### 9.4 Anti-Malware
- [ ] Anti-malware deployed on all endpoints
- [ ] Automatic updates configured
- [ ] Removable media scanning enabled
- [ ] Auto-run disabled
- [ ] Centralized management configured

### 9.5 Patch Management
- [ ] Patch management policy documented
- [ ] System inventory maintained
- [ ] Patch testing procedures established
- [ ] Automated patch deployment configured
- [ ] Application dependency scanning implemented

### 9.6 Vulnerability Management
- [ ] Vulnerability scanning schedule established
- [ ] Vulnerability scanning tools deployed
- [ ] Threat intelligence sources identified
- [ ] Remediation procedures documented
- [ ] Control review procedures established

---

## 10. Compliance

This guidance ensures compliance with:
- **Malaffi Security Assessment Template v3** - PE 1.1, AC 5.7, CM 5.1, CM 5.3, CM 5.4, OM 1, OM 2, OM 4.1, OM 6.5
- **ADHICS Requirements** - Infrastructure security controls
- **HIPAA Requirements** - Physical and technical safeguards

---

## 11. Coordination

These infrastructure-level controls must be coordinated with:
- **IT Infrastructure Team:** Implementation and maintenance
- **IT Security Team:** Security oversight and monitoring
- **Application Team:** Integration with application security
- **Management:** Budget and resource allocation

---

## 12. Review and Updates

This guidance shall be reviewed:
- **Annually** as part of security program review
- **When infrastructure changes**
- **After security incidents**
- **When regulations change**

---

**Document Approval:**

**IT Security Manager:** _________________ Date: _________

**Infrastructure Manager:** _________________ Date: _________

**Chief Information Officer:** _________________ Date: _________

**Last Reviewed:** January 2025  
**Next Review:** January 2026

