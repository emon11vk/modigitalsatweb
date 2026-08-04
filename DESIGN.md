---
name: Mơ Digital SAT
description: A structured, distraction-free testing environment for SAT prep.
colors:
  primary: "#0EA5E9"
  accent: "#00D4AA"
  accent-warm: "#FF6B6B"
  accent-gold: "#FFD93D"
  bg-dark: "#0B0F1A"
  bg-card: "#111827"
  bg-surface: "#151C2C"
  bg-light: "#F8FAFC"
  bg-light-card: "#FFFFFF"
  text-primary: "#F1F5F9"
  text-secondary: "#94A3B8"
  text-muted: "#64748B"
  text-dark: "#0F172A"
  text-dark-secondary: "#475569"
typography:
  display:
    fontFamily: '"DM Sans", system-ui, sans-serif'
  body:
    fontFamily: '"DM Sans", system-ui, sans-serif'
  mono:
    fontFamily: '"JetBrains Mono", monospace'
rounded:
  md: "8px"
  lg: "16px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.lg}"
    padding: "12px 24px"
---

# Design System: Mơ Digital SAT

## 1. Overview

**Creative North Star: "Mở Điểm Số - Chạm Giấc Mơ Digital SAT"**

Structured but inviting. We use soft lighting and subtle depth to make the strict testing environment feel approachable, paired with carefully crafted micro-interactions (like the ripple banner) that draw the user's attention to the brand intentionally. The design balances a distraction-free testing UI with a gamified experience outside of tests.

**Key Characteristics:**
- Distraction-free testing UI
- Intentional micro-interactions (brand-focused banners)
- High contrast for readability
- Clear, friendly component shapes

## 2. Colors

The palette balances strict, neutral backgrounds with vibrant, encouraging accents.

### Primary
- **SAT Sky Blue** (#0EA5E9): The main brand and action color. Used for primary CTAs, active states, and to anchor the visual identity.

### Secondary
- **Progress Teal** (#00D4AA): Used for success states, mastered vocabulary, and positive reinforcement.
- **Accent Gold** (#FFD93D): Used for leaderboard highlights, points, and gamification elements.
- **Accent Warm** (#FF6B6B): Used for errors, warnings, and highlighting incorrect answers during review.

### Neutral
- **Light Background** (#F8FAFC): The default background for the app shell and passage pane.
- **Dark Text** (#0F172A): Primary text color for high legibility on light backgrounds.
- **Dark Background** (#0B0F1A): For dark mode elements or specific gamified night-mode sections.

**The No-Distraction Rule.** During a test attempt, vibrant colors (Teal, Gold, Warm) are strictly minimized to prevent cognitive overload. The interface should feel strictly neutral until the test is submitted.

## 3. Typography

**Display Font:** DM Sans (with system-ui fallback)
**Body Font:** DM Sans (with system-ui fallback)
**Label/Mono Font:** JetBrains Mono

**Character:** Clean, highly legible, yet distinct from generic AI defaults. DM Sans provides a modern, approachable personality that feels deliberately designed rather than templated.

### Hierarchy
- **Display** (Bold, clamp responsive): Hero sections, welcome screens, and major milestones.
- **Headline** (Semi-bold, 24px): Section headers, test titles, and modal headers.
- **Body** (Regular, 16px, 1.5 line-height): Test passages, question stems, and general UI text. Line length is capped at 65–75ch for readability.
- **Label** (Medium, 12px, tracking-wide uppercase): Timers, stats, code snippets, and button text.

**The Intentional Sans Rule.** Use DM Sans instead of Inter to avoid the saturated "AI generated" look, bringing a unique brand voice to the product.

## 4. Elevation

Subtle Layering - Clean, crisp dropshadows separate test panes from the background to define hierarchy.

### Shadow Vocabulary
- **Pane Elevation** (`box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1)`): Lifts the question pane slightly above the passage pane.
- **Modal Elevation** (`box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1)`): Used for the pre-test gate and vocabulary popups to command focus.

**The Depth-for-Focus Rule.** Shadows are used structurally to define what the user should be interacting with right now, not decoratively, except on the dashboard where brand micro-interactions exist.

## 5. Components

Components are accessible and friendly, utilizing large tap targets, rounded corners, and clear outlines.

### Buttons
- **Shape:** Rounded (12px or full-pill).
- **Primary:** SAT Sky Blue background with white text.
- **Hover / Focus:** Subtle scale up or brightness shift, accompanied by a clear focus ring.
- **Secondary / Ghost (if applicable):** Subtle transparent hover state with colored text.

### Cards / Containers
- **Corner Style:** 16px radius for main content cards.
- **Background:** White on light mode, dark blue on dark mode.
- **Shadow Strategy:** Subtle layering to separate from the background.
- **Border:** 1px subtle border to contain content cleanly.
- **Internal Padding:** Spaced generously (24px - 32px) for breathing room.

### Inputs / Fields
- **Style:** Light gray or subtle transparent background with a rounded border.
- **Focus:** Crisp, highly visible focus ring to ensure accessibility.
- **Error / Disabled:** Warm red border for errors.

### Navigation
- Minimalist top bar and bottom bar. Large, touch-friendly targets for question navigation.

## 6. Do's and Don'ts

### Do:
- **Do** maintain a strict, distraction-free environment during the test itself.
- **Do** use large tap targets (minimum 44x44px) for all interactive elements.
- **Do** enforce a split-screen paradigm during testing, keeping the passage visible while answering questions.
- **Do** use SAT Sky Blue for the primary actions and Progress Teal to celebrate success.
- **Do** use deliberate micro-interactions (like ripple on banner) to draw attention to brand elements, as long as it doesn't distract from the core task.

### Don't:
- **Don't** include cluttered, noisy UIs with sidebars, footers, or ads during testing.
- **Don't** use overly playful or cartoonish aesthetics that detract from the seriousness of a standardized test.
- **Don't** use gray text on colored backgrounds without adjusting for contrast (ensure readability).
- **Don't** use the 2014-era app look; avoid shadow-heavy or glassmorphism-heavy UI where not structurally needed (keep shadows subtle like `shadow-sm`).
