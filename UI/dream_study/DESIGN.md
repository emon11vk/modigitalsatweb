---
name: Dream Study
colors:
  surface: '#0e1513'
  surface-dim: '#0e1513'
  surface-bright: '#333b39'
  surface-container-lowest: '#09100e'
  surface-container-low: '#161d1b'
  surface-container: '#1a211f'
  surface-container-high: '#242b2a'
  surface-container-highest: '#2f3634'
  on-surface: '#dde4e1'
  on-surface-variant: '#bacac5'
  inverse-surface: '#dde4e1'
  inverse-on-surface: '#2b3230'
  outline: '#859490'
  outline-variant: '#3c4a46'
  surface-tint: '#3cddc7'
  primary: '#57f1db'
  on-primary: '#003731'
  primary-container: '#2dd4bf'
  on-primary-container: '#00574d'
  inverse-primary: '#006b5f'
  secondary: '#ffb2b7'
  on-secondary: '#67001b'
  secondary-container: '#b50036'
  on-secondary-container: '#ffc2c4'
  tertiary: '#ffd1aa'
  on-tertiary: '#4b2800'
  tertiary-container: '#ffac5a'
  on-tertiary-container: '#744000'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#62fae3'
  primary-fixed-dim: '#3cddc7'
  on-primary-fixed: '#00201c'
  on-primary-fixed-variant: '#005047'
  secondary-fixed: '#ffdadb'
  secondary-fixed-dim: '#ffb2b7'
  on-secondary-fixed: '#40000d'
  on-secondary-fixed-variant: '#92002a'
  tertiary-fixed: '#ffdcc0'
  tertiary-fixed-dim: '#ffb875'
  on-tertiary-fixed: '#2d1600'
  on-tertiary-fixed-variant: '#6b3b00'
  background: '#0e1513'
  on-background: '#dde4e1'
  surface-variant: '#2f3634'
  bg-deep: '#0B1221'
  surface-card: '#161D2F'
  surface-navigation: '#111827'
  text-muted: '#94A3B8'
  accent-gold: '#FBBF24'
  success-green: '#22C55E'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
  stats-number:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: -0.02em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  container-margin: 24px
  gutter: 16px
  card-padding: 20px
---

## Brand & Style

The brand personality is professional, focused, and quietly encouraging. It targets students preparing for the Digital SAT, requiring an environment that balances the intensity of high-stakes testing with the engaging mechanics of modern gamification.

The design style is **Corporate Modern with Gamified Accents**. It utilizes a deep dark-mode aesthetic to reduce eye strain during long study sessions. The interface relies on a strict 8px grid system, high-quality iconography, and a clear hierarchy of information. Elements like streaks, missions, and progress rings inject a sense of momentum without distracting from the educational content. The visual language mimics the official Bluebook testing environment to build student familiarity while layering on a more vibrant, motivating wrapper.

## Colors

The palette is anchored by a sophisticated **Deep Navy** background to establish a premium, scholarly atmosphere. 

- **Primary (Teal/Aqua):** Used for primary actions, active navigation states, and progress indicators. It provides a high-energy contrast against the dark background.
- **Secondary (Rose/Coral):** Reserved for errors, critical warnings, or specific "Wrong" states in statistics to provide immediate visual feedback.
- **Surface Tiers:** UI depth is created through varying levels of navy/grey saturation. Cards sit on a slightly lighter surface than the main background to create subtle separation.
- **Gamification Colors:** Gold is used for streaks and high-priority missions, while Success Green is utilized for completed tasks and "Correct" answer states.

## Typography

The typography system uses **Inter** for its exceptional legibility at small sizes and its neutral, modern character. 

- **Hierarchy:** High-contrast font weights (SemiBold to Bold) are used for headings to ensure scannability.
- **Functional Labels:** Labels use slightly increased letter spacing and uppercase styling for auxiliary information (e.g., "DAYS", "HOURS" in countdowns).
- **Educational Clarity:** In the "Exercise Session," font sizes and line heights are optimized for long-form reading, mirroring the accessibility standards of standardized testing software.

## Layout & Spacing

This design system uses a **fixed 3-column layout** for the main dashboard to provide a structured, non-scrolling experience where all key metrics are visible at once.

- **Sidebar (Left):** 240px fixed width. Contains navigation and mascot area.
- **Main Content (Center):** Fluid width with a focus on modular cards.
- **Utility Panel (Right):** 320px fixed width. Houses profile, calendar, and mission trackers.
- **Rhythm:** An 8px base grid governs all margins and paddings. Component internal padding is typically 20px (base * 2.5) to balance density with breathability.
- **Breakpoints:** On tablets, the right panel collapses into a drawer or moves below the main content. On mobile, the system transitions to a single-column vertical stack with a bottom navigation bar.

## Elevation & Depth

Visual hierarchy is achieved through **Tonal Layering** and **Low-Contrast Outlines**.

- **Surfaces:** The background uses the deepest navy. Cards and containers use a slightly lighter "Surface" color to pull forward.
- **Borders:** Subtle 1px borders (#ffffff10) are used instead of heavy shadows to define card boundaries, maintaining a crisp, modern aesthetic.
- **Shadows:** When used (primarily for floating modals or the Desmos calculator), shadows are ultra-soft with a high blur radius and low opacity, tinted with the primary navy color to feel integrated.
- **Active States:** Inner glows and primary-colored borders indicate focus or selection.

## Shapes

The shape language is dominated by **Pill-shaped (rounded-full)** and **High-radius (rounded-2xl)** geometry.

- **Buttons & Nav:** All primary buttons and navigation items use a fully rounded pill shape.
- **Cards:** Main dashboard cards and content containers use a 16px to 24px corner radius to soften the technical nature of the content.
- **Interactive Elements:** Input fields and dropdowns follow the pill-shaped theme to maintain consistency with the primary action buttons.

## Components

### Buttons
- **Primary:** Pill-shaped, gradient or solid Teal background with dark text.
- **Secondary/Ghost:** Pill-shaped, transparent background with a Teal border or subtle grey hover state.

### Cards
- **Stat Cards:** Use rounded-2xl corners, subtle borders, and contain high-contrast data visualizations (donut charts).
- **Mission Cards:** Feature a left-aligned icon, vertical text stack, and an "Ongoing" badge in the top right.

### Inputs & Selectors
- **Radio Buttons (SAT Style):** Circular buttons with a primary teal center when selected.
- **Grid-in Inputs:** Square, high-contrast input boxes for Math modules.

### Specialized Testing Tools
- **Question Navigator:** A grid of small squares at the bottom of the screen. Blue = Answered, Teal/Bordered = Current, Corner-Flag = Marked for Review.
- **Desmos Window:** A draggable, resizable modal with a dark-themed header and a close/minimize action.

### Gamification Elements
- **Streak Tracker:** Horizontal list of circular day indicators. Active days feature the "Flame" icon and a primary highlight.
- **Mascot Containers:** Soft-colored boxes that house character illustrations, providing a friendly "guide" throughout the experience.