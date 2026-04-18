# Smart Ticket - Design System

## Intent
- **Who:** Team leads, developers, support staff
- **Do:** Track issues, manage projects, collaborate
- **Feel:** Professional, structured, efficient

## Depth Strategy
**Borders-only** - Clean, technical approach. No shadows. Hierarchy through subtle borders.

## Color Palette
```scss
--surface-base: #FFFFFF;
--surface-raised: #F8FAFC;
--surface-muted: #F1F5F9;

--ink-primary: #0F172A;
--ink-secondary: #475569;
--ink-tertiary: #94A3B8;
--ink-placeholder: #CBD5E1;

--border-default: #E2E8F0;
--border-subtle: #F1F5F9;
--border-emphasis: #CBD5E1;

--primary: #0F6CBD;
--primary-hover: #0A5BA8;
--primary-subtle: #0F6CBD15;

--success: #16A34A;
--success-subtle: #16A34A15;
--warning: #CA8A04;
--warning-subtle: #CA8A0415;
--danger: #DC2626;
--danger-subtle: #DC262615;

--bg-app: #F1F5F9;
--bg-sidebar: #0F172A;
```

## Typography
- **Font:** Inter
- **Scale:** 4 levels
  - Primary (headlines): 600 weight, tight tracking
  - Secondary (body): 400 weight
  - Tertiary (labels): 500 weight, smaller
  - Muted (metadata): 400 weight, lighter color

## Spacing Base
4px grid: 4, 8, 12, 16, 24, 32, 48, 64

## Border Radius
- Micro (inputs/buttons): 3px
- Small (badges): 3px  
- Medium (cards): 6px
- Large (modals): 8px

## Component Patterns

### Cards
- Background: surface-base
- Border: 1px solid border-default
- Radius: 6px
- Padding: 16px | 24px
- No shadow

### Inputs
- Background: darker than parent (surface-muted)
- Border: 1px solid border-default
- Focus: border-emphasis with primary color

### Buttons
- Primary: solid primary bg
- Secondary: transparent, border-default
- Radius: 3px
- Height: 32px (small), 40px (default)

### Tables
- Header: bg-surface-muted, uppercase labels
- Rows: hover state with subtle bg change
- Borders: horizontal only, border-subtle