---
name: Linguistic Growth System
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#404943'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#707973'
  outline-variant: '#bfc9c1'
  surface-tint: '#2c694e'
  primary: '#0f5238'
  on-primary: '#ffffff'
  primary-container: '#2d6a4f'
  on-primary-container: '#a8e7c5'
  inverse-primary: '#95d4b3'
  secondary: '#0e6c4a'
  on-secondary: '#ffffff'
  secondary-container: '#a0f4c8'
  on-secondary-container: '#19724f'
  tertiary: '#364d3c'
  on-tertiary: '#ffffff'
  tertiary-container: '#4d6553'
  on-tertiary-container: '#c6e1ca'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b1f0ce'
  primary-fixed-dim: '#95d4b3'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#0e5138'
  secondary-fixed: '#a0f4c8'
  secondary-fixed-dim: '#85d7ad'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#cee9d3'
  tertiary-fixed-dim: '#b3cdb7'
  on-tertiary-fixed: '#092012'
  on-tertiary-fixed-variant: '#354c3b'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Plus Jakarta Sans
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
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-max: 1200px
  gutter: 24px
---

## Brand & Style

The design system is built to foster a sense of academic progress and organic growth. The brand personality is encouraging, clear, and intellectually stimulating, specifically targeting lifelong learners and students who require a distraction-free environment to focus on linguistic mastery.

The visual style is **Corporate / Modern** with a lean toward **Minimalism**. It prioritizes a high signal-to-noise ratio, utilizing expansive whitespace to reduce cognitive load during intense study sessions. The aesthetic is professional yet approachable, ensuring the user feels capable and supported rather than overwhelmed by complex data.

## Colors

The palette is anchored in a spectrum of "Forest Greens," symbolizing growth and endurance. 

- **Primary Green (#2D6A4F):** Used for primary actions, active navigation states, and key brand moments. It conveys stability and success.
- **Secondary Mint (#74C69D):** Used for progress bars, illustrative accents, and secondary buttons.
- **Surface Neutrals (#F8F9FA):** The background is a soft, off-white to reduce eye strain during long reading sessions.
- **Semantic Accents:** 
    - **Mastered:** Deep forest green to signal completion and authority.
    - **Learning:** A warm amber to indicate "caution" or "in-progress" status.
    - **New:** A bright blue to signal fresh discovery and opportunity.

## Typography

This design system utilizes a dual-font strategy to balance character with utility. 

**Plus Jakarta Sans** is used for all headlines and display text. Its soft terminals and modern geometric construction provide a friendly, optimistic "voice" to the application’s interface. 

**Inter** is used for all body copy, inputs, and labels. Its high x-height and neutral design ensure maximum legibility, which is critical when users are distinguishing between complex definitions and phonetic spellings. 

Maintain a strict vertical rhythm by adhering to the defined line heights. Use `headline-xl` sparingly for dashboard welcomes and achievement screens.

## Layout & Spacing

The layout follows a **Fluid Grid** model with a max-width container of 1200px for desktop. A standard 12-column grid is used for the dashboard, while learning modules (flashcards, quizzes) use a centered, 8-column narrow layout to minimize eye movement and increase focus.

- **Desktop:** 12 columns, 24px gutters, 48px side margins.
- **Tablet:** 8 columns, 16px gutters, 32px side margins.
- **Mobile:** 4 columns, 16px gutters, 16px side margins.

Spacial increments are based on an 8px scale. Use `lg` (48px) spacing between major sections and `md` (24px) for padding within cards and containers.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layers** and **Ambient Shadows**. This design system avoids harsh borders in favor of soft depth cues that suggest interactability.

- **Level 0 (Background):** Neutral #F8F9FA.
- **Level 1 (Cards/Base):** White background with a 1px stroke of #E9ECEF or a very soft shadow (0px 4px 20px rgba(0, 0, 0, 0.04)).
- **Level 2 (Hover/Active):** Slightly more pronounced shadow (0px 8px 30px rgba(0, 0, 0, 0.08)) to indicate elevation.
- **Level 3 (Modals/Overlays):** High-diffusion shadow (0px 12px 40px rgba(0, 0, 0, 0.12)) with a backdrop blur (8px) on the underlying content to maintain focus.

## Shapes

The shape language is consistently **Rounded**, reflecting the approachable and organic nature of learning. 

- **Standard Elements (Buttons, Inputs):** 0.5rem (8px) corner radius.
- **Content Containers (Cards):** 1rem (16px) corner radius.
- **Large Promotional Blocks:** 1.5rem (24px) corner radius.

Avoid sharp corners entirely as they conflict with the "growth" narrative. Progressive disclosure elements like "Show Definition" buttons should utilize the same rounding to maintain a cohesive feel.

## Components

### Buttons
- **Primary:** Solid #2D6A4F with white text. High emphasis.
- **Secondary:** #D8F3DC background with #2D6A4F text. Used for "Next" or "Skip" actions.
- **Ghost:** No background, #2D6A4F text. Used for tertiary actions.

### Cards (The "Word Card")
The central component of the system. Card headers should use `headline-md` for the vocabulary word, followed by a `label-sm` for the part of speech. Content is separated by a subtle 1px divider.

### Progress Indicators
Linear progress bars should use the `secondary_color` (#74C69D) with a rounded track. For "Mastery" levels, use a circular segmented progress ring.

### Inputs & Search
Fields should have a 1px border (#DEE2E6), changing to #2D6A4F on focus. Use Inter at `body-md` for placeholder text to ensure clarity.

### Chips/Tags
Used for word categories (e.g., "Medical," "Academic"). Use `label-sm` text inside a 0.25rem rounded container with a light tint of the primary color.

### List Items
List-based vocabulary views should feature generous vertical padding (16px) and a subtle separator. Include a status icon (Mastered/Learning) on the far right to allow for quick scanning.