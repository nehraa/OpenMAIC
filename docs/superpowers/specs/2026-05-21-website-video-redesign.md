# OpenMAIC Website Redesign - Premium Video-Centric Experience

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan.

**Goal:** Transform the OpenMAIC website into a premium, Apple-style experience with scroll-linked video playback, cinematic transitions, and modern visual design. The video `Video Project 1.mp4` will be processed into feature clips integrated throughout the site.

**Architecture:**
1. **Video Processing Pipeline**: Extract 5 feature highlight clips from the 110-second source video using FFmpeg
2. **Scroll-Driven Video Engine**: Intersection Observer + requestAnimationFrame to sync video playback with scroll position
3. **Apple-Style Parallax**: Multi-layer depth with CSS transforms, scroll-linked translations at varying speeds
4. **Premium Typography & Spacing**: Clean editorial aesthetic with Source Serif + Inter pairing

---

## Part 1: Video Processing

### Source Video Analysis
- **File**: `/Users/abhinavnehra/Downloads/Video Project 1.mp4`
- **Duration**: 110.67 seconds (1:50)
- **Resolution**: 1920x1080 @ 30fps
- **Encoding**: H.264 AAC

### Clip Extraction Plan
Extract these clips for feature sections:

| Clip | Timestamp | Duration | Content Focus |
|------|-----------|----------|---------------|
| `hero-demo.mp4` | 0:00-0:08 | 8s | Opening - AI professor introduction |
| `whiteboard-demo.mp4` | 0:15-0:25 | 10s | Whiteboard drawing demonstration |
| `agent-demo.mp4` | 0:35-0:48 | 13s | Agent debating classmates |
| `quiz-demo.mp4` | 0:55-1:05 | 10s | Interactive quiz moment |
| `classroom-demo.mp4` | 1:10-1:25 | 15s | Full classroom session |

### FFmpeg Processing Script
```bash
#!/bin/bash
# Extract clips with clean cuts, 1080p, H.264

INPUT="/Users/abhinavnehra/Downloads/Video Project 1.mp4"
OUTPUT_DIR="./public/video/clips"

mkdir -p "$OUTPUT_DIR"

# Hero demo (0-8s)
ffmpeg -i "$INPUT" -ss 0 -t 8 -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k \
  "$OUTPUT_DIR/hero-demo.mp4" -y

# Whiteboard demo (15-25s)
ffmpeg -i "$INPUT" -ss 15 -t 10 -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k \
  "$OUTPUT_DIR/whiteboard-demo.mp4" -y

# Agent demo (35-48s)
ffmpeg -i "$INPUT" -ss 35 -t 13 -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k \
  "$OUTPUT_DIR/agent-demo.mp4" -y

# Quiz demo (55-65s)
ffmpeg -i "$INPUT" -ss 55 -t 10 -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k \
  "$OUTPUT_DIR/quiz-demo.mp4" -y

# Classroom demo (70-85s)
ffmpeg -i "$INPUT" -ss 70 -t 15 -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k \
  "$OUTPUT_DIR/classroom-demo.mp4" -y

# Also generate GIF fallbacks at 480p for instant loading
for clip in hero whiteboard agent quiz classroom; do
  ffmpeg -i "$OUTPUT_DIR/${clip}-demo.mp4" -vf "fps=10,scale=480:-1:flags=lanczos" \
    -loop 0 "$OUTPUT_DIR/${clip}-demo.gif" -y
done
```

### Screenshots for Static Usage
```bash
# Hero screenshot (0:03)
ffmpeg -i "$INPUT" -ss 3 -frames:v 1 -q:v 2 public/video/screenshots/hero.jpg -y

# Feature screenshots at key moments
ffmpeg -i "$INPUT" -ss 18 -frames:v 1 -q:v 2 public/video/screenshots/whiteboard.jpg -y
ffmpeg -i "$INPUT" -ss 42 -frames:v 1 -q:v 2 public/video/screenshots/agents.jpg -y
ffmpeg -i "$INPUT" -ss 58 -frames:v 1 -q:v 2 public/video/screenshots/quiz.jpg -y
ffmpeg -i "$INPUT" -ss 75 -frames:v 1 -q:v 2 public/video/screenshots/classroom.jpg -y
```

---

## Part 2: Website Redesign

### Design Direction
**Style**: Premium SaaS meets editorial — Apple-inspired clean lines with spatial depth. NOT dark/neon — warm, inviting, sophisticated.

**Color Palette** (warm, premium):
- **Background**: #0a0a0f (near-black with warmth)
- **Surface**: #16161a (elevated cards)
- **Primary**: #f97316 (warm orange)
- **Secondary**: #06b6d4 (cyan accent)
- **Text**: #fafafa (warm white)
- **Muted**: #71717a (zinc-500)

**Typography**:
- Display: **Instrument Serif** (Google Font) — elegant, editorial
- Body: **Inter** — clean, readable
- Mono: **JetBrains Mono** — code snippets

**Spatial System**:
- Base unit: 4px
- Section padding: 96px (desktop), 64px (mobile)
- Component gap: 24px
- Max content width: 1280px

### Section Structure

#### 1. Hero Section
**Visual**: Full-viewport with scroll-linked video
- Video plays from 0-8s clip
- As user scrolls, video timeline syncs with scroll position
- Text overlays fade based on scroll progress
- Parallax: text moves at 0.8x scroll speed, video at 1x

**Content**:
- "OpenMAIC" logo/wordmark
- Tagline: "The AI-Powered Classroom That Thinks Like a Teacher"
- Sub: "Multi-agent AI simulation with professor, classmates, whiteboard, and quizzes"
- CTA: "Start Learning Free" (primary), "Watch Demo" (secondary)

#### 2. Feature Showcase (Scroll-video sections)
Each feature gets a scroll-synced video:
- **Whiteboard**: Video demonstrates drawing, synced to scroll
- **AI Agents**: Debating classmates video
- **Quizzes**: Interactive quiz clip
- **Classroom**: Full session clip

**Layout pattern**:
- Alternating left/right text + video
- Video container with parallax depth (translateZ)
- Text reveals as video plays

#### 3. Social Proof
**Layout**: Horizontal scroll of testimonial cards
- Cards have subtle hover lift
- No carousel — native horizontal scroll with snap

#### 4. How It Works
**Layout**: Vertical steps with icons
- Numbered steps (1, 2, 3)
- Each step has small demo screenshot
- Connected by subtle line

#### 5. Pricing Section
**Layout**: 3-column cards
- Featured plan elevated with glow
- Price numbers use tabular figures

#### 6. Final CTA
**Visual**: Video background with overlay
- Parallax: video moves slower than scroll
- CTA button with hover glow

### Component Architecture

```
website/app/
├── components/
│   ├── scroll-video/
│   │   ├── ScrollVideo.tsx        # Core scroll-sync video component
│   │   ├── VideoSection.tsx       # Section wrapper with IntersectionObserver
│   │   └── ParallaxLayer.tsx      # Z-depth parallax wrapper
│   ├── sections/
│   │   ├── Hero.tsx               # Video hero with scroll-sync
│   │   ├── Features.tsx           # Feature showcase with videos
│   │   ├── HowItWorks.tsx         # Step-by-step
│   │   ├── Pricing.tsx            # Pricing cards
│   │   └── FinalCTA.tsx           # CTA with video bg
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       └── GlassCard.tsx          # Frosted glass effect
├── hooks/
│   ├── useScrollProgress.ts       # Scroll position 0-1
│   ├── useInView.ts               # Intersection observer
│   └── useParallax.ts             # Parallax calculations
└── lib/
    └── cn.ts
```

### Scroll-Video Implementation

```typescript
// hooks/useScrollProgress.ts
export function useScrollProgress(sectionRef: RefObject<HTMLElement>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      // progress from 0 (section top at bottom of viewport) to 1 (section bottom at top of viewport)
      const p = Math.max(0, Math.min(1, (windowHeight - rect.top) / (rect.height + windowHeight)));
      setProgress(p);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sectionRef]);

  return progress;
}
```

```typescript
// components/scroll-video/ScrollVideo.tsx
export function ScrollVideo({ src, screenshots, children }: {
  src: string;
  screenshots: string[]; // Fallback images at key timestamps
  children: React.ReactNode;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progress = useScrollProgress();

  // Sync video time with scroll progress
  useEffect(() => {
    if (videoRef.current && videoRef.current.duration) {
      videoRef.current.currentTime = progress * videoRef.current.duration;
    }
  }, [progress]);

  return (
    <div className="relative w-full aspect-video overflow-hidden">
      <video
        ref={videoRef}
        src={src}
        muted
        playsInline
        preload="metadata"
        className="w-full h-full object-cover"
      />
      {/* Fallback screenshots at key points */}
      {screenshots.map((img, i) => (
        <img
          key={i}
          src={img}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: Math.abs(progress - (i / (screenshots.length - 1))) < 0.1 ? 1 : 0 }}
        />
      ))}
      {children}
    </div>
  );
}
```

### Animation Specifications

```css
/* Parallax layers */
.parallax-bg { transform: translateY(calc(var(--scroll) * 0.3)); }
.parallax-mid { transform: translateY(calc(var(--scroll) * 0.6)); }
.parallax-fg { transform: translateY(calc(var(--scroll) * 1)); }

/* Text reveals */
@keyframes reveal-up {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}
.reveal { animation: reveal-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

/* Card hover */
.card:hover {
  transform: translateY(-8px);
  box-shadow: 0 32px 64px -12px rgba(0, 0, 0, 0.5);
}

/* Button glow on hover */
.btn-primary:hover {
  box-shadow: 0 0 40px rgba(249, 115, 22, 0.4);
}
```

### Accessibility
- All videos have `aria-label` descriptions
- `prefers-reduced-motion`: Videos remain static (first frame), no parallax
- Focus states visible on all interactive elements
- Color contrast 4.5:1 minimum

---

## File Structure

```
website/
├── app/
│   ├── page.tsx                    # Simplified landing
│   ├── globals.css                 # Design tokens + animations
│   └── components/
│       ├── scroll-video/
│       │   ├── ScrollVideo.tsx
│       │   ├── VideoSection.tsx
│       │   └── ParallaxLayer.tsx
│       ├── sections/
│       │   ├── Hero.tsx
│       │   ├── Features.tsx
│       │   ├── HowItWorks.tsx
│       │   ├── Pricing.tsx
│       │   └── FinalCTA.tsx
│       └── ui/
│           ├── Button.tsx
│           └── Card.tsx
├── hooks/
│   ├── useScrollProgress.ts
│   ├── useInView.ts
│   └── useParallax.ts
└── public/
    └── video/
        ├── clips/                  # Processed video clips
        └── screenshots/           # Static screenshots from video
```

---

## Implementation Order

### Phase 1: Video Processing
- [ ] Write and run FFmpeg script to extract clips
- [ ] Generate screenshots at key timestamps
- [ ] Set up `public/video/` directory structure

### Phase 2: Core Components
- [ ] Create `useScrollProgress` hook
- [ ] Create `useInView` hook
- [ ] Build `ScrollVideo` component
- [ ] Build `ParallaxLayer` component

### Phase 3: Hero Section
- [ ] Implement Hero with scroll-linked video
- [ ] Parallax text overlay
- [ ] CTA buttons with hover effects

### Phase 4: Feature Sections
- [ ] Whiteboard feature section with video
- [ ] Agents feature section with video
- [ ] Quiz feature section with video
- [ ] Classroom feature section with video

### Phase 5: Supporting Sections
- [ ] How It Works (stepped layout)
- [ ] Pricing cards
- [ ] Final CTA with video background

### Phase 6: Polish
- [ ] Responsive design (mobile-first)
- [ ] Reduced motion support
- [ ] Performance optimization
- [ ] Cross-browser testing

---

## Verification
1. Run video processing script, verify 5 clips + screenshots exist
2. `npm run dev` in website directory
3. Scroll through homepage - video should sync with scroll position
4. Check parallax depth on feature sections
5. Test on mobile viewport
6. Verify reduced motion: videos static, no parallax
7. Check all interactive elements have focus states