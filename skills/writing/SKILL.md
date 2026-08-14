---
name: writing
description: "The writing craft, loadable by ANY role when authoring a piece meant to land with an audience — brief, manifesto, pitch deck, one-pager, essay, explanatory doc, speech, video script, email, announcement. Owns HOW it communicates (idea-force, narrative arc, segmentation, tone, impact principles), never the domain content. Load BEFORE drafting; triggers on 'write a brief/deck/speech/announcement', 'redactar', 'this needs to convince', or any deliverable whose success depends on an audience acting on it."
---

# Writing — the communication craft

Formerly the communications-strategist role; now a horizontal craft any role loads when it writes. The domain truth belongs to the owning role (the technical decision to `system-architect`, viability to `commercial-strategist`, the requirement to `functional-analyst`, the product truth to `product-strategist`); this skill governs how that truth lands.

## Method

1. **Internalize objective and audience.** What should they think, feel, or do afterward — and who exactly are they? A piece without a declared objective and audience is not ready to be written.
2. **Pull the WHAT from its owner.** Read the project docs or consult the owning role; never invent or alter domain facts to make the narrative flow.
3. **Fix the idea-force**: the single thing the audience must remember.
4. **Choose the impact principle that fits** — golden circle (why → how → what), storytelling, framing, proof points, exponential framing — because the objective calls for it, never as decoration. State why.
5. **Design the arc**: hook → development → climax → close, beat by beat; for each beat, the message, the visual support required (specify, don't design), the emotional intent.
6. **Write in the structure proper to the format.** The format follows the objective, not a fixed template.
7. **Close with the call to action** or the idea that stays.
8. **If spoken, add delivery notes**: pacing, pauses, emphasis, where energy rises and falls.
9. **Hand off visual support** as a per-beat specification to `ux-architect` (owner of the visual system); they design the slides or assets.

## Craft rules

- **Segmentation**: the same idea-force adapts to different audiences and formats without losing coherence — one project can yield a team induction and an external webinar the same week; they are different pieces.
- **Register and tone** adapt to channel and audience; jargon the audience cannot decode gets glossed or cut.
- **Message before context**: the why never arrives after the how. Burying the message under background is the most common failure.
- **Length sized to the decision**, not to the template.
- Senior judgment, not transcription: reorganizing the source material without adding communicational judgment is the anti-pattern this craft exists to prevent.

## Voice — writing that does not read generated

Generated text betrays itself by structure more than by vocabulary: word lists age in months (a flagged term drops out of model output within a generation), while the structural scaffolds persist across model families. Attack structure first. These rules apply to every piece this skill governs, in every language.

**Structures (the durable tells — banned):**

- **Negative parallelism**: "it's not X, it's Y", "not just X, but Y" — ES: "no se trata solo de…, sino de…", "no es X, es Y". State the claim directly; the contrast frame is a crutch.
- **"From X to Y" sweeps** ("desde… hasta…") as a coverage gesture. Name what actually matters instead of gesturing at a range.
- **Symmetric hedges**: "while X is true, Y also matters", "whether you're a beginner or an expert" — balanced clauses engineered to avoid committing. A piece with an objective takes a position.
- **Uniform rhythm**: paragraphs of equal length, sentences of one shape, frictionless transitions, metronomic cadence. Human prose accelerates, digresses, stops short. Vary deliberately.
- **Closing and framing formulas**: "in summary…", "it's important to note…" — ES: "en resumen…", "es importante destacar…".

**Format:**

- **No emoji** in authored pieces — the ✅ especially is a statistical signature of generated text.
- **Headings in sentence case.** Title Case is a tell in English and an anglicism in Spanish.
- **Prose where the content argues; bullets only where it enumerates.** A wall of bullets with bolded lead-ins is the most recognizable generated layout.
- The em dash is deliberately **not** banned: it is a weak marker (widely human-used, model-dependent) and this catalog's own house style. Density, not presence, is what reads generated.

**Lexicon (weak signal, decays fast):** trend words — "delve", "robust", "seamless", "pivotal", "leverage", "crucial", "tapestry"; ES: "robusto", "crucial", "clave" as the adjective for everything, "sin fisuras" — get replaced by the plain domain term. Do not maintain a banned-word list as if it were the defense; the structural rules above are the ones that hold.

**Enforcement caveat:** no single marker proves anything — humans use every one of them. When reviewing a piece, flag *density and co-occurrence* of tells, never one isolated marker.

## Refuse to write

- A piece without idea-force, objective, or audience — ask for them first.
- One piece aimed at every audience at once.
- A framework applied as decoration.
- Facts invented or bent for narrative flow.

## Boundaries

This skill owns the HOW of a written piece. It does not own: the domain content (the owning role), the visual system or screen design (`ux-architect`), public marketing-web strategy (`commercial-strategist`), or the structure and lifecycle of repository documentation (`documentation-steward`).
