HANDOFF GUARD AND SHEAR DISPLAY - 2026-10-15

Based on PressureTester_100ft_v100_FirstRampClassifier.zip.
Modified: GVL.TcGVL, SEQUENCE.TcPOU, SEQUENCE_Save.TcPOU,
FB_FirstRampEventClassifier.TcPOU. Other baseline source files are unchanged.

SHEAR DISPLAY
GVL.HMI_ShearPressure is now INT. Active and saved sequence assignments use
LREAL_TO_INT, retaining full precision inside the measurement/classifier FBs.
The sensor range (0..12500 PSI) fits INT. Build and refresh HMI symbol metadata
because the existing tag type changed. Do not change analog scaling/raw types.

GVL.HMI_ShearTime remains TIME for calculations. NEW GVL.HMI_ShearTimeText is
STRING(20), formatted as mm:ss with whole seconds (fractional seconds discarded).
PT57.44S -> 00:57. Minutes do not wrap at an hour: 1 hour -> 60:00.
Bind the HMI shear-time display to HMI_ShearTimeText instead of HMI_ShearTime.
The current HMI/export application is NOT included in this PLC project and has
not been edited. If the exporter reads HMI_ShearTime directly, change its shear
result to read HMI_ShearTimeText, or apply the supplied formatShearTime helper
to that original TIME value. The helper accepts ISO duration strings and numeric
PLC TIME in milliseconds. formatShearPressure rounds a numeric report value.
Do not replace your full export script with this helper file. Retain signatures,
historical export, naming and all other current report behavior.

PossibleShearCaptured results are mapped to HMI_ShearPressure/HMI_ShearTime
for XHBV while in sequence 600. Both clear at new-test load (state 100).
Classifier records now survive stop/abort; enable still disables active control
on stop/abort. Reset is new-test load or cycle initialization only.
A trace-only brief drop remains separate from a classified possible shear.
Recommended HMI/report labels: Possible Shear Pressure / Possible Shear Time.
Pressure loss does not prove physical shear.

500 PSI BEHAVIOR
MAIN switches the pneumatic output from low to high regulator based on
SystemPressure > PumpSwapSetpoint. The first-ramp classifier's 500 PSI arming
threshold does NOT itself request verification. Its 25 PSI peak/drop trigger can
see fast regulator/pump transition effects not visible in the slow-filtered
report trend. The supplied video/report do not show CheckActive/State, so the
exact cause of the earlier closure is not proven from those alone.

New tFirstRampHandoffSettled in SEQUENCE guards ORDINARY first-ramp verification
until SystemPressure > PumpSwapSetpoint + 200 PSI continuously for 0.5 seconds.
Below that threshold / during transition, pressure-drop capture remains active
when classifier arming permits, but ordinary candidates cannot pause the pump.
A severe drop >=MAX(300 PSI,25 percent of peak), from a peak >=500 PSI, still
bypasses the ordinary guard and can request verification. This preserves the
conservative exhausted-loss failure path. Smaller events in the guarded region
may be recorded but cannot receive the normal pause/settled classification.
Existing monitoring floor/startup qualifications remain; no universal event
capture guarantee is implied. Later-cycle detector and low-hold rules unchanged.

WATCH
SEQUENCE.fbFirstRampEvent.State
SEQUENCE.fbFirstRampEvent.CheckActive
SEQUENCE.fbFirstRampEvent.NormalVerificationEnable
SEQUENCE.fbFirstRampEvent.VerificationSuppressed
SEQUENCE.tFirstRampHandoffSettled.Q
SEQUENCE.fbFirstRampEvent.PressureDropObserved
SEQUENCE.fbFirstRampEvent.CandidateCount
SEQUENCE.fbFirstRampEvent.PossibleShearCaptured
SEQUENCE.fbFirstRampEvent.ShearPressurePSI
GVL.HMI_ShearPressure / HMI_ShearTime / HMI_ShearTimeText

If a plateau near swap point occurs while CheckActive FALSE and State 0, the
classifier is not commanding that pause; inspect regulator handoff/pump control.
If CheckActive TRUE, inspect candidate pressure/drop and SevereDrop status.

VALIDATION
Ran generated classifier ST in a test-only translator for guarded crossover
fluctuations (capture/no pause), post-handoff possible shear/resume, and severe
collapse during guard (verify/fail). Checked source mappings/reset retention,
INT conversion and time-format boundaries. Checked XML, control nesting and ZIP
CRC plus unchanged original source comparison. No TwinCAT compiler or physical
machine available: build, refresh symbols, download and validate on machine.
The attached report HAS historical rows; historical logging/export code was
not changed as part of this patch.
