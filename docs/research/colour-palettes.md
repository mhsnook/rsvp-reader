# Colour palettes for dyslexic readers

Research for ticket [#10](https://github.com/mhsnook/rsvp-reader/issues/10), part of map [#9](https://github.com/mhsnook/rsvp-reader/issues/9). Written 2026-09-11.

A **colour palette** here means one named text/background pair.

## Question

Which text and background colour pairs does primary evidence support as easing reading for dyslexic readers, and which does it rule out?

## Short answer

- Three controlled studies measure reading with colour as the variable (Rello and Baeza-Yates 2012 and 2017; Rello and Bigham 2017). They point the same way: **black text on a warm, light tint (peach, cream, pale yellow) reads fastest**, and **cool tints (blue grey, blue, green) read slowest**. Only the largest study (341 readers) reaches statistical significance; the two eye-tracking studies show the same ordering without significance.
- **Pure black on pure white is not shown to harm reading.** It sits mid-table on performance. What the data show is that dyslexic readers *choose* it less often (13.64%, against 32.67% of non-dyslexic readers). The British Dyslexia Association's advice against white cites no study.
- **Below-WCAG contrast is ruled out.** The one pair under the WCAG threshold read slowly and almost nobody chose it. Grey text on white and white text on grey gave no readability gain and zero preference votes.
- **The coloured-overlay (Irlen, Intuitive) literature does not supply a palette.** Its own proponents say colour must be prescribed per person, that it addresses "visual stress" not dyslexia, and that about 20% of dyslexic readers have visual stress. Its critics (two independent 2011–2013 studies, a 2016 systematic review, and the AAP/AAO joint statement) find no effect on reading beyond placebo. Either way, no universal colour comes out of it.
- **Preference and performance do not agree.** Dyslexic readers' favourite pair (black on yellow) was their slowest in 2012. Test Mode should measure WPM and self report separately, which the map already plans.

## Candidate colour palettes

Hex values come from the source that tested them. Contrast ratios are WCAG 2 luminance ratios, which I computed and checked against the ratios Rello and Bigham print (they match). WCAG AA needs 4.5:1; AAA needs 7:1.

| Name | Text | Background | Contrast | Evidence for | Evidence against or caveat |
|---|---|---|---|---|---|
| **Black on peach** | `#000000` | `#EDD1B0` | 14.35:1 | Fastest of 10 backgrounds for both dyslexic (14.85 s) and control (12.28 s) readers; significantly faster than blue grey, green, blue, grey (Rello & Bigham 2017). | Not tested against white; the authors list that as future work. Reader preference not measured. |
| **Black on cream** | `#000000` | `#FAFAC8` | 19.57:1 | Fastest of 8 pairs for dyslexic readers by fixation duration, 0.214 s (Rello & Baeza-Yates 2012). Numerically fastest again in the 2017 replication (0.208 s dyslexic, 0.187 s control). Matches the BDA's named recommendation, "cream". | The 2017 replication found no significant effect of colour pair (F(7,732) = 0.848, p = 0.548). Second most preferred by dyslexic readers in 2012. |
| **Black on warm yellow** | `#000000` | `#EDDD6E` | 15.17:1 | Second fastest background, 15.33 s dyslexic and 12.32 s control (Rello & Bigham 2017, called "Orange" in the paper). | Same untested-against-white caveat. The paper flags that warm colours "stimulate" and some readers may prefer a cool colour. |
| **Black on pale yellow** | `#000000` | `#F8FD89` | 19.40:1 | Third fastest background, 16.30 s dyslexic and 13.43 s control (Rello & Bigham 2017). | Pure yellow `#FFFF00` was the *slowest* pair for dyslexic readers in 2012 (0.239 s) while being their *most preferred*. Treat yellow as a preference magnet, not a performance win. |
| **Dark blue on cream** | `#00007D` | `#FAFAC8` | 15.10:1 | Never tested as a pair. Rello and Baeza-Yates 2017 suggest it: control readers rated blue/white and blue/yellow highest, "suggesting that in future experiments blue/creme should also be tried". Dyslexia Scotland recommends "dark blue text on cream, pastel or off-white". BDA 2023 says "dark coloured text on a light (not white) background". | Guidance only; no reading measure exists for this pair. Include only if the trial wants a "guideline" arm. |
| **Off-black on off-white** | `#0A0A0A` | `#FFFFE5` | 19.50:1 | Recommended by Bradford (2011) for dyslexic web users; the pair that "soften both ends" advice usually means. | In 2012 no dyslexic reader chose it and it read mid-table; it was the slowest pair for control readers (0.193 s). Weakest candidate. |
| **Black on white** (baseline) | `#000000` | `#FFFFFF` | 21.00:1 | The default everywhere, so the natural control arm. In the 2017 replication it read no slower than any tint, and the authors' final recommendation is "black font on white background, or white font on black background". | Least chosen by dyslexic readers (13.64%). The BDA says "white can appear too dazzling" but cites nothing. |

Two palettes the app already ships, for comparison:

| Name | Text | Background | Contrast | Note |
|---|---|---|---|---|
| Current light | `#1E293B` (slate-800) | `#F0F9FF` (sky-50) | 13.72:1 | A cool tint. The only evidence on cool tints points against them, though sky-50 is far lighter than the blue grey `#DBE1F1` that read slowest. |
| Current dark | `#F3F4F6` (gray-100) | `#030712` (gray-950) | 18.30:1 | No controlled study of light-on-dark for dyslexic readers turned up. Rello and Baeza-Yates 2017 found no readability difference across white-on-black grey levels and recommend white on black as equal to black on white. |

## What the evidence rules out

1. **Cool tinted backgrounds** as a "dyslexia-friendly" choice. Blue grey `#DBE1F1` read 45% slower than peach for dyslexic readers and 53% slower for controls; blue `#96ADFC` and green `#A8F29A` read about 30% slower. All differences p < 0.001 (Rello & Bigham 2017, Table 1). The authors add that this "does not necessarily mean that such colors need to be avoided", since preference was not measured.
2. **Contrast below WCAG.** Brown on mucky green `#282800`/`#A0A000` (5.4:1 by WCAG 2, and under the older W3C brightness/colour-difference rule) had the second and third highest fixation durations and was chosen by 0.99% of dyslexic readers (Rello & Baeza-Yates 2012). The same paper concludes that dyslexic readers' faster pairs "are not lower than the W3C algorithm". WCAG 1.4.3 does allow authors to *offer* low-contrast options for "some people with cognitive disabilities", but only as a switchable extra.
3. **Grey text on white and white text on grey.** Four grey levels each way: no readability effect and 0% preference in both groups (Rello & Baeza-Yates 2017, results table). "Soften the text to grey" has no support.
4. **A single prescribed overlay colour as a palette.** The overlay literature's own method is per-person colour selection (Wilkins 1994: "different for each individual"; Evans & Allen 2016: "individually prescribed"). It cannot yield a universal pair. And the app must not claim treatment: Evans and Allen state coloured filters "are not a treatment for dyslexia", which matches the map's out-of-scope rule on clinical claims.
5. **The claim that black on white harms dyslexic readers.** No controlled study found supports it. Black on white was mid-table in 2012, indistinguishable in 2017, and is the 2017 journal paper's own recommendation. Treat "avoid white" as a preference finding, not a performance finding.
6. **Red, pink and green as text or highlight colours.** BDA 2023: "Avoid pink, red and green as these colours are difficult for anyone who has any level of colour blindness." This is a colour-vision rule, not a dyslexia finding, but it constrains any palette.

## Sources in detail

### British Dyslexia Association style guide

The guide is advice, not a study. It cites no evidence for its colour lines.

- 2023 edition, "Colour/Printing" section: "Always use single colour backgrounds." "Make sure there is appropriate contrast levels between background and text – a dark coloured text on a light (not white) background." "Avoid pink, red and green as these colours are difficult for anyone who has any level of colour blindness." "White backgrounds aren't always the best. Remember this when using whiteboards. Cream is a good alternative. However, some children with dyslexia will have a particular colour that helps."
  Official URL: https://cdn.bdadyslexia.org.uk/uploads/documents/Advice/style-guide/BDA-Style-Guide-2023.pdf (the CDN refused automated download; I read a mirrored copy of the same PDF).
- 2014 edition: "Avoid white backgrounds for paper, computer and visual aids. White can appear too dazzling. Use cream or a soft pastel colour. Some dyslexic people will have their own colour preference." "Use dark coloured text on a light (not white) background." Web section: "Most users prefer dark print on a pale background. Colour preferences vary." and "Make sure that it is possible for users to set their own choice of font style and size, background and print colours."
  https://www.thedyslexia-spldtrust.org.uk/media/downloads/69-bda-style-guide-april14.pdf
- Dyslexia Scotland notes the tension between WCAG's 4.5:1 minimum and dyslexia guides' lower-contrast advice, recommends "dark blue text on cream, pastel or off-white backgrounds", and cites no study.
  https://dyslexiascotland.org.uk/contrasting-advice-what-colours-are-best-for-accessibility/

### Rello and Baeza-Yates 2012, "Optimal Colors to Improve Readability for People with Dyslexia"

W3C Text Customization for Readability symposium paper. https://www.w3.org/WAI/RD/2012/text-customization/r11

- 23 participants with dyslexia and 92 without. Eye tracking; measure is mean fixation duration. Arial 20 pt, 22-syllable texts.
- Eight pairs with hex values: black `#000000` on white `#FFFFFF`; off-black `#0A0A0A` on off-white `#FFFFE5`; black on yellow `#FFFF00`; blue `#00007D` on white; black on creme `#FAFAC8`; blue on yellow; dark brown `#1E1E00` on light mucky green `#B9B900`; brown `#282800` on mucky green `#A0A000`.
- Why each pair: black/white and blue/white "because they are the most commonly used"; off-black/off-white "because it is recommended in Web accessibility for people with dyslexia (Bradford, 2011)"; the brown/green and blue/yellow pairs "because they were chosen by people with dyslexia in previous experiments (Gregor et al., 2003; Gregor and Newell, 2000)"; black/creme "because it is used — and recommended — by the British Dyslexia Association for their website"; black/yellow "because of its high contrast".
- Results, dyslexic group, fastest to slowest: black/creme (0.214 s); blue/yellow; dark brown/light green; brown/mucky green; black/white; off-black/off-white; blue/white; black/yellow (0.239 s).
- Preference, dyslexic group, most to least: black/yellow; black/creme; blue/white; black/white; blue/yellow; dark brown/light green; brown/mucky green; off-black/off-white (chosen by none).
- "The greatest difference among groups is on the black & white pair: while the majority of people without dyslexia prefer it (32.67%), only 13.64% of the participants with dyslexia chose black text on white background."
- "we found no correlation between the reading performance and the personal choice of the users."
- "Even if people with dyslexia read faster using lower color contrasts than the control group these are not lower than the W3C algorithm."
- Stated weaknesses: order not counterbalanced; "the texts are too small to draw strong conclusions"; texts shown alone on screen.

### Rello and Baeza-Yates 2017, "How to present more readable text for people with dyslexia"

Universal Access in the Information Society 16:29–49. Journal version with a larger, balanced sample. https://link.springer.com/article/10.1007/s10209-015-0438-8 (open copy: https://repositori.upf.edu/server/api/core/bitstreams/275f50cd-7524-479a-a09f-1edc22830b30/content)

- 92 participants, 46 with dyslexia, 46 controls. Same eight pairs; same hex values (Appendix A).
- Colour result: "no effects of text and background colors (F(7,732) = 0.848, p = 0.548) were found on fixation duration. Moreover, no interaction effects of text and background colors and groups (F(7,732) = 0.528, p = 0.814) have been found either." Black/creme was still numerically fastest (0.208 s dyslexic, 0.187 s control). The summary table marks colours "no effects / no effects / No recommendations".
- Grey scale: four grey text levels on white and four grey background levels under white text gave no readability effect and 0% preference in both groups. Recommendation: "black font on white background, or white font on black background."
- Discussion: black/white "is the most readable option, maybe because it is the most frequent color combination used in computer screens. However, only 60% of the participants with dyslexia chose this option." Off-black/off-white "was the least often selected by the participants with dyslexia (only two selected it)." Black/yellow was most preferred and had the highest mean fixation (0.23 s).
- Suggests blue/creme for future tests.
- What did move the needle: font size 18–26 pt and +7% to +14% character spacing, both significant for both groups. Colour was not among the significant variables.

### Rello and Bigham 2017, "Good Background Colors for Readers: A Study of People with and without Dyslexia"

ASSETS 2017, pp. 72–80. https://dl.acm.org/doi/10.1145/3132525.3132546 (PDF: https://www.cs.cmu.edu/~jbigham/pubs/pdfs/2017/colors.pdf)

- 341 participants, 89 with dyslexia. Online, within-subject, 10 counterbalanced texts. Measures: reading time and mouse distance; comprehension questions as a control (wrong answers discarded).
- Text colour black. Ten backgrounds with hex and contrast: Blue `#96ADFC` 9.68:1; Blue Grey `#DBE1F1` 16.05:1; Green `#A8F29A` 15.83:1; Grey `#D8D3D6` 14.21:1; Orange `#EDDD6E` 15.17:1; Peach `#EDD1B0` 14.35:1; Purple `#B987DC` 7.56:1; Red `#E0A6AA` 10.2:1; Turquoise `#A5F7E1` 16.99:1; Yellow `#F8FD89` 19.4:1. "Since all the color contrasts are greater than 7:1 they all meet the WCAG color contrast requirements for AAA." (The PDF's RGB triplets are misaligned with the hex list by one row; I confirmed the hex values by reproducing the printed contrast ratios.)
- Why these colours: "because they have been recommended and studied in previous literature about dyslexia [4, 12, 26] and Meares-Irlen syndrome".
- Reading time, dyslexic group, mean seconds and % of peach: Peach 14.85 (100), Orange 15.33 (103), Yellow 16.30 (109), Purple 17.21 (115), Red 17.47 (117), Turquoise 17.59 (118), Grey 18.05 (121), Blue 19.42 (130), Green 19.42 (130), Blue Grey 21.57 (145). Control group: Peach 12.28 (100), Orange 12.32 (100), Yellow 13.43 (109), Purple 14.68 (119), Turquoise 14.54 (118), Red 14.97 (121), Grey 16.03 (130), Blue 16.24 (132), Green 16.45 (133), Blue Grey 18.82 (153).
- Friedman test significant for both groups (dyslexic: χ²(9) = 299.16, p < 0.001). Post hoc: peach significantly faster than blue grey, green, blue (all p < 0.001) and grey (p = 0.002) for dyslexic readers. Blue grey significantly slower than every other colour for controls (all p < 0.001).
- Between groups: reading time and mouse distance orderings correlate strongly (ρ = 0.964 and 0.794). "the impact is comparable for both groups."
- The authors' own caveats: "These results do not necessarily mean that warm colors are recommended for people with and without dyslexia." "Some readers might prefer a cool color rather than a warm color if that color relaxes the reader. Further studies would need to explore the interaction between reading performance and reading preferences to make a sound background color recommendation." Future work: "compare the most beneficial background colors (Peach, Orange and Yellow) with the most common background colors used on the Web such as white or off-white." So **peach vs white is untested**.

### Coloured overlays and lenses (Irlen, Intuitive, ChromaGen)

Proponents' primary evidence:

- Wilkins et al. 1994, double-masked placebo-controlled trial, 68 children who already used overlays: symptoms of eye-strain and headache "were less frequent on days when the 'experimental' lenses were worn (P < 0.003)". The effective colour "was different for each individual." Outcome was symptoms, not reading. https://pubmed.ncbi.nlm.nih.gov/7845693/
- Bouldoukian, Wilkins and Evans 2002, RCT, 33 children and adults who already reported relief from filters: Wilkins Rate of Reading Test (random common words, "assesses visual rather than linguistic factors") faster with chosen overlay than control filter (p = 0.0019). https://pubmed.ncbi.nlm.nih.gov/11829008/
- Evans and Allen 2016, systematic review of Intuitive Overlay and Colorimeter trials (10 overlay trials, 3 colorimeter trials): "a minority subset of dyslexics (circa 20%) may have a condition described as visual stress"; "visual stress is distinct from, although sometimes co-occurs with, dyslexia"; filters "are not a treatment for dyslexia"; "larger and rigorous randomised controlled trials ... are required." Visual stress is triggered by "repetitive patterns, including lines of text". https://pmc.ncbi.nlm.nih.gov/articles/PMC5030324/

Critics' primary evidence:

- Ritchie, Della Sala and McIntosh 2011, Pediatrics: 61 poor readers aged 7–12 assessed by an Irlen diagnostician, who diagnosed Irlen syndrome in 77% of them. Prescribed overlay vs non-prescribed overlay vs none: "no evidence for any immediate benefit of Irlen colored overlays as measured by the reading-rate test or the global reading measure." https://pubmed.ncbi.nlm.nih.gov/21930551/
- Henderson, Tsogka and Snowling 2013: undergraduates with and without dyslexia. "Both groups read jumbled text faster with a coloured overlay than without. The dyslexic group did not show greater gains than controls ... However, coloured overlays did not improve reading rate or comprehension of connected text." The gain on retest "was significantly reduced" for dyslexic students. https://eric.ed.gov/?id=EJ1011482
- Griffiths, Taylor, Henderson and Barrett 2016, systematic review of 51 items (54 data sets) under Cochrane risk-of-bias: "The majority of studies are subject to 'high' or 'uncertain' risk of bias ... with studies at lower risk from bias providing less support"; "the effect size is generally small and/or similar to the improvement found with a placebo condition"; "the use of coloured lenses or overlays to ameliorate reading difficulties cannot be endorsed and that any benefits reported by individuals in clinical settings are likely to be the result of placebo, practice or Hawthorne effects." They add: "lack of evidence is not evidence for a lack of effectiveness." https://pubmed.ncbi.nlm.nih.gov/27580753/
- Published replies: Evans 2017 "Coloured filters and reading: reasons for an open mind" (https://pubmed.ncbi.nlm.nih.gov/27905122/), Wilkins 2017 "Risk of bias in assessing Risk of Bias" (https://pubmed.ncbi.nlm.nih.gov/27905121/), and the authors' response (https://pubmed.ncbi.nlm.nih.gov/27905118/). The dispute is live; neither side claims a universal colour.
- AAP, AAO, AAPOS and AACO joint statement 2009, reaffirmed 2014: "vision problems are not the cause of primary dyslexia or learning disabilities. Scientific evidence does not support the efficacy of eye exercises, behavioral vision therapy, or special tinted filters or lenses for improving the long-term educational performance." https://pubmed.ncbi.nlm.nih.gov/19651597/

What this means for the app: the mechanism proponents describe (pattern glare from lines of text) does not exist in an RSVP display, which shows one word or chunk at a time with no lines. That makes the overlay literature even less transferable than it already is.

### WCAG 2.2, Success Criterion 1.4.3 Contrast (Minimum)

4.5:1 for normal text, 3:1 for large text (18 pt, or 14 pt bold). No maximum. "Some people with cognitive disabilities require color combinations or hues that have low contrast, and therefore we allow and encourage authors to provide mechanisms to adjust the foreground and background colors of the content." https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html

Every candidate palette above clears 7:1 (AAA), so the "lower contrast" that dyslexia guides ask for is still far above the legal floor; the guides mean "tinted", not "faint".

### Looked at and set aside

- Pinna and Deiana 2018 (i-Perception) colour *within* words and syllables, not text/background pairs. Not applicable. https://pubmed.ncbi.nlm.nih.gov/35145618/
- Searches for a controlled study of light-on-dark polarity in dyslexic readers returned only blog posts and one 1983 patent. No primary source found; the only measured data is the Rello and Baeza-Yates 2017 grey-scale experiment (no effect).

## How strong is the evidence overall

Moderate for "warm light tint beats cool tint", weak for everything else. The one adequately powered study (Rello and Bigham 2017, n = 341) gives a clear ordering with p < 0.001, and its ordering agrees with the two smaller eye-tracking studies. But it never tested white, measured reading of short paragraphs on a web page rather than RSVP, and did not measure preference; and the journal-quality eye-tracking replication (n = 92) found no significant colour effect at all, while font size and letter spacing did. The guidance documents (BDA, Dyslexia Scotland) cite no evidence. The overlay literature is contested at the level of systematic reviews and, by its own account, applies to a per-person colour for a minority subgroup, so it contributes no palette. Nothing here supports a clinical claim, and the most defensible statement for readers is: "warm tints read slightly faster for most people in one large study; the trial will find out what works for you."

## Notes for the test variable levels ticket

- Keep **black on white** as the control arm. It is the default the reader already knows and it is the pair the literature never showed to be worse.
- **Black on peach** `#000000`/`#EDD1B0` is the best-evidenced treatment arm. **Black on cream** `#000000`/`#FAFAC8` is the guideline-aligned alternative with two smaller studies behind it; the two tints are close in hue, so picking one avoids spending trial budget on a near-duplicate.
- If the trial wants a third level, **black on pale yellow** `#000000`/`#F8FD89` is the one most likely to split preference from performance, which is useful data for the joy vs WPM question.
- Do not spend a level on a cool tint or on grey text; the evidence is against both.
- The current light palette (slate on sky-50) is a cool tint. It can stay as the reader's untested default, but it should not be labelled as a "dyslexia" option.
- Dark mode has no dyslexia-specific evidence either way. Treat it as a reader-controlled setting rather than a test level, unless the trial explicitly wants to learn about it.
- Record the reader's self report on each palette. The 2012 data show preference and speed diverging, and Rello and Bigham say a sound recommendation needs both.
