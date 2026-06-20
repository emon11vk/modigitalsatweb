---
name: Dream Study - Modern Edition
colors:
  # Deep Base
  background: '#0a0e1a'
  surface: '#0f1420'
  surface-dim: '#0a0e1a'
  surface-bright: '#2a3142'
  
  # Surface Tiers - Refined for Glassmorphism
  surface-container-lowest: '#0d1120'
  surface-container-low: '#121829'
  surface-container: '#16192d'
  surface-container-high: '#1e2238'
  surface-container-highest: '#272d42'
  
  # Glass Effect Backgrounds
  glass-base: 'rgba(22, 25, 45, 0.45)'
  glass-light: 'rgba(42, 49, 66, 0.35)'
  glass-lighter: 'rgba(55, 63, 90, 0.25)'
  
  # Text
  on-surface: '#e8ecf4'
  on-surface-variant: '#b3b9cc'
  on-surface-muted: '#8a91a8'
  inverse-surface: '#e8ecf4'
  inverse-on-surface: '#1e2238'
  
  # Primary - Refined Teal
  primary: '#4dd9cc'
  primary-bright: '#5fe8db'
  primary-dark: '#2fb5a3'
  primary-container: '#1f5550'
  on-primary: '#001f1c'
  on-primary-container: '#7ff8e8'
  inverse-primary: '#00897f'
  
  # Secondary - Refined Rose  
  secondary: '#ff8fa3'
  secondary-dark: '#e87091'
  secondary-container: '#5d1a2a'
  on-secondary: '#3b0008'
  on-secondary-container: '#ffcdd9'
  
  # Accent Colors
  accent-gold: '#ffc857'
  accent-gold-light: '#ffe180'
  success-green: '#1dd1a1'
  success-light: '#55efc4'
  warning-orange: '#ff7f50'
  
  # Borders & Dividers
  outline: '#6b7290'
  outline-variant: '#434d66'
  border-light: 'rgba(77, 217, 204, 0.15)'
  border-subtle: 'rgba(255, 255, 255, 0.08)'
  
  # Depth & Shadows
  shadow-subtle: 'rgba(0, 0, 0, 0.15)'
  shadow-medium: 'rgba(0, 0, 0, 0.25)'
  glow-primary: 'rgba(77, 217, 204, 0.25)'

typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
    
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
    
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.005em
    
  headline-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    
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
    
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.02em
    
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.015em
    
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
    
  stats-number:
    fontFamily: Inter
    fontSize: 42px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: -0.025em
    
  code:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 20px

rounded:
  xs: 0.375rem  # 6px
  sm: 0.5rem    # 8px
  md: 0.75rem   # 12px
  DEFAULT: 1rem # 16px
  lg: 1.5rem    # 24px
  xl: 2rem      # 32px
  full: 9999px

spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  3xl: 40px
  gutter: 16px
  card-padding: 24px
  container-margin: 24px

shadows:
  none: 'none'
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.08)'
  base: '0 4px 12px 0 rgba(0, 0, 0, 0.15)'
  md: '0 8px 24px 0 rgba(0, 0, 0, 0.2)'
  lg: '0 16px 40px 0 rgba(0, 0, 0, 0.25)'
  xl: '0 24px 60px 0 rgba(0, 0, 0, 0.3)'
  glow: '0 0 24px 0 rgba(77, 217, 204, 0.15)'
  
---

## Design Philosophy

**Modern Excellence Through Glassmorphism**: The redesigned platform embraces contemporary design trends while maintaining educational clarity. Deep navy backgrounds provide focus, while refined glassmorphism layers create visual depth and hierarchy without clutter. The teal accent has been elevated with brighter, more sophisticated variations that feel premium and energetic.

**Key Evolution**:
- Glassmorphic cards with subtle backdrop-filter effects
- Refined color palette with better contrast ratios
- Modern spacing and scale hierarchy
- Refined typography with stronger visual hierarchy
- Smooth micro-interactions and transitions
- Premium feel through layered glass effects

## Color System

### Background Hierarchy
- **Background (#0a0e1a)**: Darkest, pure deep navy for main environment
- **Surface (#0f1420)**: Slightly lighter for base panels and layouts
- **Surface Containers**: Graduated tiers from lowest (#0d1120) to highest (#272d42) for nested elevation

### Primary Teal - Refined & Energetic
- **Primary (#4dd9cc)**: Main action color - pure, modern teal with excellent legibility
- **Primary Bright (#5fe8db)**: Hover and focus states - more energetic
- **Primary Dark (#2fb5a3)**: Pressed and darker backgrounds
- **Primary Container (#1f5550)**: Subtle background for tertiary actions

The teal has been refined to feel more contemporary while maintaining the core brand identity. It's brighter than the original while still sophisticated.

### Glass Effect Colors
New glass-specific backgrounds created for modern layered effects:
- **glass-base**: Primary glassmorphic elements (cards, modals)
- **glass-light**: Lighter glass for emphasis 
- **glass-lighter**: Faintest glass for subtle backgrounds

### Accent Colors - Refined
- **Accent Gold (#ffc857)**: Warmer, more sophisticated for streaks and special achievements
- **Success Green (#1dd1a1)**: Modern, vibrant for completed states
- **Secondary Rose (#ff8fa3)**: Softer, more refined error and "wrong" states

## Typography System

Enhanced hierarchy with stronger weight differentiation:
- **Display Large** (48px, 700): Page titles and hero sections
- **Headline Large** (32px, 700): Major section headers with increased letter-spacing
- **Headline Medium** (24px, 700): Card titles and section headers
- **Headline Small** (18px, 600): Subsection headers
- **Body Large** (18px): Long-form reading passages
- **Body Medium** (16px): Standard paragraph text
- **Body Small** (14px): Secondary text and descriptions
- **Label Large** (14px, 600): Primary labels and buttons
- **Stats Number** (42px, 700): Large numbers in statistics and countdowns

All typographic elements use increased letter-spacing at headline levels for modern sophistication.

## Layout & Spacing

Refined 8px grid system with:
- **Container Margin**: 24px for main layout breathing room
- **Card Padding**: 24px for generous internal spacing
- **Gutter**: 16px between components
- **Gap Scale**: xs (4px) to 3xl (40px) for flexible layout rhythm

Modern layouts favor:
- Breathing room over density
- Generous padding inside cards (24px vs previous 20px)
- Larger gaps between major sections (24px)
- Careful vertical rhythm with 4px micro-adjustments

## Components

### Cards & Containers
- **Glass Cards**: `background: rgba(22, 25, 45, 0.45)` with backdrop-filter blur
- **Borders**: `rgba(77, 217, 204, 0.15)` for subtle primary teal underlay
- **Corner Radius**: 16px (lg) for modern softness
- **Backdrop Filter**: `blur(12px)` for glassmorphic depth

### Buttons
- **Primary**: Solid teal background, pill-shaped with shadow on hover
- **Secondary**: Glass effect with teal border and hover glow
- **Ghost**: Text only with subtle background on hover
- **Sizes**: Large (48px), Medium (40px), Small (32px)

### Interactive States
- **Hover**: Lighter background, subtle glow effect
- **Focus**: Primary border with inner glow
- **Active**: Darker background with increased opacity
- **Disabled**: Reduced opacity (50%) with cursor-not-allowed

### Modern Effects
- **Glow Effects**: Primary color glow (0 0 24px rgba(77, 217, 204, 0.15)) on focus and hover
- **Shadows**: Soft, layered shadows replacing flat designs
- **Transitions**: 200ms ease for smooth state changes
- **Micro-interactions**: Subtle scale and translate transforms

## Gamification Elements

### Streak Tracker
- Circular day indicators with increased visual prominence
- Active days: Bright teal background with gold flame icon
- Glow effect on current day
- Smooth animations for new day unlocks

### Mission Cards
- Glass effect containers with left accent border (primary teal)
- Gradient backgrounds for priority levels
- "Ongoing" badge with refined styling
- Hover lift effect with subtle shadow

### Progress Indicators
- Circular progress rings with gradient strokes
- Modern counter-clockwise progression
- Subtle glow on active sections
- Animated fill on completion

## Accessibility & Performance

- **WCAG AA Compliance**: All text colors meet 4.5:1 contrast ratios minimum
- **Glassmorphism**: Reduced-motion support with fallback solid backgrounds
- **Icon System**: Updated Material Symbols for consistency
- **Loading States**: Skeleton screens with glass effect for perceived performance
