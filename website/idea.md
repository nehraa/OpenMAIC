# AIDU — Magnificent Product, Brand, Website, and Full-Stack Specification

> **Product:** AI-powered interactive learning platform with a live multi-agent classroom  
> **Brand Name:** AIDU, all caps, from "AI" + "DU" Sanskrit root association: to shine  
> **Tagline:** Your AI Classroom, Anywhere  
> **Primary Promise:** AIDU turns any topic into a living classroom with an AI professor, agentic classmates, interactive whiteboards, voice, spatial audio, simulations, quizzes, and mastery tracking.  
> **Plans:** Student (₹100/mo), Individual (₹1,000/mo), Teacher (₹5,000/mo)  
> **Tech Stack:** Next.js App Router, React, Tailwind CSS v4, Framer Motion, Three.js/R3F, Web Audio API, WebRTC, Go or Rust realtime backend, Postgres, Redis, object storage, queues, observability  
> **Spec Version:** 3.0 — Magnificent Professional Overdrive  
> **Last Updated:** 2026-05-01

---

## 0. North Star

AIDU should not feel like another SaaS landing page. It should feel like opening the door to a future classroom.

The website must communicate three things immediately:

1. **Wonder:** Learning becomes cinematic, alive, responsive, and beautiful.
2. **Trust:** The product is serious enough for students, teachers, parents, and institutions.
3. **Proof:** The interface shown on the page must feel usable, not decorative.

### Product Thesis

Most learning tools either lecture, quiz, or summarize. AIDU behaves like a classroom:

- A professor explains, challenges, and adapts.
- Classmates ask questions, debate, and reveal alternate reasoning.
- A whiteboard draws concepts as they are discussed.
- Simulations appear when words are not enough.
- Voice, audio positioning, haptics, and visual feedback make the session feel present.
- Teachers get analytics, interventions, and exportable learning plans.

### Creative Standard

Every screen should pass this test:

- If the copy was removed, the product category should still be obvious.
- If the animations were disabled, the layout should still look premium.
- If the screenshots were static, they should still explain the product.
- If the user is on a low-end phone, it should still feel deliberate and fast.

---

## 1. Brand Identity

### 1.1 Brand Positioning

| Dimension | Direction |
|----------|-----------|
| Personality | Brilliant, calm, precise, warm, ambitious |
| Category | AI classroom, interactive learning, teacher intelligence |
| Audience | Students, individual learners, teachers, schools, coaching centers |
| Differentiator | Multi-agent classroom plus realtime interaction, not passive tutoring |
| Emotional Tone | "I am being taught by a living system that understands me" |
| Design Tone | Premium education technology with cinematic spatial depth |

### 1.2 Messaging System

| Layer | Copy |
|------|------|
| One-liner | AIDU creates a live AI classroom for any topic, in any language. |
| Hero headline | Learn Beyond Limits |
| Hero support | An AI professor, agentic classmates, live whiteboards, voice Q&A, and adaptive practice in one beautiful classroom. |
| Product proof | Watch a topic become a discussion, diagram, simulation, quiz, and study plan in seconds. |
| Teacher proof | See who understands, who is stuck, and what to teach next. |
| Conversion line | Start with one topic. Leave with a classroom. |

### 1.3 Voice and Copy Rules

- Use concrete classroom language: topic, lesson, whiteboard, classmates, quiz, mastery, teacher, roster, intervention.
- Avoid generic AI claims such as "revolutionary", "next-gen", or "supercharged" unless followed by visible proof.
- Keep headings short and declarative.
- Use verbs that imply live behavior: thinks, draws, debates, listens, adapts, guides, reveals.
- Pricing copy should be calm and transparent.

### 1.4 Logo Direction

| Asset | Direction |
|------|-----------|
| Wordmark | AIDU in a confident geometric/display face, custom A crossbar as a light beam |
| Icon | Spark flare plus abstract graduation cap, drawn as one continuous mark |
| Motion Logo | Mark forms from four particles converging, then a subtle shine passes through the wordmark |
| Favicon | Icon only, high contrast, no tiny text |
| App Icon | Indigo field, coral light edge, teal sparkle core |

### 1.5 Pricing Display

| Plan | Price | Positioning | CTA |
|------|-------|-------------|-----|
| Student | ₹100 / month | Accessible guided learning | Start Student |
| Individual | ₹1,000 / month | Full solo classroom | Start Learning |
| Teacher | ₹5,000 / month | Classroom control, analytics, exports | Start Teaching |

---

## 2. Visual Direction — "Luminous Classroom Cinema"

### 2.1 Core Concept — DECISION: Cinematic Immersion

The page moves through scenes like a polished product film with Three.js aurora field as the hero centerpiece:

1. **Arrival:** A dark cinematic hero with a living aurora shader field and kinetic typography.
2. **Credibility:** Light, crisp proof bar and clear institution-ready details.
3. **Mechanism:** A luminous timeline that shows how a topic becomes a classroom.
4. **Power:** Dark feature world with glowing cards, agent nodes, and shader accents.
5. **Product Reality:** Full mock classroom interface with live whiteboard, avatars, audio, and chat.
6. **Decision:** Pricing with elegant comparison, annual savings, and FAQs.
7. **Teacher Control:** Analytics dashboard with intervention insights.
8. **Final Conversion:** Short, confident footer CTA that returns to the core promise.

### 2.1.1 Hero Visual System — DECISION: Aurora Field

- **Background:** Three.js fragment shader aurora field with slow noise displacement
- **Colors:** Teal, coral, and violet bands over deep indigo
- **Effects:**
  - Value noise for base movement
  - Domain warping for organic flow
  - Fresnel-like edge glow near pointer
  - Vignette for text readability
- **Typography:** Source Serif 4 for headlines (cinematic serif), Inter for body
- **Performance:**
  - Render at 0.75 device pixel ratio on mobile
  - Pause when tab hidden
  - Reduce frame rate to 30fps under low-power mode
  - Static gradient fallback for reduced motion
- **Why Aurora Field:**
  - Creates "entering a future classroom" feeling
  - Organic movement pairs with serif typography
  - Differentiates from typical AI startup aesthetics
  - Signals academic credibility + technical innovation

### 2.1.2 Color Treatment — DECISION: Atmospheric Glow + Cursor-Following Glow

Colors used as ambient light sources (aurora bands, depth fog, subtle glow halos). Text and UI elements stay white/light against the dark canvas for maximum readability.

**Glow Behavior:** Cursor-following glow effect — the aurora brightens and shifts toward the cursor position, creating depth and interactivity.

**Why Atmospheric Glow:**
- Maximum text readability over dark backgrounds
- Colors feel like natural light sources, not decoration
- Best pairing with shader-heavy scenes
- Subtle, premium feel appropriate for institutional credibility
- Cursor interaction adds life without distraction

**Glow Signals:**
- Teal glow = AI activity/processing
- Coral glow = user action/CTAs
- Violet glow = mastery/progression

### 2.2 Scene Palette

| Scene | Background | Accent | Texture | Mood |
|------|------------|--------|---------|------|
| Arrival | Deep indigo black, animated aurora field | Coral, teal | Shader noise, faint star particles | Cinematic wonder |
| Credibility | Clean slate white | Indigo | Fine grid, soft shadows | Trust |
| Mechanism | Porcelain gradient | Coral timeline | SVG line drawing, subtle paper grain | Clarity |
| Power | Dark slate | Teal, violet, coral | Depth cards, light rails | Intelligence |
| Product Reality | Deep lab surface | Whiteboard light | Glass, canvas, glow | Demonstration |
| Pricing | Light indigo wash | Coral CTA | Quiet gradients, crisp cards | Decision |
| Teacher Control | Light workspace | Teal analytics | Dashboard density | Authority |
| Footer | Dark indigo | Muted teal | Minimal glow | Closure |

### 2.3 Color Tokens

```css
:root {
  /* Core brand */
  --coral: #ff6b4a;
  --coral-strong: #ff4e2f;
  --coral-soft: #ff9a7f;
  --coral-glow: rgba(255, 107, 74, 0.44);

  --indigo-ink: #1e1b4b;
  --indigo-deep: #111038;
  --indigo-electric: #312e81;

  --teal: #00d4aa;
  --teal-soft: #5eead4;
  --teal-glow: rgba(0, 212, 170, 0.52);

  --violet: #7c3aed;
  --violet-soft: #a78bfa;
  --violet-glow: rgba(124, 58, 237, 0.42);

  /* Neutrals */
  --white: #ffffff;
  --slate-25: #fcfdff;
  --slate-50: #f8fafc;
  --slate-100: #f1f5f9;
  --slate-200: #e2e8f0;
  --slate-300: #cbd5e1;
  --slate-400: #94a3b8;
  --slate-500: #64748b;
  --slate-700: #334155;
  --slate-900: #0f172a;

  /* Dark surfaces */
  --dark-base: #070b18;
  --dark-hero: #090d1f;
  --dark-surface: #111827;
  --dark-card: #171a2b;
  --dark-line: rgba(255, 255, 255, 0.1);

  /* Semantics */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #38bdf8;

  /* Gradients */
  --gradient-hero: radial-gradient(circle at 20% 20%, rgba(0, 212, 170, 0.24), transparent 28%),
    radial-gradient(circle at 80% 22%, rgba(255, 107, 74, 0.2), transparent 30%),
    linear-gradient(135deg, #070b18 0%, #111038 46%, #1e1b4b 100%);
  --gradient-coral: linear-gradient(135deg, #ff6b4a 0%, #ff9a7f 100%);
  --gradient-teal: linear-gradient(135deg, #00d4aa 0%, #5eead4 100%);
  --gradient-violet: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
  --gradient-glass: linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.04));
}
```

### 2.4 Visual Restraint Rules

- Use glow as a signal, not wallpaper. Teal means AI activity. Coral means action. Violet means mastery/progression.
- Keep dark sections spacious and cinematic. Keep light sections crisp and trustworthy.
- Product mockups must show actual educational content, not abstract rectangles.
- Avoid marketing-card clutter. Use full-width bands, product surfaces, grids, and dashboards.
- Cards can have up to 24px radius for expressive landing areas, but tool UI should use 8-12px radius for professional density.

---

## 3. Typography

### 3.1 Font Stack — DECISION: Cinematic Serif

**Chosen approach:** Source Serif 4 (display) + Inter (body)

```css
--font-display: 'Source Serif 4', Georgia, serif;
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

**Why this pairing:**
- Academic credibility for education brand
- Differentiates from typical AI startup sans-serif defaults
- Serif + aurora shader creates cohesive organic aesthetic
- High contrast creates visual hierarchy without decoration
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### 3.2 Type Scale

| Token | Size | Weight | Usage |
|------|------|--------|-------|
| `--text-display` | clamp(3.5rem, 8vw, 7.5rem) | 700 | Hero headline |
| `--text-kicker` | clamp(0.78rem, 1vw, 0.9rem) | 700 | Eyebrows, labels |
| `--text-h1` | clamp(2.25rem, 5vw, 4.5rem) | 650 | Section titles |
| `--text-h2` | clamp(1.5rem, 3vw, 2.5rem) | 620 | Card/module titles |
| `--text-h3` | 1.25rem | 650 | Feature names |
| `--text-body-lg` | clamp(1.1rem, 1.7vw, 1.35rem) | 400 | Hero and section support |
| `--text-body` | 1rem | 400 | Body copy |
| `--text-small` | 0.875rem | 500 | Captions, metadata |
| `--text-xs` | 0.75rem | 650 | Badges |
```

### 3.3 Typography Behavior

- Hero headline uses display serif, tight line height, no negative letter spacing.
- Product UI labels use Inter at 12-14px with 500-650 weight.
- Teacher dashboard numbers use tabular numerals.
- Code, equations, and data chips use JetBrains Mono.
- Long-form explanations max out at 66 characters per line.

### 3.4 Google Fonts Import

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Source+Serif+4:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

---

## 4. Page Architecture

### 4.1 Information Architecture

```text
/
├── Hero: live cinematic classroom promise
├── Social proof: trust markers and outcomes
├── How it works: topic to classroom in 3 acts
├── Feature world: six flagship capabilities
├── Live classroom preview: product mock with interaction states
├── Learning modes: student, individual, teacher pricing
├── Teacher command center: analytics and interventions
├── Outcomes: mastery, retention, engagement, confidence
├── FAQ: trust, privacy, languages, devices, institutions
└── Footer: navigation, legal, contact, final CTA
```

### 4.2 Global Layout Rules

- Max content width: 1280px.
- Hero content width: 1120px.
- Section vertical padding: 96-144px desktop, 72-96px tablet, 56-72px mobile.
- Dark scenes use full-bleed backgrounds.
- Product mockups use real interface density and nested panels only where they represent actual UI.
- Every section gets one primary job; no section should compete with the hero.

---

## 5. Section Specifications

### 5.1 Navigation

**Desktop Layout**

```text
[AIDU mark]    Product  How it Works  Pricing  For Schools      Login   [Start Learning]
```

**Behavior**

- Fixed at top, 72px height.
- Transparent over hero until 50px scroll.
- After scroll: white/rgba glass, 16px backdrop blur, 1px bottom border, compact shadow.
- Logo glint animation plays once after page load.
- Active anchor indicator is a 2px coral line with spring slide.
- "Start Learning" uses coral fill and arrow icon.

**Mobile**

- 64px top bar.
- Hamburger becomes X with transform animation.
- Full-screen overlay, dark indigo background, large tap targets.
- Menu shows a small mini-classroom status strip: "AI Professor online", teal dot, "Ready for your topic".

### 5.2 Hero — "Arrival Into the Classroom"

**Purpose:** Make the product feel category-defining in the first viewport.

**Desktop Composition**

```text
Full-bleed dark shader field
┌──────────────────────────────────────────────────────────────┐
│ Top nav                                                       │
│                                                              │
│             [kinetic line sweep and shatter]                 │
│             LEARN BEYOND LIMITS                              │
│             Your AI classroom, anywhere.                     │
│                                                              │
│             [Start Learning] [Watch Classroom Demo]          │
│                                                              │
│     floating chips              product viewport preview      │
│  AI Professor online         whiteboard + avatars + chat      │
└──────────────────────────────────────────────────────────────┘
```

**Hero Visual System**

- Background: fragment shader aurora field with slow noise displacement.
- Foreground: kinetic headline and a glass product preview, slightly tilted on desktop.
- Three floating badges: AI Professor, Agentic Classmates, Live Whiteboard.
- Bottom edge reveals the next light section by at least 48px on desktop and 28px on mobile.

**Hero Copy**

```text
Eyebrow: LIVE MULTI-AGENT AI CLASSROOM
Headline: Learn Beyond Limits
Support: Turn any topic into a live lesson with an AI professor, debating classmates, whiteboard drawings, voice Q&A, and adaptive practice.
Primary CTA: Start Learning
Secondary CTA: Watch Classroom Demo
Trust note: No setup. Start with one topic.
```

**Hero CTA — DECISION: Magnetic Pull Primary**

| CTA | Style | Hover Effect |
|-----|-------|--------------|
| Primary "Start Learning" | Coral fill with pulsing glow animation | Lift 2px, glow intensifies, arrow moves right 3px |
| Secondary "Watch Demo" | Transparent glass with white text | Glass fill appears, icon rotates 4deg |

**Why Magnetic Pull:**
- Creates that "entering a future classroom" moment
- Primary draws attention without being aggressive
- Secondary stays clean and doesn't compete for focus

### 5.3 Social Proof and Outcome Strip

**Purpose:** Shift from spectacle to credibility.

```text
Trusted by ambitious learners, teachers, and schools building better study systems.
[Institution logo] [School logo] [Coaching logo] [University logo]

94% lesson completion  |  3.2x more questions asked  |  28 languages supported  |  <1s realtime interactions
```

**Design**

- Light slate surface.
- Logos are grayscale until hover.
- Metrics use tabular numerals and thin separators.
- On mobile, metrics become a horizontally scrollable rail with snap points.

### 5.4 How It Works — "Topic to Classroom"

**Purpose:** Explain the mechanism in one glance.

| Step | Title | Description | Motion |
|------|-------|-------------|--------|
| 1 | Enter a topic | Type "photosynthesis", "integrals", or "Mughal history" | Search field expands, cursor blinks |
| 2 | AIDU builds the class | Professor, classmates, lesson plan, whiteboard, quiz, and simulation are created | Nodes assemble into a classroom graph |
| 3 | Learn interactively | Ask, speak, debate, solve, and get mastery feedback | Timeline line snaps into a glowing completion ring |

**Interaction**

- Hovering a step previews the generated artifact: outline, whiteboard, quiz, simulation.
- Connector line uses SVG stroke-dashoffset.
- When the line reaches each node, haptic feedback fires on supported mobile devices.

### 5.5 Feature World — "Everything That Makes It Alive"

**Layout:** Expandable stacks — one feature expanded at a time with detailed micro-scene. Creates focus + depth without overwhelming the user.

- Dark section with 6 feature modules.
- Each card has a real micro-scene, not only an icon.
- Clicking expands card to show full description and animated micro-scene.
- Only one feature expanded at a time (accordion behavior).
- Collapsed cards show minimal info (icon, name, tagline).

| Feature | Visual Micro-Scene | Details |
|---------|--------------------|---------|
| Socratic Engine | Professor avatar asks a follow-up, answer branches appear | Probes assumptions, challenges weak reasoning, adapts difficulty |
| Agentic Classmates | Three agents debate around a concept node | Skeptic, Builder, Creative, Examiner personas |
| Generative Whiteboard | Ink blooms into diagrams and equations | WebGL ink trails, vector replay, exportable notes |
| Spatial Voice Q&A | Audio rings pan between avatars | Web Audio PannerNode, voice activity detection |
| 3D Simulations | Isometric atom/cell/graph transforms | Three.js scenes generated per topic |
| Shine Progression | Mastery aura grows around learner profile | Skill graph, streaks, retention, remediation |

**Card Behavior**

- Enter: fade + translateY + slight rotateX.
- Hover: glow border follows pointer via CSS variable `--mouse-x` and `--mouse-y`.
- Icon/micro-scene animates for 1.2s, then idles.
- Cards include "See example" tertiary link for future product demos.

### 5.6 Live Classroom Preview — DECISION: Video Demo + Annotated Screenshots

**Primary:** Autoplaying video loop showing a live classroom session
- Full browser mockup with real-time classroom activity
- Video shows: whiteboard drawing, agent responses, quiz generation, voice Q&A
- Muted autoplay with prominent play/unmute button
- Demo topic: Photosynthesis lesson with AI professor explaining and classmates debating

**Secondary:** Annotated static screenshots as hotspots throughout the website
- Screenshots appear in feature sections with numbered hotspot markers
- Each hotspot reveals a tooltip with the feature name and brief description
- Creates "guided tour" feeling without requiring full video

**Why this combination:**
- Video sells the live, dynamic nature of the product
- Screenshots provide scannable proof points throughout the page
- Hotspots make static images feel interactive
- Together they provide both emotional appeal and informational clarity

**Purpose:** Show the product, not a symbolic illustration.

```text
Browser shell
├── Top bar: Topic, timer, recording, language selector, share
├── Left rail: Professor, classmates, TA, lesson phases
├── Main canvas: Whiteboard with animated equation/diagram
├── Right rail: Discussion, misconceptions, suggested questions
└── Bottom composer: Text input, mic, send, attach, mode toggle
```

**Default Demo Topic**

Photosynthesis:

- Whiteboard formula: `6CO2 + 6H2O + light -> C6H12O6 + 6O2`
- Diagram: chloroplast, light-dependent reaction, Calvin cycle.
- Professor line: "Before I explain, what do you think the plant is storing?"
- Classmate question: "If oxygen is a waste product, why is it so important to us?"
- Quiz card: "Which reactant provides the carbon in glucose?"

**Interactive States**

- Click an avatar: opens persona card and highlights audio position.
- Click mic: waveform animates, transcript appears, answer streams.
- Click whiteboard: zooms into diagram with mini-map.
- Click "Generate Quiz": opens two-question quiz modal.
- Click "Explain Differently": rewrites the whiteboard in analogy mode.

### 5.7 Pricing

**Purpose:** Make the buying decision clear, premium, and low friction.

| Plan | Price | Best For | Included |
|------|-------|----------|----------|
| Student | ₹100/mo | School and college learners | AI tutor, quizzes, basic progress, topic history |
| Individual | ₹1,000/mo | Serious solo learners | Full classroom, voice Q&A, 3D models, deeper mastery graph |
| Teacher | ₹5,000/mo | Teachers and coaching centers | Rosters, analytics, assignments, exports, intervention plans |

**Pricing Details**

- Annual toggle: Save 20%.
- Teacher card is recommended, but not visually aggressive.
- Each card includes usage limits and data privacy note.
- FAQ below handles cancellation, languages, school pilots, and device support.

### 5.8 Teacher Command Center

**Purpose:** Show that AIDU is institution-ready.

```text
Dashboard shell
├── Left: classroom roster with risk signals
├── Center: mastery graph and lesson engagement timeline
├── Right: AI-generated interventions
└── Bottom: export, assign, message, generate plan
```

**Teacher Data Widgets**

- Class performance: 78%, up 12%.
- Misconception cluster: "Mitosis vs meiosis", 8 students affected.
- Engagement: questions asked, speaking time, quiz confidence.
- Suggested next lesson: "Cell division visual lab".
- Export: PDF report, CSV, ZIP knowledge graph, LMS package.

### 5.9 Outcomes Section

Add a new light section before FAQ:

```text
Learning that becomes measurable.

[Understand faster]
Adaptive explanations, Socratic checks, and diagrams reduce passive reading.

[Ask more]
Agentic classmates make questions feel natural, not embarrassing.

[Remember longer]
Mastery graph schedules spaced review and targeted practice.

[Teach smarter]
Teachers see misconceptions before exam week.
```

### 5.10 Final CTA

Dark cinematic closing band.

```text
Headline: Start with one topic.
Support: AIDU will build the classroom around it.
CTA: Create My Classroom
Secondary: View Teacher Plan
```

---

## 6. Motion and Animation System

### 6.1 Motion Principles — DECISION: View Transitions

**Chosen approach:** View Transitions API for cinematic page navigation.

- Morphing transitions between states — a button expands into a modal, a card transforms into a detail view
- Shared element transitions for hero sections, CTAs, and product previews
- Smooth scroll with section fade-ins as baseline
- Background aurora shader continues seamlessly across transitions

**Why View Transitions:**
- Creates that "cinematic classroom" feeling
- Products feels native and polished
- Morphing CTAs → modals eliminates jarring jumps
- Shared element morphing makes navigation feel continuous

**Fallback:** Smooth scroll with CSS fade-ins for Firefox (View Transitions not yet supported)

- Motion must communicate state, hierarchy, or learning activity.
- Background motion stays below 20% visual dominance.
- Product UI animations should feel fast and useful.
- Big cinematic animation plays once; ambient loops remain subtle.
- All animation respects `prefers-reduced-motion`.

### 6.2 Hero Timeline

| Time | Element | Animation |
|------|---------|-----------|
| 0ms | Shader field | Fade in from black, noise amplitude ramps from 0 to 1 |
| 120ms | Horizontal line | Sweeps left to right across headline baseline |
| 420ms | Line fragments | Shatter into 28 fragments with random velocity and gravity |
| 520ms | Headline letters | Fall from above with spring bounce and slight blur removal |
| 980ms | Product preview | Rises from 28px, glass reflection slides once |
| 1120ms | Support copy | Fade and slide up |
| 1280ms | CTAs | Slide up, primary glow blooms |
| 1450ms | Floating chips | Appear in staggered orbit positions |
| 1800ms | Avatar pulse | Professor speaking ring begins |

### 6.3 Scroll-Triggered Animations

| Trigger | Element | Animation | Duration | Easing |
|---------|---------|-----------|----------|--------|
| 15% viewport | Section eyebrow | opacity 0 -> 1, y 12 -> 0 | 300ms | ease-out |
| 20% viewport | Section title | clip-path reveal bottom -> top | 520ms | ease-out-expo |
| 30% viewport | Step timeline | SVG path draw | 900ms | ease-in-out |
| 35% viewport | Feature cards | y 44 -> 0, opacity 0 -> 1 | 540ms | ease-out-quart |
| 40% viewport | Product browser | scale .96 -> 1, shadow grows | 700ms | ease-out |
| Sticky progress | Classroom demo | Whiteboard strokes replay as user scrolls | scroll-linked | linear |
| Pricing enters | Recommended badge | small shine sweep | 700ms | ease-out |
| Teacher enters | Chart lines | draw path, count numbers up | 900ms | ease-out |

### 6.4 Micro-Interactions

| Element | Interaction |
|---------|-------------|
| Primary button | Lift 2px, coral shadow, arrow moves 3px right |
| Secondary button | Glass background appears, icon rotates 4deg |
| Feature card | Pointer-follow glow, micro-scene wakes |
| Avatar | Tooltip, ring expands, audio pan marker highlights |
| Whiteboard stroke | Ink thickens on hover, cursor becomes pen dot |
| Pricing toggle | Thumb slides with spring, price counts to new amount |
| FAQ item | Chevron rotates, content expands with measured height |
| Mobile nav | Links stagger from left, background shader freezes behind menu |

### 6.5 Shader and WebGL Direction

Use shader effects only where they improve the premium feel and do not hide content.

#### Hero Aurora Shader

- Implementation: Three.js full-screen plane or CSS Paint fallback.
- Inputs: time, pointer, scroll progress, theme intensity.
- Visual: slow fluid bands of teal, coral, and violet over deep indigo.
- Shader passes:
  - Value noise for base movement.
  - Domain warping for organic flow.
  - Fresnel-like edge glow near pointer.
  - Vignette to keep text readable.
- Performance:
  - Render at 0.75 device pixel ratio on mobile.
  - Pause when tab hidden.
  - Reduce frame rate to 30fps under low-power mode.
  - Static gradient fallback for reduced motion.

#### Whiteboard Ink Shader

- Stroke particles follow generated SVG paths.
- Each stroke has a glowing head and fading tail.
- When an equation completes, a teal comprehension pulse runs through related nodes.
- Exportable notes should use clean SVG, not shader raster output.

#### Feature Card Glow Shader

- Can be CSS-only using radial gradients tied to pointer variables.
- No per-card WebGL unless the card contains a real 3D mini-scene.
- Hover glow should fade within 300ms after pointer leave.

#### 3D Simulation Scene

- Use `@react-three/fiber` if project accepts it, otherwise Three.js directly.
- Scenes:
  - Biology: chloroplast with layered membranes and floating molecules.
  - Math: graph surface morphing from equation parameters.
  - Physics: field lines around charges.
  - Chemistry: molecule bonds with labels.
- Each simulation has static thumbnail fallback.

### 6.6 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }

  .shader-canvas,
  .particle-field,
  .scroll-replay {
    display: none !important;
  }

  .static-visual-fallback {
    display: block !important;
  }
}
```

---

## 7. Component System

### 7.1 Buttons

| Variant | Use | Style |
|---------|-----|-------|
| Primary | Main conversion | Coral fill, white text, arrow icon |
| Secondary Dark | Demo actions on dark scenes | Transparent glass, white text |
| Secondary Light | Low emphasis on light scenes | Slate text, subtle hover fill |
| Icon | Product controls | 40px square, tooltip required |
| Destructive | Stop recording, remove student | Error token, restrained |

**Button Requirements**

- Height: 48px large, 40px medium, 32px small.
- Radius: 10px.
- Labels use sentence case or direct verbs, not all caps except tiny badges.
- Loading state replaces icon with spinner and preserves width.
- Focus ring: 2px coral outline with 2px offset.

### 7.2 Cards

| Card Type | Radius | Use |
|----------|--------|-----|
| Marketing feature card | 20-24px | Landing page modules |
| Product panel | 10-12px | Classroom/dashboard UI |
| Pricing card | 20px | Plan comparison |
| Modal | 16px | Product preview interactions |

**Rules**

- Do not place decorative cards inside decorative cards.
- Product mockups can contain panels because they represent actual UI.
- Card shadows should be softer on light scenes and glow-based on dark scenes.

### 7.3 Avatar System

| Role | Color | Motion |
|------|-------|--------|
| Professor AI | Teal | Speaking ring, waveform |
| Skeptic Classmate | Violet | Question pulse |
| Creative Classmate | Coral | Idea sparkle |
| Examiner TA | Blue/info | Quiz pulse |
| Human Learner | Slate/indigo | Mastery ring |

**Avatar Details**

- Use initials or generated abstract face style, not stock photos.
- AI avatars get small sparkle marker.
- Speaking state includes ring, transcript glow, and audio pan indicator.
- Tooltip includes name, role, and current action.

### 7.4 Whiteboard Component

Features:

- Vector stroke replay.
- Equation blocks using KaTeX or MathJax.
- Diagram layer using SVG primitives.
- Zoom/pan.
- Export PNG/SVG/PDF.
- "Explain this" hotspot annotations.
- Laser pointer mode for teacher sessions.

### 7.5 Classroom Composer

Input modes:

- Text.
- Voice.
- Attach image/PDF.
- Choose explanation mode: Simple, Socratic, Visual, Exam Prep.
- Language selector.

States:

- Idle placeholder: "Ask the class anything..."
- Listening: waveform and transcript.
- Thinking: agent nodes light in sequence.
- Streaming: answer appears with source step markers.
- Error: calm retry affordance.

### 7.6 Pricing Card

Required details:

- Plan name.
- Price.
- Best-for sentence.
- Usage limits.
- Feature list.
- CTA.
- Small legal/data note.

Teacher card:

- Recommended badge.
- Coral border glow.
- "For classrooms, cohorts, and coaching centers."
- Secondary link: "Request school pilot".

---

## 8. Full-Stack Product Architecture

### 8.1 System Overview

```text
Client
├── Next.js app
├── Realtime classroom UI
├── WebRTC voice/video optional layer
├── WebSocket state sync
├── Local cache and optimistic updates
└── WebGL/whiteboard rendering

Edge/API
├── Auth and session routing
├── Rate limits
├── Plan enforcement
├── Request shaping
└── Static asset optimization

Realtime Core
├── Classroom session orchestrator
├── Agent event bus
├── Whiteboard operation sync
├── Voice activity and transcript stream
└── Presence and cursor state

AI Services
├── Professor agent
├── Classmate agents
├── Quiz generator
├── Simulation planner
├── Misconception detector
└── Teacher intervention generator

Data Layer
├── Postgres for durable app data
├── Redis for presence, queues, rate windows
├── Vector store for lesson memory/retrieval
├── Object storage for exports and recordings
└── Analytics warehouse for learning events
```

### 8.2 Recommended Stack

| Layer | Recommendation |
|------|----------------|
| Web | Next.js App Router, React, Tailwind CSS v4 |
| Motion | Framer Motion for UI, CSS for simple transitions |
| 3D | Three.js or React Three Fiber |
| Realtime | WebSocket for state, WebRTC for live audio/video when needed |
| Backend | Go for realtime gateway; Rust acceptable for whiteboard sync engine |
| Database | Postgres with row-level tenancy |
| Cache | Redis |
| Queue | BullMQ, Temporal, or cloud-native queue |
| Storage | S3-compatible object storage |
| Search/Memory | pgvector or dedicated vector DB |
| Auth | OAuth plus email OTP, role-aware sessions |
| Payments | Stripe or Razorpay for Indian pricing |
| Observability | OpenTelemetry, structured logs, metrics, replay-safe traces |

### 8.3 Core Domain Model

```text
User
├── id
├── name
├── email
├── role: student | individual | teacher | admin
├── locale
└── plan_id

Classroom
├── id
├── owner_id
├── topic
├── language
├── mode: simple | socratic | visual | exam_prep
├── created_at
└── current_session_id

ClassroomSession
├── id
├── classroom_id
├── status: active | paused | ended
├── started_at
├── ended_at
└── summary

Agent
├── id
├── session_id
├── role: professor | skeptic | creative | examiner | ta
├── persona_prompt
├── voice_id
└── state

WhiteboardOperation
├── id
├── session_id
├── op_type: stroke | equation | diagram | erase | transform
├── payload
├── sequence
└── created_at

LearningEvent
├── id
├── user_id
├── session_id
├── event_type
├── payload
├── confidence
└── created_at

MasteryNode
├── id
├── user_id
├── concept
├── score
├── evidence_count
├── next_review_at
└── prerequisites
```

### 8.4 Realtime Event Protocol

```ts
type ClassroomEvent =
  | { type: 'presence.joined'; userId: string; role: string }
  | { type: 'agent.started'; agentId: string; action: string }
  | { type: 'agent.token'; agentId: string; messageId: string; delta: string }
  | { type: 'agent.completed'; agentId: string; messageId: string }
  | { type: 'whiteboard.op'; sequence: number; op: WhiteboardOperation }
  | { type: 'voice.started'; speakerId: string; pan: number }
  | { type: 'voice.transcript'; speakerId: string; delta: string }
  | { type: 'quiz.generated'; quizId: string; questionCount: number }
  | { type: 'mastery.updated'; concept: string; score: number }
  | { type: 'error.recoverable'; code: string; message: string };
```

### 8.5 Agent Orchestration

Agent roles:

- **Professor:** Builds lesson arc, explains, asks Socratic checks.
- **Skeptic:** Challenges unclear claims and asks "why".
- **Creative:** Offers analogies, visual metaphors, unusual examples.
- **Examiner:** Generates practice questions and detects weak concepts.
- **TA:** Summarizes, tracks confusion, proposes next actions.

Rules:

- Only one agent should speak as primary at a time.
- Classmates can interject briefly when they add pedagogical value.
- Professor must ground explanations in the whiteboard and quiz state.
- Teacher sessions expose controls to pause, redirect, or mute agents.

### 8.6 Local-First and Offline Resilience

- Whiteboard strokes render locally immediately.
- Text input and composer state survive refresh.
- Session events are queued locally and replayed when connection returns.
- Teacher dashboard caches last successful analytics snapshot.
- Offline mode supports saved lessons, notes, and quiz review.

### 8.7 Security and Privacy

- Role-based access control for students, teachers, institutions, admins.
- Tenant isolation for schools.
- Signed URLs for recordings and exports.
- PII redaction in logs.
- Explicit controls for recording.
- Data retention settings for schools.
- Audit trail for teacher/admin actions.
- Abuse/rate-limit protections for generated content.

---

## 9. Asset and Media Specifications

### 9.1 Required Visual Assets

| Asset | Size | Format | Notes |
|------|------|--------|-------|
| Logo wordmark | 200x48 min | SVG + PNG | Vector first |
| Logo icon | 32x32 min | SVG + PNG | Favicon-ready |
| Hero product mock | 1600x1000 | PNG/WebP | Transparent or dark shell |
| Classroom screenshot | 1400x900 | PNG/WebP | Real UI density |
| Teacher dashboard | 1400x900 | PNG/WebP | Analytics and roster visible |
| Feature micro-scenes | 600x400 each | SVG/Canvas/WebGL | Can be rendered in-app |
| Open Graph image | 1200x630 | PNG | Hero title plus product preview |
| App screenshots | 390x844, 1440x1024 | PNG | Mobile and desktop |

### 9.2 Image Direction

- Avoid generic stock classrooms.
- Product visuals should be interface-first.
- Use real subject examples: photosynthesis, calculus, economics, history.
- Every screenshot should include at least one visible student/teacher workflow.
- Use WebP/AVIF for production, PNG for source exports.

### 9.3 Icon System

Use Lucide icons for common UI controls:

- Play, Pause, Mic, Send, Upload, Download, Search, Settings, Users, BookOpen, GraduationCap, Sparkles, Volume2, BarChart3, Brain, Network.

Custom SVG icons only for:

- AIDU logo.
- Feature hero marks.
- Mastery graph glyph.
- Agent persona markers.

---

## 10. Responsive and Device Behavior

### 10.1 Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| Mobile | < 640px | Single column, simplified shader, compact product mock |
| Tablet | 640-1023px | Two-column grids, horizontal product scroll where needed |
| Desktop | 1024-1279px | Full nav, large mockups, 3-column pricing |
| Large | >= 1280px | 1280px max content, cinematic negative space |

### 10.2 Mobile Rules

- Hero headline must fit without clipping.
- Product mock switches to vertical phone classroom preview.
- Feature cards are one column with micro-scenes above text.
- Classroom preview can use a segmented control: Whiteboard, Agents, Chat.
- Pricing cards stack; recommended plan remains second or visually highlighted.
- Footer columns collapse into accordions.
- Haptics only on meaningful snaps/toggles; never on scroll.

### 10.3 Low-End Device Strategy

- Disable hero shader and use static gradient under low memory or reduced motion.
- Limit particle count to 40 mobile, 120 desktop.
- Use CSS transforms only for layout motion.
- Lazy-load 3D simulations below the fold.
- Defer non-critical animation libraries until after first interaction where possible.

---

## 11. Accessibility Requirements

### 11.1 WCAG Targets

- WCAG AA minimum; AAA for primary text where feasible.
- Normal text contrast: 4.5:1.
- Large text contrast: 3:1.
- Interactive boundaries: 3:1.
- Focus visible on all interactive elements.

### 11.2 Interaction Accessibility

- Skip link to main content.
- Semantic landmarks: `header`, `nav`, `main`, `section`, `article`, `footer`.
- Keyboard-operable menus, FAQ, pricing toggle, demo controls.
- Escape closes overlays and modals.
- Icon-only buttons require `aria-label`.
- Animated demos need pause control if they continue beyond five seconds.
- Motion has reduced fallback.
- Voice demo includes transcript.
- Color is never the only state indicator.

### 11.3 Screen Reader Copy

- Shader canvas: `aria-hidden="true"`.
- Product mockup: describe high-level function, not every visual detail.
- Pricing cards: expose plan, price, billing period, and CTA.
- FAQ buttons: use `aria-expanded`.
- Charts: include table/text summary.

---

## 12. Performance Targets

| Metric | Target |
|--------|--------|
| FCP | < 1.5s |
| LCP | < 2.5s |
| CLS | < 0.1 |
| INP | < 200ms |
| JS initial route | < 220KB gzipped where possible |
| Shader FPS desktop | 60fps |
| Shader FPS mobile | 30-60fps adaptive |
| Image format | AVIF/WebP with responsive sizes |

### 12.1 Performance Rules

- Hero text must render before shader initialization completes.
- Product mock images must reserve aspect ratio.
- Below-fold 3D and heavy demos are lazy-loaded.
- Use `next/image` for raster assets.
- Use dynamic import for Three.js scenes.
- Avoid layout thrash in scroll animations.
- Use IntersectionObserver instead of scroll event loops.

---

## 13. Analytics and Conversion Tracking

### 13.1 Marketing Events

```text
landing_viewed
hero_cta_clicked
demo_play_clicked
topic_example_clicked
feature_card_expanded
pricing_toggle_changed
pricing_cta_clicked
teacher_demo_clicked
faq_opened
lead_form_submitted
```

### 13.2 Product Demo Events

```text
demo_avatar_clicked
demo_mic_clicked
demo_whiteboard_zoomed
demo_quiz_generated
demo_explain_differently_clicked
```

### 13.3 Measurement Principles

- Track intent, not every hover.
- Do not log raw student questions without consent.
- Redact PII in analytics payloads.
- Use event names that match product language.

---

## 14. Implementation File Structure

```text
app/
├── layout.tsx
├── page.tsx
├── globals.css
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── tooltip.tsx
│   │   ├── accordion.tsx
│   │   └── pricing-toggle.tsx
│   ├── sections/
│   │   ├── navbar.tsx
│   │   ├── hero.tsx
│   │   ├── social-proof.tsx
│   │   ├── how-it-works.tsx
│   │   ├── feature-world.tsx
│   │   ├── classroom-preview.tsx
│   │   ├── pricing.tsx
│   │   ├── teacher-command-center.tsx
│   │   ├── outcomes.tsx
│   │   ├── faq.tsx
│   │   ├── final-cta.tsx
│   │   └── footer.tsx
│   ├── classroom/
│   │   ├── classroom-shell.tsx
│   │   ├── whiteboard.tsx
│   │   ├── agent-rail.tsx
│   │   ├── transcript-panel.tsx
│   │   ├── composer.tsx
│   │   └── quiz-modal.tsx
│   ├── motion/
│   │   ├── kinetic-text.tsx
│   │   ├── scroll-reveal.tsx
│   │   ├── pointer-glow.tsx
│   │   └── count-up.tsx
│   └── webgl/
│       ├── hero-shader.tsx
│       ├── particle-field.tsx
│       ├── whiteboard-ink.tsx
│       └── simulation-preview.tsx
├── lib/
│   ├── cn.ts
│   ├── analytics.ts
│   ├── motion.ts
│   ├── pricing.ts
│   └── demo-data.ts
├── server/
│   ├── actions/
│   ├── auth/
│   ├── billing/
│   └── analytics/
website/
├── idea.md
└── assets/
```

---

## 15. Implementation Phases

### Phase 1 — Foundation

1. Set up Tailwind v4 tokens and global CSS variables.
2. Create typography, spacing, radius, shadow, and focus systems.
3. Build button, card, badge, avatar, tooltip, accordion primitives.
4. Add responsive section shell component.

### Phase 2 — Cinematic Landing Core

1. Build navigation with scroll state and mobile overlay.
2. Build hero with kinetic text and static shader fallback.
3. Add hero product mock and floating chips.
4. Add social proof and metric strip.

### Phase 3 — Product Explanation

1. Build How It Works timeline with SVG path drawing.
2. Build Feature World cards and micro-scenes.
3. Add pointer-follow glow and scroll reveal.
4. Add outcomes section.

### Phase 4 — Product Reality

1. Build classroom preview shell.
2. Add whiteboard replay, avatars, transcript, composer.
3. Add demo interactions: avatar click, mic, quiz, explain differently.
4. Build teacher command center dashboard.

### Phase 5 — Pricing and Trust

1. Build pricing toggle and plan cards.
2. Add FAQ accordion.
3. Add final CTA and footer.
4. Add analytics events.

### Phase 6 — Full-Stack Readiness

1. Define domain schema and migrations.
2. Implement auth, plans, and billing hooks.
3. Build realtime event protocol.
4. Add session orchestration API stubs.
5. Add observability and error boundaries.

### Phase 7 — Polish and QA

1. Playwright screenshot pass: mobile, tablet, desktop.
2. Check all text for overlap and clipping.
3. Run Lighthouse and fix major issues.
4. Test reduced motion.
5. Test keyboard navigation.
6. Verify shader fallback and lazy loading.

---

## 16. QA Acceptance Checklist

### Visual

- Hero feels cinematic without making text hard to read.
- First viewport shows AIDU as the brand, not only a nav label.
- Product preview looks usable and specific.
- Dark and light sections alternate with deliberate rhythm.
- Pricing is readable and does not feel gimmicky.
- Teacher dashboard is dense but not crowded.

### Interaction

- Navigation works with mouse, touch, and keyboard.
- Hero CTA is visible above the fold on mobile.
- Classroom demo controls have clear hover/focus/active states.
- FAQ opens smoothly and remains accessible.
- Pricing toggle updates prices without layout shift.

### Technical

- No hydration errors.
- No console errors.
- Images reserve dimensions.
- WebGL pauses when offscreen or hidden.
- Reduced motion disables shader/particle animation.
- Lighthouse performance remains acceptable.

### Content

- No generic placeholder claims.
- Every feature has product proof.
- Indian pricing is formatted consistently.
- Teacher/institution value is clear.
- Privacy and recording controls are acknowledged.

---

## 17. Build Notes and Guardrails

- Build the real experience first, not a marketing-only shell.
- Keep product screenshots and demos central.
- Use shader effects as atmosphere and product-specific motion, never as a substitute for layout.
- Do not let animation delay core content.
- Do not overuse glowing purple-blue gradients. Coral, teal, indigo, and white must all have distinct jobs.
- Keep UI controls familiar: icons for tools, segmented controls for modes, toggles for billing, accordions for FAQ.
- Use actual educational examples in every mockup.
- Make the site feel magnificent, but still credible enough for a school administrator to approve.

---

## 18. Immediate Next Build Tasks

1. Create the Next.js landing page skeleton and design token system.
2. Implement the navbar, hero, and static product mock first.
3. Add kinetic text and shader as progressive enhancement.
4. Build classroom preview with mock data.
5. Add pricing, teacher dashboard, FAQ, and final CTA.
6. Run responsive and accessibility checks before adding extra visual effects.

---

*Spec complete — ready for high-end implementation.*
