# HL7 Background Processing - Technical Architecture

## System Architecture

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │
         │ HTTP POST /api/visits
         ▼
┌─────────────────────────────────┐
│   Next.js API Route Handler     │
│   app/api/visits/route.ts       │
└────────┬────────────────────────┘
         │
         ├─► Save Assessment (Fast)
         │   └─► Returns immediately ✅
         │
         └─► Save HL7 Message (Fast)
             └─► Status: PENDING
                 └─► Returns immediately ✅

┌─────────────────────────────────┐
│   HL7 Queue Processor           │
│   scripts/hl7-queue-processor.ts │
│   (Background Process)          │
└────────┬────────────────────────┘
         │
         │ Poll every 30 seconds
         │
         ├─► Find PENDING messages
         │   └─► Order by createdAt (oldest first)
         │   └─► Limit: 10 per batch
         │
         ├─► Process each message
         │   ├─► Get school HL7 config
         │   ├─► Send to Malaffi API
         │   └─► Update status
         │
         └─► Retry Logic
             ├─► Success → Status: SENT
             ├─► Failure → Increment retryCount
             └─► Max retries → Status: FAILED
```

## Data Flow

### 1. Assessment Creation Flow

```
User Action: Create Assessment
    ↓
POST /api/visits
    ↓
Validate Data
    ↓
Save ClinicalVisit (Database)
    ↓
Save ClinicalAssessment (Database)
    ↓
Generate HL7 Message
    ↓
Save HL7Message (Database)
    Status: PENDING
    ↓
Return 200 OK (Immediate) ✅
    ↓
User sees success (No delay!)
```

### 2. Background Processing Flow

```
HL7 Queue Processor (Every 30s)
    ↓
Query: SELECT * FROM HL7Message 
       WHERE status = 'PENDING' 
       AND createdAt > NOW() - 24h
       ORDER BY createdAt ASC
       LIMIT 10
    ↓
For each message:
    ↓
    Get SchoolHL7Config
    ↓
    Call sendHL7ToMalaffi()
        ├─► Success
        │   └─► UPDATE status = 'SENT'
        │   └─► UPDATE sentAt = NOW()
        │
        └─► Failure
            ├─► retryCount < maxRetries
            │   └─► UPDATE retryCount++
            │   └─► Keep status = 'PENDING'
            │
            └─► retryCount >= maxRetries
                └─► UPDATE status = 'FAILED'
                └─► UPDATE errorMessage
```

## Database Schema

### HL7Message Model (Existing)

```prisma
model HL7Message {
  id               String           @id @default(cuid())
  messageType      String           // ADT, ORU, etc.
  messageControlId String           @unique
  studentId        String?
  visitId          String?
  schoolId         String
  messageContent   String           @db.Text
  status           HL7MessageStatus @default(PENDING)
  sentAt           DateTime?
  acknowledgedAt   DateTime?
  errorMessage     String?          @db.Text
  retryCount       Int              @default(0)
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  @@index([status])
  @@index([schoolId])
  @@index([messageControlId])
  @@index([createdAt])
}
```

**Status Values:**
- `PENDING`: Queued, waiting to be sent
- `SENT`: Successfully sent to Malaffi
- `FAILED`: Failed after max retries
- `ACKNOWLEDGED`: Received acknowledgment (future)

## Component Details

### 1. Visit API Handler

**File:** `app/api/visits/route.ts`

**Changes:**
```typescript
// BEFORE: Synchronous (blocks user)
const result = await sendHL7ToMalaffi(...);
if (!result.success) {
  // Retry logic here (blocks)
}

// AFTER: Asynchronous (non-blocking)
await prisma.hL7Message.create({
  data: {
    // ... message data ...
    status: 'PENDING', // Process in background
  },
});
// Return immediately
```

### 2. HL7 Queue Processor

**File:** `scripts/hl7-queue-processor.ts`

**Key Functions:**

#### `main()`
- Entry point
- Runs infinite loop
- Calls `processQueue()` every 30 seconds
- Handles errors gracefully

#### `processQueue()`
- Fetches pending messages from database
- Processes in batches (10 at a time)
- Calls `processMessage()` for each

#### `processMessage(message)`
- Gets school HL7 configuration
- Calls `sendHL7ToMalaffi()`
- Updates message status based on result
- Handles retry logic

#### `calculateNextRetryDelay(retryCount)`
- Exponential backoff
- Returns delay in milliseconds
- Formula: `Math.pow(2, retryCount) * 1000`

## Retry Strategy

### Exponential Backoff

| Attempt | Delay | Total Time |
|---------|-------|------------|
| 1       | 0s    | 0s         |
| 2       | 1s    | 1s         |
| 3       | 2s    | 3s         |
| 4       | 4s    | 7s         |
| 5       | 8s    | 15s        |
| 6       | 16s   | 31s        |

**Max Retries:** 5 (configurable per school)
**Max Age:** 24 hours (messages older are skipped)

### Retry Logic Flow

```
Message Status: PENDING
    ↓
Send to Malaffi
    ↓
    ├─► Success
    │   └─► Status: SENT ✅
    │
    └─► Failure
        ├─► retryCount < maxRetries
        │   └─► retryCount++
        │   └─► Status: PENDING (retry later)
        │
        └─► retryCount >= maxRetries
            └─► Status: FAILED ❌
            └─► Log error message
```

## Error Handling

### Network Errors
- Connection timeout (30s)
- DNS resolution failure
- Network unreachable
- **Action:** Retry with exponential backoff

### API Errors
- HTTP 4xx (Client errors)
- HTTP 5xx (Server errors)
- **Action:** Retry (may be temporary)

### Permanent Errors
- Invalid API key
- Invalid message format
- **Action:** Mark as FAILED immediately

## Performance Considerations

### Database Queries
- Indexed on `status` and `createdAt` for fast queries
- Batch processing (10 messages) reduces query overhead
- Order by `createdAt` ensures FIFO processing

### API Rate Limiting
- Max 1 message per second to Malaffi
- Prevents API overload
- Configurable per school

### Memory Usage
- Processes 10 messages at a time
- Low memory footprint
- Suitable for long-running process

## Monitoring

### Logs
- All processing attempts logged
- Success/failure logged
- Errors logged with stack traces
- Location: `logs/hl7-processor.log`

### Metrics to Track
- Messages processed per hour
- Success rate (%)
- Average processing time
- Failed message count
- Retry distribution

### Health Checks
- Processor running (PM2 status)
- Database connectivity
- Malaffi API connectivity
- Queue size (pending messages)

## Deployment

### Development
```bash
# Run processor manually
node scripts/hl7-queue-processor.js
```

### Production (PM2)
```bash
# Start with PM2
pm2 start ecosystem.config.js --only hl7-processor

# Or use batch script
run\start-hl7-processor.bat
```

### PM2 Configuration
```javascript
{
  name: 'hl7-processor',
  script: './scripts/hl7-queue-processor.js',
  instances: 1,
  exec_mode: 'fork',
  autorestart: true,
  max_restarts: 10,
  min_uptime: '10s',
  watch: false,
  error_file: './logs/hl7-processor-error.log',
  out_file: './logs/hl7-processor-out.log',
}
```

## Security Considerations

1. **API Key Protection:**
   - Stored in environment variables
   - Never logged

2. **Database Access:**
   - Uses Prisma client (type-safe)
   - Connection pooling

3. **Error Messages:**
   - Don't expose sensitive data
   - Log errors securely

## Scalability

### Current Design
- Single processor instance
- Suitable for: < 1000 messages/hour

### Future Scaling Options

1. **Multiple Processors:**
   - Run multiple instances
   - Use database locks to prevent duplicates

2. **Message Queue (Redis/Bull):**
   - Better for high volume
   - Distributed processing
   - Priority queues

3. **Cloud Functions:**
   - Serverless processing
   - Auto-scaling
   - Pay per use

## Dependencies

### Required
- `@prisma/client` - Database access
- `next` - Type definitions
- Node.js 18+

### Optional (Future)
- `bull` or `bullmq` - Job queue
- `redis` - Queue storage
- `winston` - Advanced logging

## Configuration

### Environment Variables
```env
DATABASE_URL=postgresql://...
MALAFFI_API_URL=https://api.malaffi.ae/hl7
MALAFFI_API_KEY=...
NODE_ENV=production
```

### School-Level Configuration
- `retryAttempts`: Max retries (default: 3-5)
- `autoSend`: Enable/disable auto-send
- `environment`: test/production
- `enabled`: Enable/disable HL7 for school

---

**Last Updated:** 2025-01-21

