# OpenMAIC Website Redesign — Scroll-Scrubbed Video + Feature Explainer

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the OpenMAIC website into a premium, release-ready experience with scroll-scrubbed video playback and Apple-style scroll animations. The site should clearly communicate what OpenMAIC is and its capabilities through editorial video storytelling.

**Architecture:**
- Scroll-driven video scrubber: as user scrolls through hero, video plays/pauses/seeks based on scroll position
- 8 feature-explainer clips extracted from the source video, each 5-15 seconds
- Each scroll section triggers the next clip with smooth crossfades
- Floating text/UI overlays that animate in sync with video content
- Parallax depth layers creating Apple-style spatial movement

**Tech Stack:** Next.js App Router, Framer Motion, FFmpeg (video processing), Intersection Observer API, CSS scroll-driven animations

---

## Video Processing Plan

### Source Video
- **File**: `/Users/abhinavnehra/Downloads/Video Project 1.mp4`
- **Duration**: ~2 minutes
- **Resolution**: To be verified

### 8 Feature Explainer Clips

| # | Clip Name | Start | End | Duration | Shows |
|---|-----------|-------|-----|----------|-------|
| 1 | **AI Professor** | 0:00 | 0:15 | ~15s | AI professor explaining concepts with chalkboard |
| 2 | **Multi-Agent Debate** | 0:15 | 0:30 | ~15s | Multiple AI agents debating contrasting viewpoints |
| 3 | **Student Interaction** | 0:30 | 0:45 | ~15s | Student asking questions, getting personalized responses |
| 4 | **Whiteboard Drawing** | 0:45 | 1:00 | ~15s | Hand-drawn diagrams, mathematical formulas being created |
| 5 | **Voice Q&A** | 1:00 | 1:15 | ~15s | Voice interaction, real-time speech recognition |
| 6 | **Adaptive Quiz** | 1:15 | 1:30 | ~15s | Quiz interface with immediate feedback |
| 7 | **Progress Dashboard** | 1:30 | 1:45 | ~15s | Analytics, learning progress, achievement tracking |
| 8 | **Classroom Complete** | 1:45 | 2:00 | ~15s | Session summary, key takeaways generated |

*Times are estimates — actual extraction will be done after frame-by-frame analysis*

### Video Processing Steps
1. Extract frame at 1fps for analysis to identify exact timestamps
2. Create 8 clips using FFmpeg with crossfade transitions
3. Generate thumbnail sprites for loading states
4. Create WebM versions for progressive enhancement

---

## Section Architecture

### Hero Section (100vh scroll distance)
**Scroll Behavior**: Video scrubs from 0-100% based on scroll position

**Layout**:
- Full-bleed video container behind
- Floating glass card in center with headline + CTA
- Video plays forward as user scrolls down
- Parallax depth: background video at 0.5x, content at 1x

**States**:
- 0% scroll: Video paused, first frame, headline visible
- 50% scroll: Video playing, mid-explanation
- 100% scroll: Video at key moment, CTA prominent

### Feature Sections (8 sections, each 80vh)
**Scroll Behavior**: Each section triggers its corresponding video clip

**Layout**:
- Video floats left (40% width) with depth shadow
- Text content right (55% width) with staggered entrance
- Scroll-linked opacity: content fades in as section enters viewport

**Animation Pattern**:
- Section enters viewport → clip starts playing
- Text reveals with 100ms stagger per line
- Clip fades to next as user scrolls past

### Navigation
- Fixed top nav with blur backdrop
- Progress indicator showing current section
- Smooth scroll snapping between major sections

---

## Content Strategy (Addressing "Information Not There")

### Hero Headline Changes
**Old**: "Learn Beyond Limits"
**New**: "AI-Powered Live Classroom — Your Professor, Debate Partners, and Tutor in One Session"

### Section Headlines (8 Features)

1. **AI Professor**
   - Headline: "A Professor Who Never Gets Tired of Repeating"
   - Body: "Our AI professor adapts to your learning pace, explains concepts three different ways until you get it, and remembers exactly where you left off."

2. **Multi-Agent Debate**
   - Headline: "Learn by Argues — With AI Classmates Who Challenge You"
   - Body: "Multiple AI agents present different perspectives, debate opposing viewpoints, and teach you to think critically by example."

3. **Personalized Q&A**
   - Headline: "Your Questions, Answered in Real-Time"
   - Body: "Ask anything out loud. The AI understands context, follows up with clarifying questions, and won't stop until you truly understand."

4. **Live Whiteboard**
   - Headline: "Watch Concepts Come Alive on the Canvas"
   - Body: "Math, science, history — complex ideas visualized in real-time with drawings, diagrams, and dynamic charts that build as you learn."

5. **Voice Intelligence**
   - Headline: "Speak Your Questions Naturally"
   - Body: "No typing. No menus. Just talk. Our voice AI understands accents, handles interruptions, and adapts to how you think."

6. **Adaptive Quizzes**
   - Headline: "Tests That Teach Instead of Just Grade"
   - Body: "Each quiz adapts to your level. Get harder questions when you're coasting, easier ones when you're struggling. Every wrong answer is a learning moment."

7. **Progress Insights**
   - Headline: "See Exactly Where Your Learning Stands"
   - Body: "Track comprehension across topics, identify weak spots before exams, and watch your mastery grow day by day."

8. **Session Summaries**
   - Headline: "Takeaway Notes Generated Automatically"
   - Body: "End of every session, get a beautiful summary with key concepts, difficult parts annotated, and next steps recommended."

---

## Visual Design

### Color Palette (Warm, Premium)
- **Background**: Deep indigo (#070b18) to warm charcoal (#1a1a2e)
- **Primary**: Coral (#ff6b4a)
- **Secondary**: Teal (#00d4aa)
- **Accent**: Soft amber (#ffd93d)
- **Glass**: Warm white with blur (rgba(255,249,245,0.08))
- **Text**: Pure white with warm undertone

### Typography
- **Display**: Source Serif 4 — elegant, editorial headlines
- **Body**: Inter — clean, readable body text
- **Mono**: JetBrains Mono — technical elements

### Motion Specs
- **Scroll scrub**: video.currentTime = scrollProgress * video.duration
- **Entrance**: opacity 0→1, translateY 30px→0, 600ms ease-out-quint
- **Stagger**: 80ms between elements
- **Crossfade**: 400ms ease-in-out between video clips
- **Parallax**: background 0.3x, midground 0.6x, foreground 1x

---

## Component Inventory

### VideoScrubber
- Full-bleed video element with scroll-linked currentTime
- Preloads next clip while current plays
- Fallback to poster image if scroll is fast

### FeatureSection
- Props: clipIndex, headline, body, alignment (left/right)
- Handles intersection observer for clip triggering
- Manages staggered text animations

### GlassCard
- Warm-tinted glass with backdrop-blur
- Subtle shadow for floating depth
- Hover lift effect

### ScrollProgress
- Fixed indicator showing scroll position
- Section markers that highlight as you pass
- Subtle animation on section change

### NavBar
- Fixed, glass background
- Logo + section links
- CTA button

---

## Accessibility

- `prefers-reduced-motion`: All scroll animations become instant transitions
- Video has captions track (extracted from audio)
- Focus states on all interactive elements
- Keyboard navigation for section jumping

---

## Performance

- Video clips lazy-loaded as sections approach viewport
- Intersection Observer with 50% threshold for preloading
- will-change on animated elements
- GPU-accelerated transforms only

---

## Implementation Order

### Phase 1: Video Processing
1. Extract frames for timestamp analysis
2. Identify exact clip boundaries
3. Generate 8 video clips with FFmpeg
4. Create thumbnail sprites

### Phase 2: Core Structure
5. Build VideoScrubber component
6. Create FeatureSection component
7. Wire up scroll-linked playback

### Phase 3: Content
8. Update headlines and body text
9. Ensure OpenMAIC capabilities are clear
10. Add section transitions

### Phase 4: Polish
11. Parallax depth layers
12. Navigation and progress indicator
13. Final animations and transitions
14. Accessibility audit