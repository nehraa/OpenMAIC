# OpenMAIC Website - Dreamy Bokeh Spatial Depth Enhancement

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the OpenMAIC website into an immersive spatial experience with dreamy bokeh depth — soft focus backgrounds, layered parallax, creamy glass surfaces, and warm atmospheric depth.

**Architecture:** Multi-layer z-depth system where background bokeh orbs float at different planes, content sits in sharp focus mid-ground, and subtle foreground elements create depth. Scroll-driven parallax shifts layers at different rates. CSS backdrop-filter creates creamy glass effects with warm color temperature.

**Tech Stack:** Next.js App Router, Framer Motion, CSS backdrop-filter, Intersection Observer, custom scroll-driven animations

---

## Design Language

### Color Palette (Warm, Dreamy)
- **Bokeh Orbs**: Coral (#ff6b4a) at 15% opacity, Teal (#00d4aa) at 12% opacity, Violet (#7c3aed) at 10% opacity
- **Glass Surfaces**: Warm white with cream tint (#fff9f5 at 85% opacity)
- **Background Gradient**: Deep indigo base (#070b18) with warm amber tint at bottom
- **Text**: Pure white with warm undertone
- **Accents**: Coral primary, Teal secondary, soft amber highlights

### Typography
- **Display**: Source Serif 4 (already in use) - elegant, editorial
- **Body**: Inter - clean readability against soft backgrounds
- **Scale**: Fluid from 16px to 72px using clamp()

### Spatial System
- **Z-Depth Layers**:
  - Layer 0 (farthest): Large bokeh orbs, blur 80px, opacity 0.15
  - Layer 1: Medium bokeh, blur 40px, opacity 0.2
  - Layer 2: Small particles, blur 20px, opacity 0.25
  - Layer 3: Content plane (sharp focus)
  - Layer 4: Foreground elements, subtle shadow, opacity 0.9

### Motion Philosophy
- **Parallax**: Background moves at 0.3x scroll speed, midground at 0.6x, foreground at 1x
- **Entrance**: Fade + subtle scale from 0.95, 600ms ease-out-quart
- **Hover**: Gentle lift (translateY -4px) with shadow deepening, 200ms
- **Bokeh drift**: Continuous subtle floating animation on orbs, 8-12s cycle, ease-in-out

---

## Section-by-Section Design

### 1. Hero Section
**Background**: Animated bokeh orbs floating at different z-depths
- Large coral orb (300px) at top-left, blur 60px, drifts slowly
- Medium teal orb (200px) at bottom-right, blur 40px
- Small violet particles scattered throughout

**Content**: Floating card with glass morphism, centered text
- Glass: `backdrop-blur-xl` with warm white tint
- Border: 1px rgba(255,255,255,0.15)
- Shadow: Large soft shadow for floating effect

**Parallax**: As user scrolls, orbs drift at different rates creating depth

### 2. Social Proof Section
**Background**: Subtle bokeh gradient
- Warm amber glow behind testimonial cards

**Cards**: Creamy glass with depth
- Background: rgba(255,249,245,0.08)
- Border: 1px rgba(255,255,255,0.12)
- Slight rotation (-1deg to 2deg) for organic feel

### 3. How It Works Section
**Background**: Step indicators float in z-space
- Numbered circles with bokeh glow behind them

**Content Cards**: Each step floats at slight offset
- Sequential depth: cards at z-offset 0px, 20px, 40px
- Connecting line has bokeh particles along path

### 4. Feature World Section
**Background**: Full-screen gradient with floating bokeh
- Large centered teal glow

**Feature Cards**: Grid with staggered depth
- Alternating z-depths (0px, 15px, 30px) for organic layering
- Each card has subtle shadow creating floating effect

### 5. Classroom Preview Section
**Background**: Animated aurora with bokeh overlay
- Deep indigo with coral/teal bokeh orbs

**Content**: Glass panel showcasing classroom interface
- Video/demo embed with bokeh background
- Floating UI elements around preview

### 6. Pricing Section
**Background**: Warm bokeh atmosphere
- Amber glow from bottom, creating light-from-below effect

**Cards**: Premium glass with depth
- Featured plan elevated (translateY -20px, stronger shadow)
- Glass surfaces have subtle inner glow
- Bokeh orbs drift behind cards

### 7. Teacher Command Center Section
**Background**: Tech-focused but warm
- Grid pattern with bokeh overlay

**Interface Mock**: Floating panels with depth
- Glass cards at multiple z-depths showing dashboard

### 8. Outcomes Section
**Background**: Calm, spacious
- Soft gradient with minimal bokeh

**Metrics**: Large typography with bokeh glow behind numbers
- Stats animate in with staggered parallax

### 9. FAQ Section
**Background**: Subtle bokeh
- Minimal, focused on readability

**Accordion**: Glass panels with soft edges
- Expanded state has warm highlight

### 10. Final CTA Section
**Background**: Dramatic bokeh
- Large orbs converging toward CTA button
- Slower parallax for emphasis

**Button**: Elevated, glowing
- Pulsing bokeh glow effect
- Strong shadow creating floating effect

### 11. Footer
**Background**: Minimal, dark
- Subtle gradient, no bokeh to ground the page

---

## Component Inventory

### Bokeh Orb Component
- **Props**: size, color, blur, opacity, position, animationDuration, animationDelay
- **States**: static, drifting (floating animation)
- **Variants**: Large (300px+), Medium (150-300px), Small (50-150px), Particle (<50px)

### Glass Card Component
- **Props**: depth (z-offset), warmTint (boolean), featured (elevated)
- **States**: default, hover (lift + shadow deepen)
- **Variants**: Standard, Featured (elevated), Interactive

### Parallax Layer Component
- **Props**: speed (0.1 to 1.0), children
- **Behavior**: Moves at speed * scroll position
- **Depth cue**: Slower = farther

### Section Container
- **Props**: hasBokeh (boolean), parallaxIntensity (low/medium/high)
- **Behavior**: Manages bokeh orbs and parallax for section

---

## Animation Specifications

### Bokeh Drift
```css
@keyframes bokeh-drift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(20px, -30px) scale(1.05); }
  66% { transform: translate(-15px, 20px) scale(0.95); }
}
```

### Scroll Parallax
- Background bokeh: scroll * 0.3
- Midground elements: scroll * 0.6
- Foreground: scroll * 1.0

### Entrance Animation
```css
@keyframes dreamy-entrance {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.96);
    filter: blur(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}
```

### Glass Hover
```css
.glass-card:hover {
  transform: translateY(-4px);
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(255, 107, 74, 0.1);
}
```

---

## Accessibility

- **Reduced Motion**: All parallax and bokeh animations collapse to static positioning. Bokeh orbs become fixed, blurred backgrounds.
- **Focus States**: Visible focus rings with coral accent
- **Color Contrast**: All text maintains 4.5:1 ratio minimum against backgrounds
- **Keyboard Navigation**: Full keyboard support, no hover-dependent features

---

## Performance Considerations

- **Lazy Bokeh**: Bokeh orbs outside viewport are not rendered
- **GPU Acceleration**: All animations use transform/opacity only
- **Will Change**: Parallax containers use will-change: transform
- **Debounced Scroll**: Scroll handlers debounced to 16ms (60fps)
- **Backdrop Filter Budget**: Max 3 blur effects per section to maintain performance

---

## Implementation Order

1. Global CSS variables and keyframes
2. Bokeh Orb component (reusable)
3. Glass Card component with depth variants
4. Section containers with parallax
5. Hero section (highest impact)
6. Social Proof and How It Works
7. Feature World and Classroom Preview
8. Pricing (featured elevation)
9. Teacher Command Center and Outcomes
10. FAQ, Final CTA, Footer
11. Polish and performance optimization