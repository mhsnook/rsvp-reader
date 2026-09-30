# RSVP Reader

A rapid serial visual presentation reader that doubles as a self-experiment: it assigns reading settings, watches how the reader responds, and reports which settings help that reader. Most terms are two words: the first word grounds the second.

## Language

### The experiment

**Reading trial**:
One reader's whole self-experiment, run over days or weeks, across many reading sessions.
_Avoid_: Study, test run, experiment run

**Test variable**:
One setting the app varies across the trial: font, colour palette, or chunk size. Text size is observed, never varied.
_Avoid_: Factor, dimension, knob, setting (when it is under app control)

**Test condition**:
One combination of test variable values that the app assigns for one calendar day.
_Avoid_: Treatment, arm, configuration, combo

**Context variable**:
A fact about the reading that the app records but does not assign: the text, its genre, and the device size. Results are cross-tabbed on it.
_Avoid_: Covariate, confounder

**Trial budget**:
The time and the texts a reader declares at trial start. The assignment design fits inside it.
_Avoid_: Commitment, plan length

### The reading

**Reading session**:
One continuous stretch of reading under one test condition. It ends when the reader stops or a long pause passes.
_Avoid_: Sitting, run, visit

**Starting speed**:
The low wpm every reading session begins at, around 300, from which the reader climbs to their comfort zone.
_Avoid_: Baseline, default wpm, saved wpm

**Reader signal**:
One reader action the app records during a session: speed up, slow down, go back, pause, or bail out.
_Avoid_: Event, interaction, telemetry

**Speed churn**:
Frequent speed-up and slow-down signals within one session. Read as a sign of discomfort.
_Avoid_: Fiddling, adjustment rate

**Self report**:
The reader's own answer, asked during or after a session, about how the reading felt: comprehension, fatigue, comfort. Never a quiz.
_Avoid_: Survey, rating, quiz, comprehension check

### The outcomes

**WPM**:
Words advanced per minute of reading time. Reading time excludes paused time. This is the primary outcome.
_Avoid_: Speed, pace, wall-clock rate, effective speed

**Reader joy**:
How good the reading felt to the reader, taken from self reports and from the absence of go-backs and speed churn. The second primary outcome.
_Avoid_: Satisfaction, comfort score, wellbeing

**Trial report**:
The result the reader gets: which test variable values went with higher WPM and more reader joy for them.
_Avoid_: Results, dashboard, insights, recommendation

### The presentation

**Colour palette**:
One named pair of text colour and background colour. A value of the colour test variable.
_Avoid_: Theme, colour scheme, mode

**Chunk size**:
The target number of words shown at once. Existing term in the code.
_Avoid_: Group size, phrase length, words per frame

**Sentence chunk**:
A chunk that is one whole sentence, the way trained speed readers were taught to read. A candidate chunk size level.
_Avoid_: Sentence mode, line mode
