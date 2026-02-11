# HL7 Background Processing - Documentation

## Overview

This folder contains the complete implementation plan for moving HL7 message sending to background processing, eliminating user-facing delays when creating assessments.

## Problem

Currently, when creating a new assessment, the system attempts to send HL7 messages to Malaffi API synchronously. This causes significant delays (5-30+ seconds) when network connectivity is poor or the API is slow.

**User Impact:**
- Users experience long delays when creating assessments
- Poor user experience with loading states
- Potential timeout errors

## Solution

Implement asynchronous background processing:
1. Save assessment to database immediately (fast response)
2. Queue HL7 message for background processing
3. Process queue asynchronously with retry logic
4. Track status and provide visibility

## Documentation Structure

### 📋 [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
Complete implementation plan with:
- Problem statement
- Solution overview
- Implementation details
- Testing plan
- Rollback plan
- Time estimates

### 🏗️ [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md)
Technical architecture documentation:
- System architecture diagrams
- Data flow diagrams
- Component details
- Retry strategy
- Performance considerations
- Deployment guide

### ✅ [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)
Step-by-step implementation checklist:
- Pre-implementation tasks
- Phase-by-phase tasks
- Testing procedures
- Deployment steps
- Success criteria

## Quick Start

### Review Plan
1. Read [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
2. Review [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md)
3. Understand the changes required

### Approve Implementation
- Review all documents
- Ask questions if needed
- Approve before implementation begins

### Implementation
1. Follow [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)
2. Test thoroughly
3. Deploy to production

## Key Changes

### Files to Modify
1. `app/api/visits/route.ts` - Remove synchronous HL7 sending
2. `ecosystem.config.js` - Add processor to PM2

### Files to Create
1. `scripts/hl7-queue-processor.ts` - Background processor
2. `run/start-hl7-processor.bat` - Start script

## Benefits

✅ **Instant Response:** Assessment creation < 1 second
✅ **Better UX:** No blocking on network calls
✅ **Reliability:** Failed messages retried automatically
✅ **Visibility:** Track message status
✅ **Scalability:** Process messages in background

## Timeline

- **Development:** 4 hours
- **Testing:** 1 hour
- **Documentation:** 30 minutes
- **Total:** ~5.5 hours

## Status

⏳ **Awaiting Approval**

Please review the implementation plan and approve before proceeding.

---

**Created:** 2025-01-21
**Last Updated:** 2025-01-21

