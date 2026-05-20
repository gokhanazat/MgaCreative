---
name: Technical Precision
colors:
  surface: '#101415'
  surface-dim: '#101415'
  surface-bright: '#363a3b'
  surface-container-lowest: '#0b0f10'
  surface-container-low: '#191c1e'
  surface-container: '#1d2022'
  surface-container-high: '#272a2c'
  surface-container-highest: '#323537'
  on-surface: '#e0e3e5'
  on-surface-variant: '#c6c6cd'
  inverse-surface: '#e0e3e5'
  inverse-on-surface: '#2d3133'
  outline: '#909097'
  outline-variant: '#45464d'
  surface-tint: '#bec6e0'
  primary: '#bec6e0'
  on-primary: '#283044'
  primary-container: '#0f172a'
  on-primary-container: '#798098'
  inverse-primary: '#565e74'
  secondary: '#d2bbff'
  on-secondary: '#3f008e'
  secondary-container: '#6001d1'
  on-secondary-container: '#c9aeff'
  tertiary: '#4cd7f6'
  on-tertiary: '#003640'
  tertiary-container: '#001b21'
  on-tertiary-container: '#008da5'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d2bbff'
  on-secondary-fixed: '#25005a'
  on-secondary-fixed-variant: '#5a00c6'
  tertiary-fixed: '#acedff'
  tertiary-fixed-dim: '#4cd7f6'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#101415'
  on-background: '#e0e3e5'
  surface-variant: '#323537'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 64px
    fontWeight: '700'
    lineHeight: 72px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
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
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: JetBrains Mono
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
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

This design system is engineered for a high-end app developer portfolio, blending **Modern Corporate** reliability with **Glassmorphism** accents to signal technical proficiency. The brand personality is "Expert-Minimalist"—eliminating visual noise to let the code and product outcomes take center stage. 

The aesthetic prioritizes high-contrast legibility and a sophisticated "IDE-inspired" depth. The emotional response should be one of immediate trust and digital craftsmanship, positioning the developer as a specialist who balances system architecture with polished user experience.

## Colors

The palette is anchored in **Deep Tech Blues** to provide a stable, professional foundation. 
- **Primary:** A deep Slate/Navy used for the main canvas to reduce eye strain and provide a premium feel.
- **Secondary (Accent):** Electric Purple is the primary driver for high-priority Actions (CTAs) and active states.
- **Tertiary:** Cyan is used for data visualization, highlights, and secondary interactive elements to maintain a technical "glow."
- **Neutral:** Clean Whites and soft Grays are reserved for typography and iconography to ensure peak readability against the dark backgrounds.

## Typography

The typography system utilizes a trio of fonts to distinguish between brand presence, content readability, and technical data.
- **Geist** is used for headlines to provide a sharp, geometric, and modern tech aesthetic.
- **Inter** handles the bulk of the body copy, ensuring maximum accessibility across all devices.
- **JetBrains Mono** is strategically deployed for small labels, tags, and code snippets to reinforce the developer-centric narrative of the portfolio.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid** model. Content is contained within a 1280px max-width container to prevent excessive line lengths on ultra-wide monitors, while the inner grid remains fluid.

- **Grid:** A 12-column grid system is used for desktop, collapsing to 4 columns on mobile.
- **Spacing Rhythm:** Based on an 8px baseline grid to ensure mathematical harmony between elements.
- **Padding:** Generous vertical padding (80px - 120px) is used between sections to emphasize the minimalist, "gallery-style" showcase of projects.

## Elevation & Depth

This design system uses **Glassmorphism** and **Tonal Layering** to create a sense of hierarchy without heavy shadows.

- **Base Level (0):** Deep Slate background (`#0F172A`).
- **Surface Level (1):** Slightly lighter blue-grey containers with 1px semi-transparent borders.
- **Glass Overlay:** For navigation bars and floating cards, use a `backdrop-filter: blur(12px)` with a 10% white tint.
- **Shadows:** Use extremely diffused, 0% offset shadows with a `rgba(0, 0, 0, 0.4)` tint to lift cards off the background subtly.
- **Active State:** Elements being interacted with should gain a subtle outer glow using the Tertiary Cyan color.

## Shapes

The shape language is **Rounded**, striking a balance between the rigidity of code and the approachability of modern consumer apps. 

- **Cards and Containers:** Use `rounded-lg` (16px) for a soft but structured appearance.
- **Buttons and Inputs:** Use `rounded-md` (8px) to maintain a professional, tool-like feel.
- **Icons:** Use a 2px stroke weight with slightly rounded caps to match the typography.

## Components

### Buttons
- **Primary:** Solid Electric Purple background with white text. High-contrast, no shadow, 8px border radius.
- **Secondary:** Transparent background with a 1px Cyan border. On hover, fills with a 10% Cyan tint.

### Showcase Cards
- **Structure:** 16px border radius, background blur (Glassmorphism), and a 1px "inner-glow" border (top and left edges slightly lighter).
- **Behavior:** On hover, the card should scale slightly (1.02x) and the shadow depth should increase.

### Input Fields
- **Style:** Darker-than-background fill with a subtle 1px border.
- **Focus:** The border transitions to Cyan with a 4px soft outer glow.
- **Labels:** Always use the `label-sm` (JetBrains Mono) typography for field descriptors.

### Chips & Tags
- Used for tech stacks (e.g., "React", "Node.js"). Small, pill-shaped, using a 10% Cyan tint background and Cyan text to provide a technical highlight effect.

### Navigation
- A sticky header using the glassmorphism blur effect to keep the focus on the content while maintaining accessibility to the site structure.