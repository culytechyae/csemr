# HL7 Background Processing - Implementation Checklist

## Pre-Implementation

- [ ] Review and approve implementation plan
- [ ] Understand current HL7 sending flow
- [ ] Verify database schema supports async processing
- [ ] Set up development environment
- [ ] Backup current code

## Phase 1: Modify Visit API (30 minutes)

### File: `app/api/visits/route.ts`

- [ ] Locate HL7 sending code (around line 192-318)
- [ ] Remove synchronous `sendHL7ToMalaffi()` call
- [ ] Remove retry loop (lines 285-307)
- [ ] Keep HL7 message creation (lines 269-279)
- [ ] Ensure status is set to 'PENDING'
- [ ] Test: Create assessment, verify immediate response
- [ ] Test: Verify HL7 message saved with PENDING status
- [ ] Commit: "Remove synchronous HL7 sending from visit creation"

## Phase 2: Create Queue Processor (2 hours)

### File: `scripts/hl7-queue-processor.ts`

- [ ] Create new file
- [ ] Import required dependencies (Prisma, HL7 functions)
- [ ] Implement `main()` function
  - [ ] Infinite loop with 30s interval
  - [ ] Error handling
  - [ ] Graceful shutdown (SIGTERM/SIGINT)
- [ ] Implement `processQueue()` function
  - [ ] Query pending messages (status = 'PENDING')
  - [ ] Filter by age (< 24 hours)
  - [ ] Order by createdAt (oldest first)
  - [ ] Limit to 10 messages per batch
- [ ] Implement `processMessage(message)` function
  - [ ] Get school HL7 config
  - [ ] Call `sendHL7ToMalaffi()`
  - [ ] Handle success: Update status to 'SENT'
  - [ ] Handle failure: Increment retryCount
  - [ ] Check max retries: Update to 'FAILED' if exceeded
  - [ ] Error handling (try/catch)
- [ ] Implement `calculateNextRetryDelay(retryCount)`
  - [ ] Exponential backoff formula
- [ ] Add logging
  - [ ] Log processing start/end
  - [ ] Log message processing
  - [ ] Log successes
  - [ ] Log failures with details
- [ ] Add rate limiting (1 message/second)
- [ ] Test: Run processor manually
- [ ] Test: Verify messages processed
- [ ] Test: Verify status updates
- [ ] Commit: "Add HL7 queue processor for background processing"

## Phase 3: Create Start Script (15 minutes)

### File: `run/start-hl7-processor.bat`

- [ ] Create new batch file
- [ ] Add Node.js path setup
- [ ] Add directory change to project root
- [ ] Add Node.js check
- [ ] Add PM2 check/install
- [ ] Add script to run processor
- [ ] Add error handling
- [ ] Test: Run script manually
- [ ] Commit: "Add start script for HL7 processor"

### File: `ecosystem.config.js`

- [ ] Add HL7 processor configuration
  - [ ] name: 'hl7-processor'
  - [ ] script: './scripts/hl7-queue-processor.js'
  - [ ] instances: 1
  - [ ] exec_mode: 'fork'
  - [ ] autorestart: true
  - [ ] error_file and out_file paths
- [ ] Test: Start with PM2
- [ ] Test: Verify processor runs
- [ ] Commit: "Add HL7 processor to PM2 ecosystem"

## Phase 4: Create Manual Retry UI (1.5 hours)

### File: `app/admin/hl7/page.tsx`

- [ ] Create new admin page for HL7 message management
- [ ] Implement message list display
  - [ ] Show message details (ID, type, status, student, school)
  - [ ] Show retry count and error messages
  - [ ] Show timestamps (created, sent, last updated)
- [ ] Implement filters
  - [ ] Filter by status (PENDING, SENT, FAILED)
  - [ ] Filter by school
  - [ ] Filter by date range
- [ ] Implement action buttons
  - [ ] "Retry All Pending" button
  - [ ] "Retry All Failed" button
  - [ ] "Retry Selected" button (with checkboxes)
  - [ ] Individual retry button per message
- [ ] Implement status indicators
  - [ ] Pending count badge
  - [ ] Failed count badge
  - [ ] Success rate percentage
  - [ ] Last retry time display
- [ ] Add loading states for retry actions
- [ ] Add success/error notifications
- [ ] Test: Display messages correctly
- [ ] Test: Filters work correctly
- [ ] Commit: "Add admin UI for HL7 message management"

### File: `app/api/hl7/retry/route.ts`

- [ ] Create new API endpoint for manual retry
- [ ] Implement POST handler
- [ ] Handle "retryAll" with status filter
  - [ ] Query messages by status (PENDING or FAILED)
  - [ ] Reset retryCount to 0
  - [ ] Update status to PENDING
  - [ ] Clear error messages
- [ ] Handle "messageIds" array
  - [ ] Retry specific messages by ID
  - [ ] Same reset logic as above
- [ ] Add authentication check (admin only)
- [ ] Add error handling
- [ ] Return success/error response
- [ ] Log manual retry actions
- [ ] Test: Retry all pending messages
- [ ] Test: Retry selected messages
- [ ] Test: Retry failed messages
- [ ] Test: Error handling
- [ ] Commit: "Add API endpoint for manual HL7 retry"

### File: `components/Layout.tsx` (if needed)

- [ ] Add "HL7 Messages" link to admin menu
- [ ] Only show for ADMIN role
- [ ] Test: Menu item appears for admins
- [ ] Commit: "Add HL7 Messages link to admin menu"

## Phase 5: Testing (1.5 hours)

### Test Case 1: Normal Operation
- [ ] Create assessment with good network
- [ ] Verify assessment saved immediately (< 1 second)
- [ ] Verify HL7 message created with PENDING status
- [ ] Wait 30-60 seconds
- [ ] Verify HL7 message status changed to SENT
- [ ] Verify sentAt timestamp set

### Test Case 2: Network Failure
- [ ] Disconnect network
- [ ] Create assessment
- [ ] Verify assessment saved immediately
- [ ] Verify HL7 message created with PENDING status
- [ ] Reconnect network
- [ ] Wait for processor to run
- [ ] Verify HL7 message eventually sent (status: SENT)

### Test Case 3: Retry Logic
- [ ] Create assessment with intermittent network
- [ ] Verify retry attempts logged
- [ ] Verify retryCount increments
- [ ] Verify message eventually sent or marked FAILED
- [ ] Check error messages logged

### Test Case 4: High Volume
- [ ] Create 20 assessments quickly
- [ ] Verify all saved immediately
- [ ] Verify all HL7 messages queued (status: PENDING)
- [ ] Wait for processor to handle all
- [ ] Verify all messages processed
- [ ] Check processing time

### Test Case 5: Max Retries
- [ ] Create assessment with invalid API key
- [ ] Verify message retries up to max
- [ ] Verify status changes to FAILED after max retries
- [ ] Verify error message stored

### Test Case 6: Processor Restart
- [ ] Start processor
- [ ] Create assessment
- [ ] Stop processor
- [ ] Verify message remains PENDING
- [ ] Restart processor
- [ ] Verify message processed

### Test Case 7: Auto-Retry Intervals
- [ ] Create assessment with network down
- [ ] Verify message status: PENDING, retryCount: 0
- [ ] Reconnect network
- [ ] Wait 30 seconds
- [ ] Verify message retried (check logs)
- [ ] Disconnect network again
- [ ] Wait 1 minute
- [ ] Verify message retried again (retryCount: 1)
- [ ] Verify exponential backoff working

### Test Case 8: Manual Retry from UI
- [ ] Create several assessments with network down
- [ ] Verify messages in PENDING status
- [ ] Navigate to Admin > HL7 Messages page
- [ ] Verify messages displayed correctly
- [ ] Click "Retry All Pending" button
- [ ] Verify all pending messages retried immediately
- [ ] Verify retryCount reset to 0
- [ ] Test "Retry Selected" with checkboxes
- [ ] Test "Retry Failed" for failed messages
- [ ] Test individual retry button
- [ ] Verify filters work correctly

## Phase 6: Documentation (30 minutes)

### File: `README.md`
- [ ] Add section on HL7 background processing
- [ ] Document how to start processor
- [ ] Document how to stop processor
- [ ] Document monitoring

### File: `HL_delay/README.md`
- [ ] Create overview document
- [ ] Link to implementation plan
- [ ] Link to technical architecture
- [ ] Link to testing guide

### File: `run/README.md`
- [ ] Document `start-hl7-processor.bat`
- [ ] Add to script list

## Phase 7: Deployment

### Pre-Deployment
- [ ] Review all code changes
- [ ] Run all tests
- [ ] Check logs for errors
- [ ] Verify database indexes
- [ ] Backup database

### Deployment Steps
- [ ] Deploy code changes
- [ ] Run database migrations (if any)
- [ ] Start HL7 processor: `pm2 start ecosystem.config.js --only hl7-processor`
- [ ] Verify processor running: `pm2 list`
- [ ] Check logs: `pm2 logs hl7-processor`
- [ ] Monitor for 30 minutes
- [ ] Verify messages processing

### Post-Deployment
- [ ] Monitor processor for 24 hours
- [ ] Check success rate
- [ ] Check for errors
- [ ] Verify user experience (no delays)
- [ ] Document any issues

## Rollback Plan

If issues occur:
- [ ] Stop HL7 processor: `pm2 stop hl7-processor`
- [ ] Revert visit API changes (restore synchronous sending)
- [ ] Test assessment creation
- [ ] Process pending messages manually if needed
- [ ] Document issues for future fix

## Success Criteria

✅ Assessment creation takes < 1 second
✅ No user-facing delays
✅ HL7 messages processed within 60 seconds
✅ Failed messages retried appropriately
✅ Processor runs continuously
✅ No memory leaks
✅ Logs are clear and useful

## Notes

- Keep synchronous code commented for quick rollback
- Monitor processor logs closely for first week
- Consider adding admin dashboard for failed messages
- Document any configuration changes needed

---

**Status:** ⏳ Ready for Implementation
**Last Updated:** 2025-01-21

