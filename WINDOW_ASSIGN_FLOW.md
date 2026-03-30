# Window Desk: Print & Assign Button - Expected System Flow

## Pre-Click Checklist

Before you can click **Print & Assign**, the system requires:

1. ✅ Patient has been **called to window** (status: `IN_WINDOW`)
   - If NOT: A warning badge appears → Click "Call Now" button to call patient first
2. ✅ **Department selected** (either pre-assigned by triage or manually selected)
3. ✅ **Queue option exists** for the selected department
   - If NOT: Error message: "No queue option configured for this department. Please contact admin."

---

## Post-Click: Expected System Behavior (Step-by-Step)

### Step 1: Button Click
When you click **Print & Assign**, the system performs these actions:

```
Frontend (UI)
    ↓
    Validates patient is IN_WINDOW ✓
    Validates department selected ✓
    Validates queue option exists ✓
    Shows "Routing..." loading state on button
    ↓
    Sends POST request to backend: /api/releasing/{visitId}/assign
    {
        "departmentId": "dept-123",
        "priorityClass": "queue-option-id-456"
    }
```

---

### Step 2: Backend Processing (Express)

**Endpoint:** `POST /api/releasing/{visitId}/assign`

The backend:

1. **Validates the request** (security check)
2. **Fetches the visit record** with patient info
3. **Determines classification** (PRIORITY or REGULAR based on queue option)
4. **Generates new clinic ticket number** using sequence key: `DEPT_{departmentId}`
   - Example: If department is "FAMILY MEDICINE", sequence key is `DEPT_family-medicine-id`
   - Ticket increments daily (e.g., 101, 102, 103...)
5. **Updates visit record with:**
   - `status` → `WAITING_CLINIC` (moved to clinic queue)
   - `ticketNumber` → new clinic ticket (e.g., 102)
   - `sequenceKey` → the department sequence key
   - `departmentId` → set to target department
   - `windowTicketNumber` → original window ticket preserved (for audit)
   - `windowClaimedById` → cleared (no longer in window)
   - `windowStartedAt` → cleared
   - `classification` → updated based on queue option
6. **Creates status history record** → "WAITING_CLINIC" event logged
7. **Emits SSE update** to department-specific topic
   - Global broadcast: `queue-updated:global`
   - Department broadcast: `queue-updated:{departmentId}`
8. **Emits SSE update** to window topic to remove from window monitor
   - Window broadcast: `queue-updated:WINDOW`

**Response:**
```json
{
  "success": true,
  "data": {
    "ticketNumber": 102,
    "patientFullName": "Doe, John"
  }
}
```

---

### Step 3: Frontend Receives Response

**Success path:**
1. UI receives successful response
2. Shows toast notification: `"Ticket assigned to clinic"` with ticket details
3. Calls `revalidatePath("/releasing")` to refresh the page
4. Calls `onAssignComplete()` callback which:
   - Clears `selectedPatient` state on panel
   - Panel closes/disappears
   - Queue table updates automatically
5. SSE listener (via EventSource) receives broadcast for the window topic
   - Triggers page refresh to reflect patient removal from window queue
6. Patient **removed from window queue** ✓

**Error path:**
1. Shows error toast with reason (if applicable)
2. Button re-enables
3. Patient remains in window queue for retry

---

## Where Does the Patient Go Next?

### In the System Database:

| Field | Before Assignment | After Assignment |
|-------|-------------------|------------------|
| `status` | `IN_WINDOW` | `WAITING_CLINIC` ✓ |
| `departmentId` | May be empty or from triage | **Set to selected clinic** ✓ |
| `ticketNumber` | Window ticket (e.g., 50) | Clinic ticket (e.g., 102) ✓ |
| `sequenceKey` | `WINDOW_PRIORITY` or `WINDOW_REGULAR` | `DEPT_{departmentId}` ✓ |
| `windowTicketNumber` | N/A | Window ticket saved here ✓ |
| `windowClaimedById` | User ID | NULL (cleared) ✓ |

### In the UI:

1. **Window Clerk's Screen** (/releasing):
   - Patient **disappears from active queue**
   - No longer visible in queue table
   - Status removed from "Currently Serving" banner
   - Next patient can be called

2. **Clinic Caller's Screen** (/caller):
   - Patient **appears in WAITING_CLINIC list** in their department queue
   - Shows new clinic ticket number (e.g., #102)
   - Appears in "Active" tab, sorted by priority and arrival time
   - Caller can now click "Call Patient" to move to IN_PROGRESS

3. **Monitor Screens** (Admin/TV Displays):
   - Window monitor refreshes: patient removed from "Upcoming" or "Currently Serving"
   - Department monitor updates: new patient appears in "Waiting" list
   - Real-time thanks to SSE broadcasts

---

## Full Patient Journey (Clinic Caller Phase)

After "Print & Assign" succeeds, this is what happens next:

```
WAITING_CLINIC (Patient waiting in clinic queue)
    ↓ [Clinic Caller clicks "Call Patient"]
IN_PROGRESS (Patient being seen by provider)
    ↓ 
    ├─ [Caller clicks "Mark Served"]
    │  └─→ COMPLETED ✓
    ├─ [Caller clicks "No Show"]
    │  └─→ NO_SHOW
    └─ [Caller clicks "Transfer"]
       └─→ WAITING_CLINIC (different department)
```

---

## What to Check When Testing

**After clicking "Print & Assign":**

### ✓ Success Indicators

1. **Toast notification appears** with patient name and new ticket number
2. **Button state changes** from "Print & Assign" → "Routing..." → re-enables
3. **Patient disappears** from window clerk's active queue
4. **Panel closes** automatically (fades out on right side)
5. **Next patient can be called** (Call Next button re-enables)
6. **Clinic Caller sees patient** in their department's WAITING_CLINIC queue (within ~1-2 seconds)

### ✗ Failure Indicators

1. **Error toast shows** with specific reason:
   - "Patient not ready" → Patient not in IN_WINDOW state
   - "Department not selected" → No department assigned
   - "No queue options configured" → Admin needs to add queue categories for this dept
   - "Failed to assign ticket" → Backend error (check server logs)

2. **Patient remains visible** in window queue after 5 seconds
3. **Button stays disabled** or shows "Routing..." stuck state
4. **No patient appears** in clinic caller queue after 10 seconds
5. **Console errors** (check browser DevTools → Console tab)

---

## Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Button grayed out / disabled | Patient not called | Click "Call Now" first |
| Button grayed out / disabled | No department selected | Select department from dropdown |
| Button grayed out / disabled | No queue options exist | Admin must add categories in /admin-dashboard |
| "Patient not ready" error | Patient status check failed | Refresh page; ensure patient is IN_WINDOW |
| Patient doesn't appear in clinic queue | Different department assigned | Verify triage assigned same department as window clerk selected |
| Patient doesn't appear in clinic queue | SSE not working | Check browser console for EventSource errors; restart frontend |
| Nothing happens (frozen UI) | Request timeout | Wait 10 seconds; if still frozen, refresh page |

---

## Backend Status Validation (Optional)

To debug, check the database visit record after clicking:

```sql
SELECT 
  id, 
  status, 
  departmentId, 
  ticketNumber, 
  sequenceKey, 
  windowTicketNumber
FROM visit 
WHERE id = '{visitId}';
```

**Expected after successful assignment:**
- `status` = `WAITING_CLINIC`
- `departmentId` = (the UUID you selected)
- `ticketNumber` = new clinic ticket (e.g., 102)
- `sequenceKey` = `DEPT_{departmentId}`
- `windowTicketNumber` = original window ticket

---

## Video Walkthrough (What You Should See)

1. Window clerk opens /releasing
2. Clicks "Call Next" → patient appears on right panel
3. Panel shows patient info, vitals, triage notes
4. Clerk selects department (or sees pre-assigned)
5. Clerk clicks "Print & Assign"
6. ✅ Toast: "Ticket assigned to clinic"
7. Panel closes
8. Patient row disappears from queue table
9. **Switch to clinic caller tab** (same department)
10. **Patient now visible** in caller's WAITING_CLINIC queue with new ticket #

---

## System Performance Expectations

- **Button response** (click to "Routing..."): <100ms
- **Backend processing**: 200-500ms
- **Patient appears in clinic queue**: 1-3 seconds (includes SSE propagation)
- **Full UI refresh**: 2-4 seconds

If times exceed 10 seconds, there may be a network or server issue.

---

## Support Checklist

If "Print & Assign" is not working, verify:

- [ ] Backend server is running and healthy (`/health` endpoint)
- [ ] Frontend server is running
- [ ] Database connection is active
- [ ] At least one queue option/category exists for the department
- [ ] User has role `WINDOW_CLERK` or `ADMIN`
- [ ] Patient's status in database is `IN_WINDOW`
- [ ] Department ID exists in database
- [ ] Browser console has no errors (F12 → Console)
- [ ] Network tab shows successful POST request to `/api/releasing/{visitId}/assign` (F12 → Network)
- [ ] Response JSON contains `"success": true`
