# NMMC Patient Flow Simulation Manual

This manual is for running an end-to-end simulation of one patient from Kiosk to completion.

## Goal

Simulate the real operational flow:

1. Kiosk intake
2. Triage assessment
3. Releasing (window processing)
4. Clinic caller handling
5. Completion

---

## 1. Pre-Simulation Setup

### 1.1 Start the system

1. Start backend and frontend.
2. Confirm frontend is reachable at http://localhost:3000.
3. Confirm backend health at http://localhost:3005/health.

### 1.2 Open role sessions

Use separate browser profiles/incognito windows so each role can stay logged in.

| Role | Username | Password | Main Page |
|---|---|---|---|
| TRIAGE_NURSE | karl | password123 | /triage |
| WINDOW_CLERK | aljo | password123 | /releasing |
| CLINIC_CALLER (Family Medicine) | maria | password123 | /caller |
| ADMIN (optional) | admin | password123 | /admin-dashboard |

Notes:

- Login uses username, not email.
- If you use a different caller account, assign the same department during triage.

### 1.3 Optional clean reset

1. Login as WINDOW_CLERK.
2. Go to /releasing.
3. Click Reset Queue.
4. Confirm reset.

Use this only when you want a clean run.

---

## 2. Scenario A: Happy Path (Kiosk to Completed)

## Step A1 - Kiosk registration

1. Open /kiosk.
2. Click Unregistered Patient (NEW).
3. Fill required fields in the form.
4. Click Submit Registration.

Expected:

- Success modal appears.
- Patient is added to triage queue.
- Internal state becomes KIOSK_SUBMITTED.

## Step A2 - Triage assessment

1. Login as TRIAGE_NURSE and open /triage.
2. In Active queue, select the newly registered patient.
3. Fill assessment details, especially:
   1. Chief Complaint (required)
   2. Assign Clinical Dept (required)
4. Choose a department that matches your caller account.
   1. Example: Family Medicine if caller username is maria.
5. Click Complete Assessment.

Expected:

- Assessment completes successfully.
- A window ticket is generated/printed.
- Patient moves to releasing queue.
- Internal state becomes WAITING_WINDOW.

## Step A3 - Releasing processing

1. Login as WINDOW_CLERK and open /releasing.
2. Select the same patient from Active Queue.
3. Click Call Patient.
4. Click Print and Assign.

Expected:

- Patient is routed to target clinic queue.
- Clinic ticket is generated/printed.
- Patient leaves releasing active queue.
- Internal state becomes WAITING_CLINIC.

## Step A4 - Caller handling

1. Login as CLINIC_CALLER and open /caller.
2. Confirm patient appears in Active list.
3. Click Call Patient.
4. After simulated consultation, click Mark Served.

Expected:

- Patient is completed and removed from active list.
- Internal state becomes COMPLETED.

---

## 3. Status Transition Map

Expected sequence for happy path:

1. KIOSK_SUBMITTED
2. WAITING_WINDOW
3. IN_PROGRESS (while called at releasing)
4. WAITING_CLINIC
5. IN_PROGRESS (while called by clinic caller)
6. COMPLETED

---

## 4. Scenario B: No-Show and Restore

### B1 - Triage no-show

1. In /triage Active queue, click No Show on a patient.
2. Switch to No Show tab.
3. Click Restore.

Expected:

- Patient returns to active triage queue.

### B2 - Caller no-show

1. In /caller, choose current or next patient.
2. Click No Show.
3. Switch to No Shows tab.
4. Click Restore.

Expected:

- Patient returns to clinic waiting queue.

---

## 5. Scenario C: Referral Transfer

1. In /caller, select active/current patient.
2. Click Referral.
3. Select a target department.
4. Click Confirm Referral.

Expected:

- Patient leaves current caller queue.
- Patient appears in target department caller queue.
- Status returns to WAITING_CLINIC under the new department.

---

## 6. Validation Checklist

Use this checklist during UAT simulation:

- Kiosk form submits successfully.
- Patient appears in triage active queue.
- Triage Complete Assessment works.
- Window ticket is printed/generated.
- Patient appears in releasing queue.
- Releasing Call Patient works.
- Releasing Print and Assign works.
- Clinic ticket is printed/generated.
- Patient appears in correct caller department queue.
- Caller Call Patient works.
- Caller Mark Served works.
- Final state is COMPLETED.

---

## 7. Common Issues and Fixes

1. Patient not visible in caller queue.
   1. Triage/Releasing assigned a different department than caller account.
   2. Re-run and match department to logged caller user.

2. Print and Assign does not proceed.
   1. Ensure Call Patient was done first.
   2. Ensure queue options exist for that department.

3. Ticket print popup not opening.
   1. Allow browser popups for localhost.

4. Login fails.
   1. Use username (not email).
   2. Confirm password is password123 for seeded users.

---

## 8. Suggested Test Data (Optional)

Use this sample for quick repeat runs:

- Last Name: Testpatient
- First Name: Juan
- Middle Name: D
- Gender: Male
- Civil Status: Single
- Birth Date: 1995-05-15
- Contact: 09123456789
- Address: Cagayan de Oro City
- Birthplace: Cagayan de Oro
- Religion: Roman Catholic

You can vary this per run to avoid confusion in queue lists.
