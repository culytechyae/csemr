# HL7 Background Processing Implementation Plan

## Problem Statement

Currently, when creating a new assessment, the system attempts to send HL7 messages to Malaffi API synchronously. This causes significant delays (up to 30+ seconds) when:
- Network connectivity is poor
- Malaffi API is slow or unavailable
- Multiple retry attempts are needed (3 attempts with exponential backoff)

**User Impact:**
- Users experience 5-30+ second delays when creating assessments
- Poor user experience with loading states
- Potential timeout errors
- Users may think the system is frozen

## Solution Overview

**Implement asynchronous background processing for HL7 messages:**
1. Save assessment to database immediately (fast response)
2. Queue HL7 message for background processing
3. Process queue asynchronously with retry logic
4. Track status and provide visibility

## Current Architecture

### Current Flow (Synchronous)
```
User creates assessment
  ↓
Save to database
  ↓
Generate HL7 message
  ↓
Save HL7 message (status: PENDING)
  ↓
[BLOCKING] Send to Malaffi (3 retries, 30s timeout each)
  ↓
Update HL7 message status (SENT/FAILED)
  ↓
Return response to user
```

**Issues:**
- User waits for entire HL7 send process
- Network delays block user interaction
- Timeout errors affect user experience

### Proposed Flow (Asynchronous)
```
User creates assessment
  ↓
Save to database
  ↓
Generate HL7 message
  ↓
Save HL7 message (status: PENDING)
  ↓
Return success response immediately ✅
  ↓
[BACKGROUND] Process HL7 queue
  ↓
Send to Malaffi with retries
  ↓
Update HL7 message status (SENT/FAILED)
```

**Benefits:**
- Instant user response (< 1 second)
- No blocking on network calls
- Better user experience
- Failed messages can be retried later

## Implementation Details

### Phase 1: Database Schema (No Changes Needed)

The existing `HL7Message` model already supports this:
- `status`: PENDING, SENT, FAILED, ACKNOWLEDGED
- `retryCount`: Track retry attempts
- `errorMessage`: Store error details
- `sentAt`: Timestamp when successfully sent

**Status:** ✅ Already implemented

### Phase 2: Modify Visit Creation API

**File:** `app/api/visits/route.ts`

**Changes:**
1. Remove synchronous HL7 sending from POST handler
2. Save HL7 message with status PENDING
3. Return success response immediately
4. Queue message for background processing

**Code Changes:**
```typescript
// BEFORE: Synchronous sending
const result = await sendHL7ToMalaffi(hl7Message, messageControlId, environment);
// ... wait for result ...

// AFTER: Queue for background processing
await prisma.hL7Message.create({
  data: {
    messageType: assessment ? 'ORU' : 'ADT',
    messageControlId,
    studentId: student.id,
    visitId: visit.id,
    schoolId: school.id,
    messageContent: hl7Message,
    status: 'PENDING', // Will be processed in background
  },
});
// Return immediately - no waiting
```

### Phase 3: Background Processing Service

**New File:** `scripts/hl7-queue-processor.ts`

**Purpose:**
- Process pending HL7 messages from database
- Retry failed messages
- Handle errors gracefully
- Log processing status

**Features:**
1. **Auto-Retry for Pending Messages:**
   - **Polling Interval:** Check for pending messages every 30 seconds (configurable)
   - **Continuous Processing:** Automatically retry all PENDING messages at regular intervals
   - **Retry Strategy:**
     - Initial attempt: Immediate when message is created
     - Subsequent retries: Exponential backoff based on retryCount
     - Retry intervals: 30s, 1m, 2m, 5m, 10m, 30m, 1h (after each retry)
     - Max retries: 5 attempts (configurable per school)
     - Max age: Retry messages up to 24 hours old
   - **Smart Retry Logic:**
     - Messages with retryCount = 0: Process immediately
     - Messages with retryCount = 1: Wait 30 seconds between retries
     - Messages with retryCount = 2: Wait 1 minute between retries
     - Messages with retryCount = 3: Wait 2 minutes between retries
     - Messages with retryCount = 4: Wait 5 minutes between retries
     - Messages with retryCount >= 5: Mark as FAILED
2. **Batch Processing:** Process up to 10 messages per batch
3. **Error Handling:**
   - Log all errors
   - Update message status
   - Continue processing other messages
4. **Rate Limiting:**
   - Max 1 message per second to Malaffi API
   - Prevent API overload

**Implementation Options:**

#### Option A: Standalone Node.js Script (Recommended)
- Run as separate process
- Can be managed with PM2
- Independent of main application
- Easy to restart/stop

#### Option B: Next.js API Route with Cron
- Use API route with scheduled execution
- Simpler deployment (no separate process)
- Dependent on Next.js server

#### Option C: Background Job Queue (Bull/BullMQ)
- More robust solution
- Better for high volume
- Requires Redis
- More complex setup

**Recommendation:** Option A (Standalone script) for simplicity and reliability

### Phase 4: Queue Processor Script

**File:** `scripts/hl7-queue-processor.ts`

**Structure:**
```typescript
async function processHL7Queue() {
  // 1. Find pending messages (oldest first)
  // Include retry delay logic: only process messages that are due for retry
  const now = new Date();
  const pendingMessages = await prisma.hL7Message.findMany({
    where: {
      status: 'PENDING',
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      },
      OR: [
        { retryCount: 0 }, // New messages (retry immediately)
        { 
          // Messages due for retry based on exponential backoff
          updatedAt: {
            lte: new Date(now.getTime() - calculateRetryDelay(retryCount) * 1000)
          }
        }
      ]
    },
    orderBy: { createdAt: 'asc' },
    take: 10, // Process 10 at a time
  });

  // 2. Process each message
  for (const message of pendingMessages) {
    await processMessage(message);
  }
}

function calculateRetryDelay(retryCount: number): number {
  // Exponential backoff: 30s, 1m, 2m, 5m, 10m, 30m
  const delays = [30, 60, 120, 300, 600, 1800]; // seconds
  return delays[Math.min(retryCount, delays.length - 1)];
}

async function processMessage(message: HL7Message) {
  try {
    // Get school config
    const hl7Config = await getHL7Config(message.schoolId);
    
    // Send to Malaffi
    const result = await sendHL7ToMalaffi(
      message.messageContent,
      message.messageControlId,
      hl7Config?.environment || 'test'
    );

    if (result.success) {
      // Update status to SENT
      await prisma.hL7Message.update({
        where: { id: message.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    } else {
      // Increment retry count
      const newRetryCount = message.retryCount + 1;
      const maxRetries = hl7Config?.retryAttempts || 5;

      if (newRetryCount >= maxRetries) {
        // Mark as FAILED after max retries
        await prisma.hL7Message.update({
          where: { id: message.id },
          data: {
            status: 'FAILED',
            errorMessage: result.error,
            retryCount: newRetryCount,
          },
        });
      } else {
        // Keep as PENDING for retry
        await prisma.hL7Message.update({
          where: { id: message.id },
          data: {
            retryCount: newRetryCount,
            errorMessage: result.error,
          },
        });
      }
    }
  } catch (error) {
    // Log error and continue
    console.error(`Error processing HL7 message ${message.id}:`, error);
  }
}
```

### Phase 5: Start Script Integration

**File:** `run/start-hl7-processor.bat` (Windows)

**Purpose:** Start the HL7 queue processor as a background service

**Implementation:**
```batch
@echo off
REM Start HL7 Queue Processor
node scripts/hl7-queue-processor.js
```

**PM2 Configuration:**
Add to `ecosystem.config.js`:
```javascript
{
  name: 'hl7-processor',
  script: './scripts/hl7-queue-processor.js',
  instances: 1,
  exec_mode: 'fork',
  autorestart: true,
  max_restarts: 10,
  watch: false,
}
```

### Phase 6: Manual Retry UI (Admin Dashboard)

**New File:** `app/admin/hl7/page.tsx`

**Purpose:**
- Provide admin interface to view and manage HL7 messages
- Manual retry functionality for pending/failed messages
- Monitor HL7 message status

**Features:**
1. **HL7 Messages List:**
   - Display all HL7 messages with status
   - Filter by status (PENDING, SENT, FAILED)
   - Filter by school
   - Filter by date range
   - Show retry count and error messages

2. **Manual Retry Actions:**
   - **Retry All Pending:** Button to retry all PENDING messages immediately
   - **Retry Selected:** Checkbox selection to retry specific messages
   - **Retry Failed:** Button to retry all FAILED messages
   - **Individual Retry:** Retry button for each message

3. **Status Display:**
   - Pending count with last retry time
   - Failed count with error summary
   - Success rate percentage
   - Processing status indicator

**API Endpoint:** `app/api/hl7/retry/route.ts`

**Functionality:**
```typescript
// POST /api/hl7/retry
// Body: { messageIds?: string[], retryAll?: boolean, status?: 'PENDING' | 'FAILED' }

// Retry all pending messages
POST /api/hl7/retry
{ "retryAll": true, "status": "PENDING" }

// Retry specific messages
POST /api/hl7/retry
{ "messageIds": ["id1", "id2", "id3"] }

// Retry all failed messages
POST /api/hl7/retry
{ "retryAll": true, "status": "FAILED" }
```

**Implementation:**
- Reset retryCount to 0 for retried messages
- Update status back to PENDING
- Clear error messages
- Queue messages for immediate processing

### Phase 7: Monitoring & Logging

**Features:**
1. **Logging:**
   - Log all processing attempts
   - Log successes and failures
   - Log retry attempts
   - Log manual retry actions
   - Store in `logs/hl7-processor.log`

2. **Metrics:**
   - Messages processed per hour
   - Success rate
   - Average processing time
   - Failed message count
   - Auto-retry vs manual retry statistics

3. **Dashboard:**
   - Show pending HL7 messages count (already exists)
   - Show failed messages count
   - Show processing status
   - Show last retry time for pending messages

## Implementation Steps

### Step 1: Modify Visit API (30 minutes)
- [ ] Remove synchronous HL7 sending from `app/api/visits/route.ts`
- [ ] Keep HL7 message creation (status: PENDING)
- [ ] Test assessment creation speed

### Step 2: Create Queue Processor (2 hours)
- [ ] Create `scripts/hl7-queue-processor.ts`
- [ ] Implement message fetching logic
- [ ] Implement retry logic with exponential backoff
- [ ] Add error handling
- [ ] Add logging

### Step 3: Create Start Script (15 minutes)
- [ ] Create `run/start-hl7-processor.bat`
- [ ] Add to PM2 ecosystem config
- [ ] Test script execution

### Step 4: Create Manual Retry UI (1.5 hours)
- [ ] Create `app/admin/hl7/page.tsx` - Admin HL7 management page
- [ ] Create `app/api/hl7/retry/route.ts` - Retry API endpoint
- [ ] Implement message list with filters
- [ ] Implement "Retry All Pending" button
- [ ] Implement "Retry Selected" functionality
- [ ] Implement "Retry Failed" button
- [ ] Add status indicators and statistics
- [ ] Test manual retry functionality

### Step 5: Testing (1 hour)
- [ ] Test with network available
- [ ] Test with network unavailable
- [ ] Test retry logic
- [ ] Test message status updates
- [ ] Verify user experience (no delays)

### Step 6: Documentation (30 minutes)
- [ ] Update README with new process
- [ ] Document how to start/stop processor
- [ ] Document monitoring

## Testing Plan

### Test Case 1: Normal Operation
1. Create assessment with good network
2. Verify assessment saved immediately
3. Verify HL7 message queued (status: PENDING)
4. Wait 30 seconds
5. Verify HL7 message sent (status: SENT)

### Test Case 2: Network Failure
1. Disconnect network
2. Create assessment
3. Verify assessment saved immediately
4. Verify HL7 message queued (status: PENDING)
5. Reconnect network
6. Wait for processor to run
7. Verify HL7 message sent (status: SENT)

### Test Case 3: Retry Logic
1. Create assessment with intermittent network
2. Verify retry attempts logged
3. Verify message eventually sent or marked FAILED

### Test Case 4: High Volume
1. Create 20 assessments quickly
2. Verify all saved immediately
3. Verify all HL7 messages queued
4. Verify processor handles all messages

### Test Case 5: Auto-Retry Intervals
1. Create assessment with network down
2. Verify message status: PENDING
3. Reconnect network
4. Verify message retried after 30 seconds (retryCount = 0)
5. Disconnect network again
6. Verify message retried after 1 minute (retryCount = 1)
7. Verify exponential backoff working correctly

### Test Case 6: Manual Retry from UI
1. Create several assessments with network down
2. Verify messages in PENDING status
3. Navigate to Admin > HL7 Messages page
4. Click "Retry All Pending" button
5. Verify all pending messages retried immediately
6. Verify retryCount reset to 0
7. Test "Retry Selected" with checkboxes
8. Test "Retry Failed" for failed messages

## Rollback Plan

If issues occur:
1. Stop HL7 processor: `pm2 stop hl7-processor`
2. Revert visit API changes
3. Re-enable synchronous sending
4. Process pending messages manually if needed

## Performance Expectations

### Before (Synchronous)
- Assessment creation: 5-30+ seconds
- User experience: Poor (blocking)
- Network dependency: High

### After (Asynchronous)
- Assessment creation: < 1 second ✅
- User experience: Excellent (non-blocking)
- Network dependency: Low (background)
- HL7 delivery: 30-60 seconds (background)

## Auto-Retry Mechanism Details

### Automatic Retry Schedule

The background processor automatically retries PENDING messages at configured intervals:

| Retry Count | Delay Before Next Retry | Total Time Since Creation |
|-------------|-------------------------|---------------------------|
| 0 (New)     | Immediate               | 0 seconds                |
| 1           | 30 seconds              | ~30 seconds               |
| 2           | 1 minute                | ~1.5 minutes              |
| 3           | 2 minutes               | ~3.5 minutes              |
| 4           | 5 minutes               | ~8.5 minutes              |
| 5           | 10 minutes              | ~18.5 minutes             |
| 6+          | Marked as FAILED        | N/A                       |

**Key Features:**
- Messages are automatically retried without manual intervention
- Exponential backoff prevents API overload
- Processor checks every 30 seconds for messages due for retry
- Failed messages can be manually retried from UI (unlimited)

### Manual Retry Options

**From Admin UI (`/admin/hl7`):**
1. **Retry All Pending:** Immediately retry all PENDING messages
   - Resets retryCount to 0
   - Clears error messages
   - Updates status to PENDING (if was FAILED)
   - Queues for immediate processing

2. **Retry Selected:** Retry specific messages by checkbox selection
   - Same behavior as "Retry All Pending" but for selected messages only

3. **Retry Failed:** Retry all FAILED messages
   - Resets retryCount to 0
   - Changes status from FAILED to PENDING
   - Queues for immediate processing

4. **Individual Retry:** Retry button for each message row
   - Same behavior as above for single message

## Future Enhancements

1. **Webhook Notifications:** Notify when HL7 message sent/failed
2. **Priority Queue:** Process urgent messages first
3. **Rate Limiting:** Configurable rate limits per school
4. **Message Batching:** Batch multiple messages in one API call
5. **Health Monitoring:** Alert when processor stops
6. **Retry Schedule Configuration:** Allow admins to configure retry intervals per school
7. **Email Notifications:** Notify admins when messages fail after max retries

## Files to Modify

1. `app/api/visits/route.ts` - Remove synchronous sending
2. `ecosystem.config.js` - Add processor to PM2
3. `components/Layout.tsx` - Add HL7 Messages link to admin menu (if needed)
4. `README.md` - Update documentation

## Files to Create

1. `scripts/hl7-queue-processor.ts` - Main processor script with auto-retry
2. `run/start-hl7-processor.bat` - Windows start script
3. `app/admin/hl7/page.tsx` - Admin UI for HL7 message management
4. `app/api/hl7/retry/route.ts` - API endpoint for manual retry
5. `HL_delay/IMPLEMENTATION_PLAN.md` - This file
6. `HL_delay/TESTING_GUIDE.md` - Testing procedures
7. `HL_delay/MONITORING_GUIDE.md` - Monitoring procedures

## Estimated Time

- **Development:** 5.5 hours
  - Phase 2: Modify Visit API (30 minutes)
  - Phase 3-4: Queue Processor with auto-retry (2 hours)
  - Phase 5: Start Script (15 minutes)
  - Phase 6: Manual Retry UI (1.5 hours)
  - Phase 7: Monitoring & Logging (15 minutes)
- **Testing:** 1.5 hours
- **Documentation:** 30 minutes
- **Total:** ~7.5 hours

## Risk Assessment

**Low Risk:**
- Database schema already supports this
- No breaking changes to API
- Easy rollback if needed

**Mitigation:**
- Thorough testing before deployment
- Monitor processor logs
- Keep synchronous code as backup initially

## Approval Required

Please review this plan and approve before implementation.

**Questions to Consider:**
1. Is the 30-second polling interval acceptable? ✅ (Auto-retry every 30s)
2. Should we use PM2 or standalone script? ✅ (PM2 recommended)
3. Do we need admin dashboard for failed messages? ✅ (Included - Manual Retry UI)
4. What is the acceptable retry limit? ✅ (5 retries with exponential backoff)
5. Should manual retry reset retry count? ✅ (Yes - allows unlimited manual retries)

---

**Status:** ⏳ Awaiting Approval
**Created:** 2025-01-21
**Author:** AI Assistant

