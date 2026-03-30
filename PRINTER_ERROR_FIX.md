# Printer Error Handling - Graceful Fallback Implementation

## Problem Statement
When the thermal printer is unavailable or misconfigured (printer name invalid), the triage form submission would fail completely with error:
```
Hardware Print Error: Queue Print Error: win32print Error: (1801, 'OpenPrinter', 'The printer name is invalid.')
```

This blocked the entire triage workflow, even though the triage assessment data was successfully saved.

## Solution Implemented

### Backend Changes (`nmmcqueue-backend/src/modules/triage/controller.ts`)

**Changed:** The `submitTriage` endpoint now catches printer errors gracefully instead of returning 500 error.

**Before:**
```typescript
try {
    await printTicket({...});
} catch (err: any) {
    console.error("Printer util failed:", err);
    return res.status(500).json({ success: false, error: `Hardware Print Error: ${err.message}` });
}
res.status(200).json({ success: true, data: result });
```

**After:**
```typescript
let printError: string | null = null;
if (result?.ticketNumber) {
    try {
        await printTicket({...});
    } catch (err: any) {
        console.error("Printer util failed:", err);
        // Store error but don't block submission
        printError = err.message || 'Unknown printer error occurred';
    }
}
res.status(200).json({ success: true, data: result, printError });
```

**Impact:** Triage submission always succeeds (HTTP 200) even if printing fails. The response includes `printError` field only if printer fails.

### Frontend Changes (`nmmcqueue-frontend/src/features/triage/components/triage-form.tsx`)

**Added:**
1. Dialog import from UI components
2. State for managing print error dialog: `printErrorDialog`
3. Updated `onSubmit` to detect and handle `printError` in response
4. New modal dialog component that displays printer error with user-friendly message

**Behavior:**
- If submission succeeds but printer fails: Show modal dialog with error details
- User can click "Continue" or "Dismiss" to acknowledge the error
- Triage form still completes normally (success message shown)
- Patient can proceed to window without printed ticket

**Dialog Features:**
- Displays user-friendly message: "The ticket printer is not available or offline. The patient has been successfully triaged and can proceed to the window."
- Shows technical error details in monospace font for debugging
- Two action buttons: "Dismiss" and "Continue"
- Uses Radix UI Dialog component for accessibility

## Testing the Fix

### Scenario 1: Printer Working
1. Triage form fills out
2. Click "Print Ticket & Send"
3. ✅ Ticket prints successfully
4. ✅ Success message shown (no dialog)
5. ✅ Form resets after 2 seconds

### Scenario 2: Printer Offline/Invalid
1. Triage form fills out
2. Click "Print Ticket & Send"
3. ❌ Printer error occurs (e.g., invalid printer name)
4. ✅ **Dialog appears**: "Printer Unavailable" with error details
5. User clicks "Continue" or "Dismiss"
6. ✅ Dialog closes
7. ✅ Success message still shown
8. ✅ Patient is triaged and can proceed to window (despite no physical ticket)
9. ✅ Form resets after 2 seconds

## Error Messages Now Visible To User

When printer fails, user sees:
- **Type:** Modal dialog (not error banner)
- **Title:** "Printer Unavailable"
- **Message:** Explains submission succeeded but printer is offline
- **Technical Info:** Shows the actual error (e.g., "The printer name is invalid")
- **Action:** User confirms they understand and continues

## Fallback Workflow
If no physical ticket prints:
1. Triage data is saved in database (✅ Complete)
2. Patient is assigned to window department (✅ Complete)
3. Window display receives SSE update (✅ Complete)
4. Patient can still proceed to window and be served (✅ Possible but no physical number)

**Future Enhancement:** Could generate a digital ticket QR code or SMS notification as fallback.

## Related Files Modified
- `nmmcqueue-backend/src/modules/triage/controller.ts` - Backend endpoint
- `nmmcqueue-frontend/src/features/triage/components/triage-form.tsx` - Frontend UI
- `nmmcqueue-frontend/src/features/triage/api.ts` - API client (no changes needed, already returns full response)

## Printer Configuration
For future reference, printer is configured in:
- `nmmcqueue-backend/src/lib/printer.ts` - Uses node-thermal-printer with win32print Python bridge
- Printer name must exist on Windows system or be set in environment variables
- If no printer found, uses default name (currently failing)

## Notes
- Error is logged to console for debugging: `console.error("Printer util failed:", err)`
- Submission timestamp is used if printer succeeds
- Triage data committed to database **before** printing attempt
- Safe to deploy - doesn't affect existing printer workflow
