LOW HOLD OPENING CONFIRMATION FIX - 2026-10-14

Based on your uploaded PressureTester - 100ft Single v100(1).zip.
Only existing FB_ValveOpeningDetector.TcPOU and SEQUENCE.TcPOU are changed.
FB_CyclePressureTest, PID, bleed controller, safety, I/O mapping and other files
are byte-for-byte unchanged. The existing low-range pending-fault logic is kept.

WHAT CHANGED
1. Candidates originating in low hold (cycle state 60) can no longer confirm
   through the LargeCollapse shortcut. A collapse may still START verification.
2. Start a fresh 0.8-second coast at candidate acceptance, counting only while
   monitoring qualifies, pump is off, and the selected bleed command is closed.
   Time already spent closed during low hold cannot count. Opening the bleed
   or losing the pump-off condition clears the fresh reference/timer.
3. After coast, capture a new fast-filtered pressure reference. Confirmation
   requires another 75 PSI loss in each selected channel, at least 0.3 seconds
   since reference capture, and current selected drop rate at least 100 PSI/s.
   Existing 2-second verification timeout and 3-second pending decision bound
   remain. Stable pressure or pressure exhausted before post-coast evidence
   does not confirm; an existing pending low-range fault then fails the test.
4. Manual SEQUENCE.ValveOpenDetected only contributes when new
   SEQUENCE.EnableManualValveOpeningSimulation is TRUE. Default FALSE.
   Keep FALSE for actual acceptance tests. This protects against an old TRUE
   test flag; it cannot prevent an intentional PLC force/bypass.
5. Correct detector BleedOpenB to NOT O_BleedValveB. Your cycle already selects
   B for B-only tests and now automatically writes both bleed outputs. Both
   ports selected continues using A according to your existing bleed selection.
6. Add EventCycleState, CandidateFromLowHold, fresh coast time, and trace arrays
   for individual bleed-open commands, dump-closed qualification, pump-off and
   detector state. These are command/status observations, not valve feedback.

INSTALL
Use the modified project, or replace only these two POUs in your current
FrontSide project from this archive. Include declarations AND implementation.
Build in TwinCAT before downloading. No TwinCAT compiler or machine was
available here; local XML/source checks and confirmation-expression regression
checks passed. Ensure no PLC forces are active on outputs or detection inputs.

WATCH DURING NEXT TEST
SEQUENCE.EnableManualValveOpeningSimulation (FALSE)
SEQUENCE.ValveOpenDetected
SEQUENCE.fbValveOpeningDetector.CandidateFromLowHold
SEQUENCE.fbValveOpeningDetector.LowHoldVerificationClosedSeconds
SEQUENCE.fbValveOpeningDetector.State
SEQUENCE.fbValveOpeningDetector.CandidateRejected
SEQUENCE.fbValveOpeningDetector.Detected
SEQUENCE.fbValveOpeningDetector.DetectionReason
SEQUENCE.fbValveOpeningDetector.EventCycleState
SEQUENCE.fbValveOpeningDetector.EventCycle
SEQUENCE.fbCyclePressureTest.LowRangeFaultPending
SEQUENCE.fbCyclePressureTest.ErrorID
SEQUENCE.fbCyclePressureTest.FailureReason
GVL.O_BleedValveA / GVL.O_BleedValveB (TRUE=CLOSED)

VALIDATION
- Normal low hold: no false detection; timer can complete normally.
- Small/slow low-range loss: fail if opening is not confirmed; no automatic pass.
- Rapid fall that stops before fresh post-coast evidence: reject, then fail if
  low-range violation is pending.
- Sustained simulated opening: candidate -> fresh coast -> additional loss ->
  confirmed event with EventCycleState=60. Cycle-count acceptance still applies.
- Repeat normal and simulated releases with A-only and B-only selections.
- Recheck ramp and controlled-bleed detection: their confirmation rules were
  intentionally preserved, not globally made more conservative.

LIMITS
Pressure loss cannot uniquely identify the mechanical ball valve. A leaking or
failed release valve can mimic an opening despite a closed command. Conversely,
a genuine rapid opening may exhaust pressure before the new coast/reference
and be reported as unconfirmed low-hold pressure loss. The report supplied
contains pressures only; the actual earlier pass path cannot be proven from it.
The new trace fields are PLC arrays only, not a new persistent file logger.
