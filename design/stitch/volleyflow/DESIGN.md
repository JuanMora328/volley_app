---
name: VolleyFlow
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45474c'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#75777d'
  outline-variant: '#c5c6cd'
  surface-tint: '#545f73'
  primary: '#091426'
  on-primary: '#ffffff'
  primary-container: '#1e293b'
  on-primary-container: '#8590a6'
  inverse-primary: '#bcc7de'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#0b1800'
  on-tertiary: '#ffffff'
  tertiary-container: '#1a2e00'
  on-tertiary-container: '#64a000'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e3fb'
  primary-fixed-dim: '#bcc7de'
  on-primary-fixed: '#111c2d'
  on-primary-fixed-variant: '#3c475a'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#acf847'
  tertiary-fixed-dim: '#91db2a'
  on-tertiary-fixed: '#102000'
  on-tertiary-fixed-variant: '#304f00'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
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
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  title-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  currency-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 20px
  gutter: 16px
---

## Brand & Style
The design system is engineered for high-performance sports management, balancing the technical requirements of match logistics with a premium, energetic aesthetic. The brand personality is authoritative yet agile, positioning itself as a professional tool for organizers and athletes alike.

The visual style follows a **Modern Corporate** direction with **Sporty Accents**. It utilizes high-quality typography and generous whitespace to ensure clarity during fast-paced match coordination. The interface relies on a clean, structured layout where "action-oriented" elements are prioritized through vibrant color hits, while administrative data remains grounded in a stable, neutral environment.

## Colors
This design system employs a hierarchical color strategy to separate structure from action:

- **Foundation:** The background uses a soft, non-fatiguing light gray (#F8FAFC) to reduce glare, while surfaces are kept in pure white (#FFFFFF) to create clear optical separation.
- **Structure:** Navy Blue (#1E293B) is reserved for persistent structural elements like headers and navigation sidebars, providing a sense of stability and "pro-league" authority.
- **Action:** Electric Blue (#2563EB) is the primary interactive trigger. Use this for primary buttons, selection states, and focus indicators.
- **Accent/Success:** Lime Green (#84CC16) provides a high-energy "sporty" contrast. It is used for positive status indicators (e.g., "Paid," "Confirmed") and brand-specific accents.
- **Alert:** Red (#EF4444) is used sparingly for destructive actions and to highlight financial debts or "Late" statuses.

## Typography
Inter is the cornerstone of the system, chosen for its exceptional legibility and systematic design. 

- **Headlines:** Use Bold weights with slight negative letter spacing to create a compact, "news-ticker" feel for match scores and tournament names.
- **Data Display:** Monetary amounts use `currency-md` with slightly increased letter spacing to ensure digits are easily distinguishable at a glance.
- **Labels:** Small labels (`label-sm`) should be set in Uppercase to differentiate administrative metadata from user-generated content.
- **Mobile Scaling:** On mobile devices, large headlines automatically downscale to ensure they don't consume excessive vertical real estate during match reporting.

## Layout & Spacing
The design system utilizes a **12-column fluid grid** for desktop and a **single-column fluid layout** for mobile. 

- **Spacing Rhythm:** Based on a 4px baseline, with 16px (md) as the default padding for cards and containers.
- **Desktop Sidebar:** A fixed-width (260px) navy sidebar anchors the navigation, allowing the main content area to expand.
- **Mobile Bottom Nav:** On mobile, a persistent 64px high navigation bar ensures key sections (Inicio, Jornadas, Jugadores, Canchas, Más) are always within thumb's reach.
- **Generous Whitespace:** Content cards must never feel cramped. Maintain at least 24px of vertical separation between logical sections to allow the user to focus on specific data points without distraction.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and **Ambient Shadows**.

1.  **Level 0 (Background):** Soft light gray (#F8FAFC), recessed.
2.  **Level 1 (Cards/Surfaces):** Pure white (#FFFFFF) with a very soft, diffused shadow (0px 4px 12px rgba(30, 41, 59, 0.05)).
3.  **Level 2 (Active/Hover States):** Increased shadow depth (0px 8px 20px rgba(30, 41, 59, 0.08)) to indicate interactivity.
4.  **Level 3 (Modals/Overlays):** High-elevation shadows with a backdrop blur on the underlying content to focus user attention.

Avoid heavy borders; use subtle 1px strokes in a light gray (#E2E8F0) only when multiple white surfaces overlap.

## Shapes
The shape language is "Full-Rounded," intended to feel modern and friendly while remaining professional.

- **Primary Radius:** 12px for standard cards and buttons.
- **Large Radius:** 16px for main dashboard containers or highlighted feature cards.
- **Pill Shapes:** Used exclusively for status chips (e.g., "In Progress") to distinguish them from actionable buttons.

## Components
- **Buttons:** Large, finger-friendly targets (min height 48px on mobile). Primary buttons use Electric Blue; destructive buttons use a soft Red tint with dark Red text.
- **Cards:** The central data vessel. Use 16px rounded corners. Header sections within cards should have a subtle bottom border.
- **Status Indicators:** Always pair a color with an icon (e.g., a green checkmark for "Paid," a red exclamation for "Debt") to ensure accessibility for colorblind users.
- **Monetary Amounts:** Displayed in a semi-bold weight. Use Red (#EF4444) for negative balances or debts and Navy Blue (#1E293B) for standard totals.
- **Navigation:** 
    - *Desktop:* Sidebar with Navy background and Electric Blue active state indicators.
    - *Mobile:* Bottom bar with clear icon/label pairings. The "Active" tab is highlighted in Electric Blue.
- **Inputs:** Clean white backgrounds with a 1px border. Focus state should use a 2px Electric Blue ring.