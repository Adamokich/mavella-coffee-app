# Frontend Design Guidelines

## 1. Design Principles

- Modern, minimalistic interface
- Dark, warm visual identity
- Mobile-first approach
- Consistent spacing and typography

## 2. Layout

- Application maximum width: 1024px
- Application width: 100%
- Center application horizontally
- Never exceed the maximum width

## 3. Responsive Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1023px
- Desktop: >= 1024px

## 4. Colors

The PWA uses a single warm dark theme. Define and consume all colors through global CSS variables; do not hardcode colors in components.

| Token | Value | Usage |
| --- | --- | --- |
| `--color-background` | `#14100E` | Main application background |
| `--color-surface` | `#211A17` | Raised surfaces |
| `--color-card` | `#2C231E` | Product and content cards |
| `--color-accent` | `#D99A66` | Active controls and primary accents |
| `--color-text` | `#F5EEE7` | Primary text |
| `--color-text-secondary` | `#B5A59A` | Supporting text |
| `--color-inactive` | `#75675F` | Inactive controls and navigation items |
| `--color-border` | `#43352E` | Component borders and separators |

## 5. Typography

Use Inter with Cyrillic support. The base text is 16px, weight 500. Keep a clear visual hierarchy using the following scale:

| Element | Size | Weight |
| --- | --- | --- |
| Main heading | 28px | 700 |
| Section heading | 22px | 700 |
| Product name | 17px | 600 |
| Price | 18px | 700 |
| Button label | 16px | 600 |
| Secondary text | 14px | 400–500 |
| Bottom navigation label | 11–12px | 600 |

## 6. Spacing

- Use a consistent spacing scale
- Avoid arbitrary margins and paddings

## 7. Components

- Reuse shared UI components
- Maintain consistent border radii
- Provide hover, active, disabled states

### Bottom navigation

- Fixed above the bottom safe area, centered, and no wider than 430px.
- Uses a semi-transparent chocolate surface with `backdrop-filter: blur(20px)`.
- Has a 1px `--color-border` border, rounded 28px corners, and a subtle shadow.
- Inactive items use `--color-inactive`; the active tab uses `--color-accent`.

## 8. Accessibility

- Ensure sufficient color contrast
- Support keyboard navigation
- Respect reduced-motion preferences
