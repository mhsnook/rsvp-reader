# N-of-1 trial designs under a small budget

Research for issue #12 (part of the Test Mode map, #9). Date: 2026-09-11.

## The question

Test Mode assigns one test condition per calendar day. A test condition is one level of each of three test variables: font, colour palette, and chunk size. Each variable has 3 to 6 candidate levels. The reader declares a trial budget at trial start, and a realistic budget is 14 to 21 daily reading sessions. The outcomes are WPM and reader joy, measured once per reading session.

How should the app sequence test conditions inside that budget, what does each design do when the reader skips a day, what can it conclude from so few observations, and how does it cope with a budget the app does not know for sure?

## Summary

- The full grid is out of reach. Three variables at 3 levels each is 27 test conditions; at 6 levels each it is 216. A 14 to 21 day budget cannot visit each condition even once, so the design must either test one variable at a time or use a fraction of the grid that assumes the variables do not interact.
- Three designs fit the budget. **Design A** (one variable at a time, randomized blocks of days) gives the strongest evidence about one variable. **Design B** (a 3x3 Latin square, also known as the L9 orthogonal array, run in randomized blocks) screens all three variables in 9 days but assumes no interactions. **Design C** (screen with B, then confirm the winner against the reader's current settings in randomized pairs of days) gives a screening answer and a defensible head-to-head answer inside 21 days. Design C is the recommendation.
- Multiple-baseline and ABAB reversal designs do not fit. They need 12 to 30 days to compare two conditions, and they answer a question (does an irreversible intervention change a behaviour) that Test Mode does not ask.
- Every design assigns conditions in complete blocks and randomizes order inside each block. That single rule handles the unknown budget, the skipped day, and the time trend from practice.
- The minimum defensible claim about a two-condition comparison needs five complete pairs of days. A claim about one variable with three levels needs four to five complete blocks of three days. A claim about all three variables at once, inside 21 days, is a screening claim and the report must say so.

## Vocabulary bridge

The literature uses its own terms. This table maps them to the repo's terms.

| Literature term | Repo term |
| --- | --- |
| patient, subject, case | reader |
| treatment, intervention, factor level | level of a test variable |
| treatment combination, run, cell | test condition |
| period, session, measurement occasion | reading session (one per calendar day) |
| outcome | WPM, reader joy |
| number of periods, sample size | trial budget |
| factor | test variable |

## What the sources say about the building blocks

### N-of-1 trials are blocked crossover trials in one person

The AHRQ user's guide defines the prototypical n-of-1 trial as a sequence of treatment periods, balanced or randomized, with repeated outcome measurements and feedback for decision-making ([AHRQ 2014, ch. 1, Figure 1-1](https://effectivehealthcare.ahrq.gov/sites/default/files/pdf/n-1-trials_research-2014-5.pdf)). It states the conditions where the design applies: a chronic, stable condition and a treatment with "relatively rapid onset ... and washout (i.e., few lasting carryover effects)" ([AHRQ 2014, ch. 1](https://effectivehealthcare.ahrq.gov/sites/default/files/pdf/n-1-trials_research-2014-5.pdf)). A display setting switches on and off instantly, so Test Mode meets that condition better than most drug trials do.

The guide's core sequencing advice is blocking. "In the standard two-treatment n-of-1 trial, the assignments are made within blocks of two time periods." Blocks protect against time trends, and "blocked assignment also ... minimizes the consequences of early termination from the trial that might otherwise lead to an unbalanced number of observations in the two treatment arms" ([AHRQ 2014, ch. 4, Randomization/Counterbalancing](https://effectivehealthcare.ahrq.gov/sites/default/files/pdf/n-1-trials_research-2014-5.pdf)). That sentence is the answer to the unknown-budget problem: stop after any complete block and the data stay balanced.

The guide also says when to counterbalance and when to randomize inside blocks: "If there is good information on the most important potential confounding factor (such as the linear time trend) and if the total number of blocks is small, say, less than four, counterbalancing can be more effective. Otherwise, randomization would be a more robust choice." It gives the sequences: ABAB and ABBAABBA protect against linear trends; the doubly counterbalanced ABBABAAB "defends against both linear secular trends and nonlinear trends" ([AHRQ 2014, ch. 1, Balanced Sequence Assignment; ch. 4](https://effectivehealthcare.ahrq.gov/sites/default/files/pdf/n-1-trials_research-2014-5.pdf)).

On repetition: "repetition is to n-of-1 trials what sample size is to parallel group RCTs" ([AHRQ 2014, ch. 1, Repetition](https://effectivehealthcare.ahrq.gov/sites/default/files/pdf/n-1-trials_research-2014-5.pdf)). Sample size is the number of periods times the measurements per period, and the two "affect different components of the study variance" ([AHRQ 2014, ch. 4, Replication](https://effectivehealthcare.ahrq.gov/sites/default/files/pdf/n-1-trials_research-2014-5.pdf)). For Test Mode: extra reading sessions on the same day sharpen that day's estimate, but only extra days add independent comparisons.

The CENT 2015 reporting guideline (CONSORT extension for N-of-1 trials) adds guidance to 14 of the 25 CONSORT items and recommends a diagram of the period sequence for an individual trial ([Vohra et al. 2015, BMJ 350:h1738](https://doi.org/10.1136/bmj.h1738); [EQUATOR entry](https://www.equator-network.org/reporting-guidelines/consort-cent/)). The trial report in Test Mode should show the actual sequence of test conditions per day, the number of complete blocks, and the days skipped. That is the CENT diagram in app form.

### Alternating treatments design (ATD)

Barlow and Hayes named the ATD: a design "capable of comparing two treatments within a single subject" through "fast alternation" of the treatments, with the order counterbalanced or randomized ([Barlow & Hayes 1979](https://doi.org/10.1901/jaba.1979.12-199)). It is the single-case design that matches Test Mode's "one condition per day" rule.

They split multiple-treatment interference into three kinds ([Barlow & Hayes 1979](https://doi.org/10.1901/jaba.1979.12-199)):

- **Sequential confounding**: the effect of B depends on B always following A. "In an ATD ... the effects of sequence are controlled by counterbalancing (e.g., ABBAAB)."
- **Carryover effects**: "the influence of one treatment on an adjacent treatment, irrespective of overall sequencing." Counterbalancing helps here too, and "relatively brief periods of treatment minimize contrast effects."
- **Alternation effects**: the rapid alternation itself changes the response.

Two practical advantages matter for a budget the app does not know: the comparison "can be made more quickly than in a withdrawal design", and the design "allows sudden termination of the experiment with the likelihood of having obtained usable data. A withdrawal design, however, must be carried through to completion." The ATD can also proceed "without a formal baseline phase" ([Barlow & Hayes 1979](https://doi.org/10.1901/jaba.1979.12-199)).

The What Works Clearinghouse standards set the evidence bar: "An alternating treatment design needs five repetitions of the alternating sequence to Meet Standards ... A design with four repetitions would Meet Standards with Reservations, and a design with fewer than four repetitions Does Not Meet Standards" ([WWC single-case design technical documentation, p. 15](https://ies.ed.gov/ncee/wwc/docs/referenceresources/wwc_scd.pdf)). The same document says a study "must include at least three attempts to demonstrate an intervention effect at three different points in time" and notes the three-demonstration rule "is based on professional convention" ([WWC, p. 15 and note 9](https://ies.ed.gov/ncee/wwc/docs/referenceresources/wwc_scd.pdf)).

### Randomization tests are the analysis that survives few observations

Kratochwill and Levin recommend "that traditional single-case intervention designs be transformed into more scientifically credible randomized single-case intervention designs whenever the research conditions under consideration permit" ([Kratochwill & Levin 2010](https://doi.org/10.1037/a0017736)). Test Mode controls assignment, so it can randomize.

Tanious and Onghena describe the matching analysis. For alternation designs, "a limit is placed on the maximum number of measurements taken consecutively under the same condition. Recommended limits are two consecutive measures or three consecutive measures." A randomized block design groups "treatments closely together in time ... into blocks and the order of treatment administration within each block is randomized." The randomization test needs no distributional assumptions because the actual arrangement "is one chosen at random from a predetermined set." Its floor is hard: "When less than 20 randomizations are possible, a randomization test has zero power at a conventional level α of 0.05." Their own ATD example bottomed out at "1/14 = 0.07" ([Tanious & Onghena 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6955662/)). Onghena and Edgington derived the test for the restricted ATD, where "complete randomization might cause too many consecutive administrations of the same treatment" ([Onghena & Edgington 1994](https://doi.org/10.1016/0005-7967(94)90036-1)).

The AHRQ guide gives the simplest blocked analyses. The sign test counts "the number of blocks in which A outperforms B"; with three blocks all favouring A, "the probability would be 1/2 * 1/2 * 1/2 = 1/8." Averaging within-block differences "corresponds to a paired t-test." Both ignore autocorrelation and trend, so the guide says "it is usually worth constructing a proper statistical model" when the data allow it, and that "when the data are simple and treatment differences are clear, such simple methods work well; graphs are always informative" ([AHRQ 2014, ch. 4, Nonparametric Tests; Estimation](https://effectivehealthcare.ahrq.gov/sites/default/files/pdf/n-1-trials_research-2014-5.pdf)). The guide's checklist adds: "Significance testing is less pertinent for n-of-1 trials than the provision of the information needed for the users to make decisions" ([AHRQ 2014, ch. 4 checklist](https://effectivehealthcare.ahrq.gov/sites/default/files/pdf/n-1-trials_research-2014-5.pdf)).

### Skipped days are missing data, and the randomized-marker method handles them

De, Michiels, Tanious and Onghena simulated 10%, 30% and 50% missing data in ABAB, randomized block and multiple-baseline designs. "The randomized-marker method outperforms the other two methods in terms of statistical power in a randomization test, while keeping the type I error rate under control." The method is "randomizing a missing-data marker and calculating all reference statistics only for the available data points" ([De et al. 2020](https://doi.org/10.3758/s13428-019-01320-3)). A follow-up found the method "remains valid and results in sufficient statistical power for most of the missing data conditions" when data are missing at random or not at random ([De & Onghena 2022](https://doi.org/10.3758/s13428-021-01781-5)). The WWC also warns that dropout "could render the data series too short" and that is why it sets a five-point minimum per phase ([WWC, p. 10](https://ies.ed.gov/ncee/wwc/docs/referenceresources/wwc_scd.pdf)).

### Carryover and order effects: design against them, do not test for them

The AHRQ guide: "Carryover ... threatens the validity of the comparison between treatments in crossover studies", and "Both design and analytic approaches can address carryover." The analytic route "downweights, disregards, or simply does not collect outcomes at the beginning of a treatment period, thus creating an analytic washout period" ([AHRQ 2014, ch. 4, Washout; Carryover](https://effectivehealthcare.ahrq.gov/sites/default/files/pdf/n-1-trials_research-2014-5.pdf)). "Washout is not necessary if treatment duration of action is short relative to treatment period" ([AHRQ 2014, ch. 1 checklist](https://effectivehealthcare.ahrq.gov/sites/default/files/pdf/n-1-trials_research-2014-5.pdf)).

Senn and Hildebrand frame the statistical limit: "Carryover is just one form of period by treatment interaction" ([Senn & Hildebrand 1991](https://doi.org/10.1002/sim.4780100905)). With one reader and one observation per day, carryover cannot be separated from a period-by-condition interaction, so the design has to balance it rather than estimate it.

A simulation of crossover n-of-1 trials with fixed data collection confirms two things. First, breaking a fixed number of observations into more, shorter alternations raises power under autocorrelation: with 400 observations and ρ = 0.5, one period per intervention gave power 0.330 and forty periods per intervention gave 0.674. Second, power to detect carryover is poor (0.10 to 0.19 for a 0.3 SD carryover), and "the use of washout periods—when no carryover effects are present—reduces power slightly" ([Power and design issues in crossover-based n-of-1 clinical trials with fixed data collection periods, 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6787650/)). For Test Mode: alternate daily, do not spend budget on washout days, and do not try to detect carryover.

Williams designs balance first-order carryover by construction. With n treatments, Williams showed that a design balanced for the effect of the single preceding treatment needs n sequences when n is even and 2n sequences when n is odd ([Williams 1949](https://doi.org/10.1071/CH9490149)). For 3 levels that is 6 sequences of 3 days, 18 days, which fits the budget for a single variable.

The practical concern in Test Mode is not physiological carryover; it is the reader's practice effect on WPM across days and the reader's day-to-day text, mood and device. Those are time trends, and the block-and-randomize rule handles them ([NIST/SEMATECH e-Handbook, 5.3.3.2, "Block what you can, randomize what you cannot"](https://www.itl.nist.gov/div898/handbook/pri/section3/pri332.htm)).

### Latin squares and fractional factorials cover more variables in fewer days

A Latin square is "an efficient design to block from 2 to 4 nuisance factors": a k x k grid in which "each row and each column receive each treatment exactly once", needing k² runs, and it "assumes that there are no interactions between the blocking variables or between the treatment variable and the blocking variable" ([NIST/SEMATECH e-Handbook, 5.3.3.2.1](https://www.itl.nist.gov/div898/handbook/pri/section3/pri3321.htm)). Read the two blocking factors as two of the test variables and the treatment as the third, and a 3 x 3 Latin square is a 9-day plan that visits each level of each variable three times, once with every level of the others.

The same plan is the 3^(3-1) fractional factorial, listed in the handbook as the Taguchi L9 array: "4 three-level factors in 9 runs." Such designs "obtain a lot of information about the main effects in a relatively few number of runs" but "provide limited information about interactions" ([NIST/SEMATECH e-Handbook, 5.3.3.10](https://www.itl.nist.gov/div898/handbook/pri/section3/pri33a.htm)). In resolution terms, "main effects are confounded (aliased) with two-factor interactions" in a resolution III design ([NIST/SEMATECH e-Handbook, 5.3.3.4.4](https://www.itl.nist.gov/div898/handbook/pri/section3/pri3344.htm)). The handbook's advice on many factors is to "screen first to reduce number of factors" and then study the survivors ([NIST/SEMATECH e-Handbook, 5.3.3](https://www.itl.nist.gov/div898/handbook/pri/section3/pri33.htm)).

Level counts drive the day count: k levels per variable needs k² days per replicate. 3 levels: 9 days. 4 levels: 16 days. 5 levels: 25 days. 6 levels: 36 days. Inside a 14 to 21 day budget, that means 3 levels per variable (two replicates fit in 18 days) or 4 levels per variable (one replicate, no repetition, 16 days).

### Multiple-baseline and ABAB designs do not fit

The multiple-baseline design staggers an intervention across cases, behaviours or settings; "the power of such designs comes from demonstrating that change occurs when, and only when, the intervention is directed at the behavior" ([Tanious & Onghena 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6955662/)). The WWC requires "a minimum of six phases with at least 5 data points per phase" to meet standards, and an ABAB design "a minimum of four phases per case with at least 5 data points per phase" (3 per phase with reservations) ([WWC, p. 15](https://ies.ed.gov/ncee/wwc/docs/referenceresources/wwc_scd.pdf)). That is 30 days for one multiple-baseline comparison and 12 to 20 days for one two-level ABAB comparison. Neither fits three variables in 21 days, and multiple-baseline exists for effects that do not reverse, which display settings do.

## The designs that fit

Common rules for all three designs:

1. The app assigns test conditions in complete blocks. It randomizes the order inside each block, with a restriction that no level of any variable runs more than two days in a row ([Tanious & Onghena 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6955662/)).
2. A skipped calendar day does not consume its assigned test condition. The condition moves to the next day the reader reads, so every block completes. The analysis uses the reading-day index, not the calendar day, as its time axis, and applies the randomized-marker method if any day inside a completed block has no usable session ([De et al. 2020](https://doi.org/10.3758/s13428-019-01320-3)).
3. The declared trial budget sets the planned number of blocks. The trial report is valid after any complete block, so an early stop or an extension changes only how much evidence there is ([AHRQ 2014, ch. 4](https://effectivehealthcare.ahrq.gov/sites/default/files/pdf/n-1-trials_research-2014-5.pdf); [Barlow & Hayes 1979](https://doi.org/10.1901/jaba.1979.12-199)).
4. No washout days. The effect of a display setting ends when the session ends ([AHRQ 2014, ch. 1 checklist](https://effectivehealthcare.ahrq.gov/sites/default/files/pdf/n-1-trials_research-2014-5.pdf)).
5. The primary analysis is a randomization test over the block orders actually used, reported as a per-level mean of WPM and of reader joy with the number of complete blocks beside it. The sign test and paired differences are the readable summary ([AHRQ 2014, ch. 4](https://effectivehealthcare.ahrq.gov/sites/default/files/pdf/n-1-trials_research-2014-5.pdf)).

### Design A: one test variable at a time, randomized blocks (restricted ATD)

**Sequence.** Pick one test variable with k levels. Hold the other two at the reader's current settings. Each block is k days, one day per level, in random order. Repeat blocks until the budget runs out. For k = 3, 14 days gives 4 complete blocks with 2 days left over; 21 days gives 7. For k = 2 (current setting versus one challenger), 14 days gives 7 pairs. If the reader wants first-order carryover balanced exactly, use the six Williams sequences for k = 3 as the first six blocks (18 days) ([Williams 1949](https://doi.org/10.1071/CH9490149)).

**Skipped day.** The block stays open until every level has a session. The randomization test still counts only the orders that were possible under the restriction.

**Analysis.** Per-level means of WPM and reader joy; the sign test over blocks for any two levels; a randomization test with (k!)^b possible orders for b blocks (3 levels, 4 blocks: 1296 orders; 5 blocks: 7776) ([Onghena & Edgington 1994](https://doi.org/10.1016/0005-7967(94)90036-1)). Meets the WWC bar at five blocks, meets it with reservations at four ([WWC, p. 15](https://ies.ed.gov/ncee/wwc/docs/referenceresources/wwc_scd.pdf)).

**Unknown budget.** Best of the three. Every complete block is a full replicate. Stopping at any point leaves a balanced comparison.

**Trade-offs.** It answers one variable per trial, so covering all three takes three trials (around 45 days at 3 levels, 5 blocks each). Levels above 3 eat the budget fast: 5 levels needs 25 days for 5 blocks. It cannot see interactions with the two held variables, but it does not assume them away either, because those variables never change. It gives the reader the cleanest report.

### Design B: 3 x 3 Latin square (L9) screen, in randomized blocks

**Sequence.** Trim each test variable to 3 levels for this trial. Build the 9 test conditions of a 3 x 3 Latin square (equivalently the 3^(3-1) fraction): every level of every variable appears three times, once with each level of the other two. Each block is those 9 conditions in random order, with the no-more-than-two-in-a-row restriction on each variable. 14 days gives one block plus 5 spare days; 18 to 21 days gives two blocks. With 4 levels per variable the block is 16 days and only one block fits ([NIST/SEMATECH e-Handbook, 5.3.3.2.1](https://www.itl.nist.gov/div898/handbook/pri/section3/pri3321.htm); [5.3.3.10](https://www.itl.nist.gov/div898/handbook/pri/section3/pri33a.htm)).

**Skipped day.** As above: the block waits for its missing condition. A partial block is not balanced, so the report shows it as incomplete and uses only complete blocks for the main-effect means.

**Analysis.** Main-effect means per level, each from 3 sessions per block (6 with two blocks). A main-effects ANOVA has almost no error degrees of freedom in one block (2), and 10 in two blocks; the randomization test over run order within each block is the honest test. No test of interactions is possible ([NIST/SEMATECH e-Handbook, 5.3.3.4.4](https://www.itl.nist.gov/div898/handbook/pri/section3/pri3344.htm)).

**Unknown budget.** Fair. Nothing is defensible before day 9. After day 9 the reader has a screening result; days 10 to 17 add nothing until the second block closes at day 18. Spare days (10 to 14 in a 14-day budget) are wasted unless the app switches to Design C.

**Trade-offs.** It is the only way to see all three variables in one trial. It assumes the variables do not interact, and that is a real risk here: a long chunk size with a wide font can overflow the display, which is a font-by-chunk-size interaction. A single block has one session per condition, so one bad day (hard text, tired reader) sits inside one condition's only observation. It cannot handle 5 or 6 levels: those variables must be pruned before the trial or split across trials.

### Design C: screen, then confirm (recommended)

**Sequence.** Days 1 to 9: one L9 block as in Design B, randomized. Day 10 onward: take the predicted best test condition from the screen and compare it against the reader's pre-trial settings in randomized pairs of days (AB or BA per pair), the AHRQ two-treatment blocked design ([AHRQ 2014, ch. 4](https://effectivehealthcare.ahrq.gov/sites/default/files/pdf/n-1-trials_research-2014-5.pdf)). A 14-day budget gives 2 pairs, which is not enough; a 19-day budget gives 5 pairs; 21 days gives 6. If the screen produces two candidates that are close, the app can compare those two instead.

**Skipped day.** Each pair stays open until both days have a session.

**Analysis.** Stage 1: per-level means as a screen, labelled as such. Stage 2: sign test and paired differences over pairs; randomization test with 2^p orders for p pairs (5 pairs: 32 orders, smallest one-sided p = 1/32; 6 pairs: 64). Four pairs gives only 16 orders, below the 20 needed for any power at α = 0.05 ([Tanious & Onghena 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6955662/)).

**Unknown budget.** Good. Day 9 closes the screen. Every later pair adds one replication, and the head-to-head claim becomes defensible at the fifth pair ([WWC, p. 15](https://ies.ed.gov/ncee/wwc/docs/referenceresources/wwc_scd.pdf)). If the reader keeps going, pairs keep accumulating.

**Trade-offs.** The screen carries the no-interaction assumption, but stage 2 checks the screen's answer against reality: if the predicted winner does not beat the reader's own settings across five pairs, the report says so. Stage 2 confirms only one candidate; a second-best condition stays untested. The reader must accept that the first 9 days feel scattered, since every day is a new combination. It needs at least 19 days to reach a defensible head-to-head result, so the app should tell a reader who declares 14 days that they will get a screen and a partial confirmation.

### Comparison

| | A: one variable, blocks | B: L9 screen | C: screen then confirm |
| --- | --- | --- | --- |
| Variables answered per trial | 1 | 3 (main effects) | 3 screened, 1 condition confirmed |
| Assumes no interactions | No | Yes | Yes for the screen, no for the confirmation |
| Days to first defensible claim | 12 to 15 (3 levels, 4 to 5 blocks); 10 (2 levels, 5 pairs) | 9 for a screen; never a confirmed claim inside 21 | 9 for a screen; 19 for a confirmed claim |
| Handles 5 to 6 levels | Poorly (25 to 36 days per 5 blocks) | No (25 to 36 days per block) | No; prune to 3 or 4 levels |
| Early stop | Any complete block | Only at day 9 or 18 | Day 9, then any complete pair |
| Skipped day | Block waits | Block waits | Pair waits |
| Report the reader sees | One clean ranking | Three main-effect rankings, labelled screen | A screen and one verdict |

## Minimum data before a claim is defensible

For a two-condition comparison, five complete pairs of days (10 reading days): that is the WWC's "five repetitions of the alternating sequence" ([WWC, p. 15](https://ies.ed.gov/ncee/wwc/docs/referenceresources/wwc_scd.pdf)), the point at which a randomization test first has more than 20 possible orders (2^5 = 32) ([Tanious & Onghena 2019](https://pmc.ncbi.nlm.nih.gov/articles/PMC6955662/)), and the point at which a unanimous sign test reaches one-sided p = 1/32 ([AHRQ 2014, ch. 4](https://effectivehealthcare.ahrq.gov/sites/default/files/pdf/n-1-trials_research-2014-5.pdf)). For one three-level variable, four complete blocks (12 days) meets the bar with reservations and five (15 days) meets it. For three variables at once, one L9 block (9 days) supports a screen and nothing more; two blocks (18 days) support main-effect means from six sessions per level but still no test of interactions. Below those counts the report should show the running means and the sequence diagram, and should not rank conditions or name a winner. Two more caveats apply at every count. The reader cannot be blinded to a font or a colour, so reader joy will include preference; the AHRQ guide says such effects, if they persist, are "a real effect for this patient and should be part of the treatment decision" ([AHRQ 2014, ch. 4, Blinding](https://effectivehealthcare.ahrq.gov/sites/default/files/pdf/n-1-trials_research-2014-5.pdf)). And WPM improves with practice across the trial, so any per-level mean must come from a balanced block, never from a partial one.

## Pointer for later: multi-armed bandits

The map defers adaptive assignment until a fixed design has produced data. The standard reference is Lattimore and Szepesvári, *Bandit Algorithms* (Cambridge University Press, 2020; free edition at [tor-lattimore.com](https://tor-lattimore.com/downloads/book/book.pdf)). Two facts from the framing there matter for the decision to wait: a bandit optimizes reward earned during the trial, not the certainty of the final ranking, and with 9 to 27 arms and 14 to 21 pulls it would spend nearly the whole budget on its first visit to each arm. The fixed designs above are the "explore" phase a bandit would need anyway.

## Sources

- Kravitz RL, Duan N (eds). *Design and Implementation of N-of-1 Trials: A User's Guide*. AHRQ Publication No. 13(14)-EHC122-EF, 2014. https://effectivehealthcare.ahrq.gov/sites/default/files/pdf/n-1-trials_research-2014-5.pdf (chapter 1: https://effectivehealthcare.ahrq.gov/products/n-1-trials/research-2014-4; chapter 4: https://effectivehealthcare.ahrq.gov/products/n-1-trials/research-2014-1)
- Vohra S, Shamseer L, et al. CONSORT extension for reporting N-of-1 trials (CENT) 2015 Statement. BMJ 2015;350:h1738. https://doi.org/10.1136/bmj.h1738; EQUATOR entry https://www.equator-network.org/reporting-guidelines/consort-cent/
- Barlow DH, Hayes SC. Alternating treatments design: one strategy for comparing the effects of two treatments in a single subject. J Appl Behav Anal 1979;12:199-210. https://doi.org/10.1901/jaba.1979.12-199
- What Works Clearinghouse. Single-Case Design Technical Documentation. https://ies.ed.gov/ncee/wwc/docs/referenceresources/wwc_scd.pdf
- Kratochwill TR, Levin JR. Enhancing the scientific credibility of single-case intervention research: randomization to the rescue. Psychol Methods 2010;15:122-144. https://doi.org/10.1037/a0017736
- Tanious R, Onghena P. Randomized single-case experimental designs in healthcare research: what, why, and how? Healthcare 2019;7:143. https://pmc.ncbi.nlm.nih.gov/articles/PMC6955662/
- Onghena P, Edgington ES. Randomization tests for restricted alternating treatments designs. Behav Res Ther 1994;32:783-786. https://doi.org/10.1016/0005-7967(94)90036-1
- De TK, Michiels B, Tanious R, Onghena P. Handling missing data in randomization tests for single-case experiments: a simulation study. Behav Res Methods 2020. https://doi.org/10.3758/s13428-019-01320-3
- De TK, Onghena P. The randomized marker method for single-case randomization tests: handling data missing at random and data missing not at random. Behav Res Methods 2022. https://doi.org/10.3758/s13428-021-01781-5
- Senn S, Hildebrand H. Crossover trials, degrees of freedom, the carryover problem and its dual. Stat Med 1991;10:1361-1374. https://doi.org/10.1002/sim.4780100905
- Power and design issues in crossover-based N-of-1 clinical trials with fixed data collection periods. Healthcare 2019. https://pmc.ncbi.nlm.nih.gov/articles/PMC6787650/
- Williams EJ. Experimental designs balanced for the estimation of residual effects of treatments. Aust J Sci Res A 1949;2:149-168. https://doi.org/10.1071/CH9490149
- NIST/SEMATECH e-Handbook of Statistical Methods. 5.3.3 Choosing an experimental design (https://www.itl.nist.gov/div898/handbook/pri/section3/pri33.htm); 5.3.3.2 Randomized block designs (https://www.itl.nist.gov/div898/handbook/pri/section3/pri332.htm); 5.3.3.2.1 Latin square and related designs (https://www.itl.nist.gov/div898/handbook/pri/section3/pri3321.htm); 5.3.3.4 Fractional factorial designs (https://www.itl.nist.gov/div898/handbook/pri/section3/pri334.htm); 5.3.3.4.4 Design resolution (https://www.itl.nist.gov/div898/handbook/pri/section3/pri3344.htm); 5.3.3.10 Three-level, mixed-level and fractional factorial designs (https://www.itl.nist.gov/div898/handbook/pri/section3/pri33a.htm)
- Lattimore T, Szepesvári C. *Bandit Algorithms*. Cambridge University Press, 2020. https://tor-lattimore.com/downloads/book/book.pdf
