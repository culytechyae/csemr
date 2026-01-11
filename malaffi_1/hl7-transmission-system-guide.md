# HL7 Transmission System - Complete Guide

## Overview

The HL7 Transmission System provides automatic monitoring and transmission of clinic visits and health records to Malaffi via HL7 messages. The system includes real-time monitoring, automatic message generation, transmission logging, and a web-based monitoring interface.

## System Components

### 1. Automatic Monitoring Service
- **File**: `app/transmission/monitor.py`
- **Purpose**: Continuously monitors for new clinic visits and health records
- **Frequency**: Checks every 30 seconds
- **Actions**: Automatically generates and transmits HL7 messages

### 2. HL7 Message Generators
- **File**: `app/transmission/visit_generator.py`
- **Purpose**: Generates HL7 messages for clinic visits
- **Message Types**: ADT^A01 (Admission), ADT^A03 (Discharge)

### 3. Transmission API
- **File**: `app/routes/api/transmission_api.py`
- **Purpose**: REST API endpoints for manual transmission
- **Endpoints**:
  - `POST /api/transmission/visit/<id>/transmit`
  - `POST /api/transmission/health-record/<id>/transmit`
  - `GET /api/transmission/status`

### 4. Web Monitoring Interface
- **File**: `app/templates/transmission/monitor.html`
- **URL**: `/transmission/monitor`
- **Features**: Real-time status, transmission logs, statistics

### 5. Logging Service
- **File**: `app/transmission/log_service.py`
- **Purpose**: Manages transmission logs and statistics
- **Log Files**: `logs/hl7_transmission.log`, `logs/hl7_transmission.json`

## How It Works

### Automatic Process Flow

1. **Monitoring Loop** (Every 30 seconds):
   - Checks for new clinic visits (last 5 minutes)
   - Checks for new health records (last 5 minutes)
   - Processes items that haven't been transmitted

2. **For Each New Visit**:
   - Generates ADT^A01 (Patient Admission) message
   - Transmits to Malaffi via HL7TransmissionService
   - Updates visit record with transmission status
   - Logs transmission result

3. **For Each New Health Record**:
   - Generates ORU^R01 (Observation Result) message
   - Transmits to Malaffi via HL7TransmissionService
   - Updates health record with transmission status
   - Logs transmission result

### Manual Transmission

1. **Via Web Interface**:
   - Navigate to `/transmission/monitor`
   - View real-time transmission status
   - Monitor transmission logs

2. **Via API**:
   - Use REST endpoints for programmatic access
   - Transmit specific visits or health records
   - Get transmission status and statistics

## Configuration

### HL7 Message Settings (From Actual Working Messages)

**MSH Segment Configuration:**
- **Sending Application**: `MF7163` (Your facility code)
- **Sending Facility**: `MF7163` (Same as application)
- **Receiving Application**: `Rhapsody^MALAFFI`
- **Receiving Facility**: `ADHIE`
- **HL7 Version**: `2.5.1`
- **Processing ID**: `P` (Production)

**Message Format:**
```
MSH|^~\&|MF7163^MF7163|MF7163^MF7163|Rhapsody^MALAFFI|ADHIE|YYYYMMDDHHMMSS+0400||ADT^A01|message_id|P|2.5.1
```

**Patient Class Settings (Critical):**
- **ADT^A01** (Admit): Patient Class = `I` (Inpatient) - **MANDATORY**
- **ADT^A03** (Discharge): Patient Class = `I` or `O` (based on visit type)
- **ADT^A04** (Register): Patient Class = `O` (Outpatient) - **MANDATORY**
- **ADT^A08** (Update): Patient Class = `I` or `O` (based on visit type)

**Doctor ID Validation:**
- All doctor IDs must be registered in Modaqeq validation tables
- Default valid IDs: `GD18668`, `DOC001`, `DR001`
- Invalid IDs are automatically replaced with `DEFAULT_DOCTOR_ID`

**See `GUIDE/malaffi-configuration-guide.md` for complete configuration details.**

### Monitoring Settings
- **Check Interval**: 30 seconds
- **Lookback Period**: 5 minutes
- **Log Retention**: 1000 entries
- **Log Rotation**: Daily

## Usage Instructions

### Starting the System

1. **Start Main Application**:
   ```bash
   python start_cmr.py
   ```

2. **Start Transmission Monitor** (Separate Terminal):
   ```bash
   python start_transmission_monitor.py
   ```

### Accessing the Monitor

1. **Web Interface**:
   - URL: `http://localhost:5000/transmission/monitor`
   - Login: `admin` / `password123`

2. **API Endpoints**:
   - Status: `GET /api/transmission/status`
   - Logs: `GET /api/transmission/log`

### Manual Transmission

1. **Transmit Visit**:
   ```bash
   curl -X POST http://localhost:5000/api/transmission/visit/1/transmit
   ```

2. **Transmit Health Record**:
   ```bash
   curl -X POST http://localhost:5000/api/transmission/health-record/1/transmit
   ```

## Monitoring Features

### Real-time Dashboard
- **Total Transmitted**: Count of successful transmissions
- **Pending**: Count of records awaiting transmission
- **Failed**: Count of failed transmissions
- **Total Records**: Overall record count

### Transmission Logs
- **Real-time Updates**: Auto-refresh every 30 seconds
- **Status Indicators**: Success, Failed, Pending
- **Detailed Information**: Timestamps, patient IDs, error messages
- **Filtering**: By status, time range, record type

### Statistics
- **Success Rate**: Percentage of successful transmissions
- **Transmission Volume**: Daily/hourly transmission counts
- **Error Analysis**: Common failure reasons
- **Performance Metrics**: Average transmission time

## Database Integration

### Visit Records
- **New Fields Added**:
  - `hl7_transmission_status`: SUCCESS, FAILED, PENDING
  - `hl7_transmission_time`: Timestamp of transmission
  - `hl7_message_id`: Unique message identifier
  - `hl7_error_message`: Error details if failed

### Health Records
- **New Fields Added**:
  - `hl7_transmission_status`: SUCCESS, FAILED, PENDING
  - `hl7_transmission_time`: Timestamp of transmission
  - `hl7_message_id`: Unique message identifier
  - `hl7_error_message`: Error details if failed

## Logging and Troubleshooting

### Log Files
1. **Application Logs**: `logs/hl7_transmission_monitor.log`
2. **Transmission Logs**: `logs/hl7_transmission.log`
3. **JSON Logs**: `logs/hl7_transmission.json`

### Common Issues

1. **Transmission Failures**:
   - Check Malaffi connectivity
   - Verify HL7 message format
   - Review error messages in logs
   - Ensure `MALAFFI_ENABLED=true` in `.env`
   - Verify `MALAFFI_API_KEY` is set correctly

2. **Modaqeq Validation Errors**:
   - **Error 1014**: "Field value not found in validation table"
     - **Fix**: Use doctor ID from `VALID_DOCTOR_IDS` list
     - Register new doctor IDs in Modaqeq validation tables
   - **Error 1061**: "Unexpected Value" for Patient Class
     - **Fix**: ADT^A01 must use `I` (Inpatient)
     - **Fix**: ADT^A04 must use `O` (Outpatient)
   - **Field too long**: Truncate field to allowed length
   - **Required field missing**: Ensure all mandatory fields are populated

3. **Message Generation Issues**:
   - Verify `MSG_Send/` folder exists and is writable
   - Check database connection
   - Ensure visit records exist
   - Review application logs for errors

2. **Monitor Not Starting**:
   - Check database connection
   - Verify all dependencies installed
   - Review application logs

3. **Missing Transmissions**:
   - Check monitoring interval
   - Verify record timestamps
   - Review transmission status fields

### Debugging Steps

1. **Check Monitor Status**:
   ```bash
   tail -f logs/hl7_transmission_monitor.log
   ```

2. **Review Transmission Logs**:
   ```bash
   tail -f logs/hl7_transmission.log
   ```

3. **Check Database Records**:
   ```sql
   SELECT * FROM clinic_visits WHERE hl7_transmission_status IS NOT NULL;
   SELECT * FROM health_records WHERE hl7_transmission_status IS NOT NULL;
   ```

## API Reference

### Transmission Status
```http
GET /api/transmission/status
```
**Response**:
```json
{
  "visits": {
    "total": 100,
    "transmitted": 95,
    "failed": 3,
    "pending": 2
  },
  "health_records": {
    "total": 50,
    "transmitted": 48,
    "failed": 1,
    "pending": 1
  }
}
```

### Transmit Visit
```http
POST /api/transmission/visit/<visit_id>/transmit
```
**Response**:
```json
{
  "success": true,
  "message": "HL7 message transmitted successfully",
  "message_id": "MSG123456",
  "transmission_time": "2025-10-22T12:00:00Z"
}
```

### Transmit Health Record
```http
POST /api/transmission/health-record/<record_id>/transmit
```
**Response**:
```json
{
  "success": true,
  "message": "HL7 messages transmitted successfully (2/2)",
  "results": [
    {
      "message_type": "ORU^R01",
      "success": true,
      "message_id": "MSG123457"
    }
  ],
  "transmission_time": "2025-10-22T12:00:00Z"
}
```

## Security Considerations

### Authentication
- All API endpoints require login
- Web interface uses session-based authentication
- Monitor service runs with application context

### Data Protection
- HL7 messages contain patient data
- Transmission logs include sensitive information
- Access controls implemented for all endpoints

### Error Handling
- Failed transmissions are logged with error details
- Sensitive information is not exposed in error messages
- Automatic retry mechanisms for transient failures

## Performance Optimization

### Monitoring Efficiency
- Batch processing for multiple records
- Configurable check intervals
- Efficient database queries

### Log Management
- Automatic log rotation
- Configurable retention periods
- JSON format for easy parsing

### Resource Usage
- Minimal memory footprint
- Efficient database connections
- Optimized HL7 message generation

## Maintenance

### Regular Tasks
1. **Monitor Log Files**: Check for errors and warnings
2. **Review Statistics**: Ensure high success rates
3. **Update Dependencies**: Keep transmission service updated
4. **Backup Logs**: Archive transmission logs regularly

### System Updates
1. **Code Changes**: Restart monitor service
2. **Configuration Changes**: Update settings and restart
3. **Database Changes**: Run migrations as needed

## Support and Troubleshooting

### Getting Help
1. **Check Logs**: Review all log files for errors
2. **Monitor Status**: Use web interface to check system health
3. **API Testing**: Use endpoints to test individual components
4. **Database Queries**: Check record status in database

### Common Solutions
1. **Restart Monitor**: Stop and restart transmission monitor
2. **Clear Logs**: Archive old logs if disk space is low
3. **Check Connectivity**: Verify Malaffi connection
4. **Review Configuration**: Ensure all settings are correct

---

## Related Documentation

- **MALAFFI Configuration Guide**: `GUIDE/malaffi-configuration-guide.md`
  - Complete setup instructions
  - Environment variables
  - Modaqeq validation setup
  - Doctor ID configuration
  - Troubleshooting guide

- **HL7 Data Types Guide**: `GUIDE/hl7-data-types-guide.md`
  - HL7 standard code tables
  - Data type specifications
  - Field format requirements

- **Working HL7 Samples**: `hl7_samples/actual/`
  - Validated ADT messages
  - Reference for message format
  - Tested with Modaqeq

---

**HL7 Transmission System**  
Version: 2.0  
Last Updated: December 17, 2025  
Status: Production Ready  
Based on: Validated HL7 messages from `hl7_samples/actual/`
