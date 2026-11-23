FIRST-RAMP EVENT CLASSIFICATION - 2026-10-14

BASE
PressureTester_100ft_v100_LowHoldConfirmationFix.zip, based on the project
uploaded on October 14. Includes its low-hold confirmation, Port B detector
mapping, simulation-enable gate, and existing Ti=5 non-cycle / Ti=20 cycle tuning.
Modified original files: SEQUENCE.TcPOU, FB_CyclePressureTest.TcPOU,
FrontSide.plcproj. New: FB_FirstRampEventClassifier.TcPOU. All other baseline
files are byte-identical. Safety/HMI application/report scripts are unchanged.

BEHAVIOR
During cycle state 20 with zero completed cycles, the new first-ramp classifier
owns pressure-drop investigation; the existing opening detector is disabled
for that ramp only. It still updates its pressure filter. Later ramps, high
holds, controlled bleeds and low holds use the existing opening detector.

The new FB independently fast-filters the selected A/B raw pressure, at 5 ms.
Ordinary arming: 0.5 seconds of pumping with release paths commanded closed,
and selected pressure at least 500 PSI. Only selected sensors participate.
25 PSI peak drop in each selected channel starts a trace immediately.
A drop persisting 0.15 seconds pauses the pump via the existing cycle pause
logic and commands dump/bleed/block valves closed. A shorter crossing records
a trace only, not a verified shear or a sequence pause.

A severe fall from a peak >=500 PSI bypasses normal startup/retry arming when
loss in each selected channel is >= MAX(300 PSI, 25 percent of peak). It still
must qualify for 0.15 seconds and undergo verification; it cannot pass directly.
Events below the arm pressure or below capture threshold are NOT guaranteed to
be detected. These are starting commissioning settings, not sensor-noise or
actual-shear thresholds established by measurement.

VERIFICATION
Start a NEW coast interval only once the pump is commanded off and selected
release paths are commanded closed. After 0.8 seconds capture a fresh pressure
reference. Over at least another 0.3 seconds:
- sustained fall >=75 PSI in each selected channel, with selected rate >=100
  PSI/s: pressure-release evidence. The INITIAL ramp always fails as an early
  opening, even if recipe cycle-count limits would otherwise allow cycle 1.
- stable pressure: abs selected rate <=50 PSI/s and each selected channel and
  selected pressure within 25 PSI of the reference. Pressure must have stayed
  >=100 PSI, and total loss must be <=MAX(300 PSI,25 percent of candidate peak).
  Record POSSIBLE SHEAR/TRANSIENT and resume the SAME ramp. It cannot pass the
  overall cycle test. Re-arm ordinary capture after 1-second retry + startup;
  severe-collapse observation remains available during that interval.
- no conclusion within 2 seconds, exhausted pressure, or invalid selected
  pressure input: fail as unconfirmed event/input fault; no automatic pass.

Pressure behavior does not establish the physical mechanism. A transient may
be a pump/valve disturbance rather than a shear. A leak can mimic opening.
A large real shear or very fast real opening may conservatively fail as
unconfirmed. Validation with the actual part is required.

RECORDS / WATCH VALUES (prefix SEQUENCE.fbFirstRampEvent.)
State: 0 observe, 10 verify, 100 release confirmed, 900 fault.
Armed, SelectedPressure, CurrentDropPSI, DropRatePSIperSec
PressureDropObserved, ObservedPeakPressurePSI, ObservedTimeSeconds
CandidateCount, CandidatePressurePSI, CandidateTimeSeconds
CheckActive, VerificationElapsedSeconds, ClosedCoastSeconds
PossibleShearCaptured, PossibleShearCount
ShearPressurePSI, ShearDropPSI, ShearTimeSeconds
ReleaseConfirmed, Fault, FailureReason, EventClassification

PossibleShearCaptured/Count are separate from ReleaseConfirmed. They remain
latched for review until a new test is loaded, cycle block initializes, abort,
or stop. No PLC GVL declarations are required. Existing HMI report shear tags
are deliberately NOT populated from an unproven shear; the new values are PLC
records/watch values. HMI/report integration is a separate change.

TRACE
1000 entries at 20 ms: last 20 seconds, sampled independently of existing
historical logging. TracePressureA/B, TraceTimeSeconds, TracePumpOff,
TraceReleasePathsClosed, TraceState are parallel circular arrays.
TraceWriteIndex is next write; oldest=(write-count+1000) MOD 1000.
TraceCount is number valid. TraceCandidateIndex identifies the amplitude
crossing sample; TraceCandidatePressurePSI/TimeSeconds describe THAT first
crossing. Freeze 4 seconds after FIRST crossing, or freeze at first-ramp exit
if there was no crossing. Prior history may be shorter if crossing is early.
CandidateCount/last candidate and shear fields can update on subsequent events;
the frozen trace belongs to the FIRST amplitude crossing only. No persistent
CSV/logger was added. Stop/new-test resets validity. Export before reset if
needed. Trace clocks are seconds since classifier reset, not UTC timestamps.

MANUAL DEPRESSURIZE FIX INCLUDED
Immediately before final VALVES/output selection, state 800 sets
SequenceActive TRUE, PumpManualCmd FALSE, HMI_TogglePump FALSE, and desired
pressure zero. This allows existing automatic dump/block commands to reach
hardware when entered from manual operation. FB_Depressurize's pressure/dwell
completion criteria were not bypassed or changed.

INSTALL
Open the included updated solution/project and Build in TwinCAT. Or replace
SEQUENCE and FB_CyclePressureTest declarations+implementation, add the new FB
via Add Existing Item, and ensure its Compile entry exists. The full project
already includes that entry. Do NOT replace FB_ShearTest (standalone recipe).
Keep SEQUENCE.EnableManualValveOpeningSimulation FALSE for acceptance tests.
Build/download/runtime checks remain necessary: no TwinCAT compiler or physical
machine was available here.

VALIDATION PERFORMED
Executed generated classifier ST with a test-only interpreter at 5 ms for:
noise, settled transient/resume, sustained release, pressure exhausted before
verification, A-only/B-only/both, disagreeing channels, pump-off coast gating,
invalid signal/reset, trace freezing, brief crossing without verification,
severe startup collapse, and below-arm startup fluctuation. Checked integration
scan order, first-ramp ownership, pause/fault mappings, early-failure branch,
PID preservation and manual-depressurize output authority. XML/ZIP structural
checks are not a TwinCAT build.

NEXT MACHINE TESTS
1 Normal first ramp: no false candidate, proceed to normal high hold.
2 Brief modest pressure disturbance: trace only or possible transient then
  resume; never cycle pass merely because a shear was recorded.
3 Sustained simulated release on first ramp: early-release failure, pump off.
4 Very fast exhaust: unconfirmed-loss failure, no pass.
5 Later-cycle genuine release and low-hold unconfirmed loss: retained behavior.
6 Repeat A-only and B-only. Review trace before changing 25 PSI capture level.
7 Confirm manual depressurize opens dump paths and stops manual pumping.
