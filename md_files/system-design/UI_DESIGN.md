# Taaleem CS EMR — UI Design System

> Document version: 1.0 · Last updated: February 2026

---

## 1. Design Philosophy

The UI follows a **high-density, card-based dashboard** aesthetic inspired by modern SaaS analytics platforms. Every page in the application shares a consistent visual language: soft white cards on a subtle gray canvas, generous white space, and vibrant but not overwhelming accent colours.

Key principles:

| Principle | Implementation |
|-----------|---------------|
| **Clarity** | Clear typographic hierarchy using Inter font; bold headings, muted labels |
| **Card-based layout** | Every data group lives in a `rounded-2xl` white card with a soft border |
| **Responsive first** | Mobile-first grid breakpoints (`sm`, `md`, `lg`, `xl`) via Tailwind CSS |
| **Consistent colour** | A unified palette derived from Tailwind's `slate`, `blue`, `indigo`, `emerald` scales |
| **Accessibility** | Focus rings (`focus:ring-2`), semantic HTML, ARIA labels on interactive elements |

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 14.2.x |
| Language | TypeScript (strict mode) | 5.3.x |
| UI Library | React | 18.2.x |
| Styling | Tailwind CSS | 3.4.x |
| Icons | Lucide React | 0.563.x |
| Charts | Recharts | 2.10.x |
| Font | Inter (Google Fonts, loaded via `next/font`) | — |

### Tailwind Configuration

```
tailwind.config.js
├─ content: ['./app/**', './components/**', './pages/**']
├─ theme.extend.colors.primary: sky-blue scale (#0ea5e9 centre)
└─ plugins: [] (no third-party plugins)
```

### Global Styles (`app/globals.css`)

- Tailwind directives: `@tailwind base; @tailwind components; @tailwind utilities;`
- Body background: `#f9fafb` (`gray-50`)
- Print media query: hides sidebar/header, adjusts margins for report printing
- Box-sizing: `border-box` globally

---

## 3. Layout Architecture

### 3.1 Root Layout (`app/layout.tsx`)

- Loads the **Inter** font via `next/font/google`
- Sets `<html lang="en">` and applies the font class to `<body>`
- Metadata: title "Taaleem Clinic Management", SVG icon

### 3.2 Application Shell (`components/Layout.tsx`)

The `Layout` component wraps every authenticated page and provides:

| Feature | Details |
|---------|---------|
| **Sidebar** | Collapsible left nav — 64 px collapsed, 256 px expanded. Contains branded logo ("EMR"), nav items with icons & colour-coded active states, and a logout button. |
| **Top Header** | Full-width bar with page title "Taaleem CS EMR", hamburger toggle, breadcrumb area, and contextual action buttons. |
| **Session Timeout** | 30-minute inactivity timer with a 60-second warning modal before auto-logout. |
| **Mobile Drawer** | On screens < 768 px, sidebar becomes an overlay drawer toggled by hamburger icon. |

The sidebar navigation items are colour-coded per module:

| Module | Icon Colour | Active Background |
|--------|------------|-------------------|
| Dashboard | Blue | `bg-blue-50` |
| Schools | Violet | `bg-violet-50` |
| Students | Emerald | `bg-emerald-50` |
| Assessments | Amber | `bg-amber-50` |
| Health Records | Rose | `bg-rose-50` |
| HL7 Messages | Cyan | `bg-cyan-50` |
| Users | Indigo | `bg-indigo-50` |
| Import | Teal | `bg-teal-50` |
| Analytics | Fuchsia | `bg-fuchsia-50` |
| Admin | Slate | `bg-slate-100` |

### 3.3 Breadcrumb (`components/Breadcrumb.tsx`)

A reusable breadcrumb component using `<nav aria-label="Breadcrumb">` with `>` chevron separators. Accepts an array of `{ label, href? }` items.

---

## 4. Component Library

### 4.1 Shared Components

| Component | Path | Purpose |
|-----------|------|---------|
| `Layout` | `components/Layout.tsx` | App shell — sidebar, header, session management |
| `NavItem` | `components/NavItem.tsx` | Single sidebar navigation link with icon + tooltip |
| `Breadcrumb` | `components/Breadcrumb.tsx` | Hierarchical page navigation |
| `PainScaleSelector` | `components/PainScaleSelector.tsx` | 0–5 emoji face selector with colour-coded feedback |
| `SidebarIcons` | `components/SidebarIcons.tsx` | SVG icon set used by the sidebar |

### 4.2 Inline Components (per page)

Many pages define small inline components or helpers:

- **`VitalCard`** (`app/visits/new/page.tsx`) — Card tile for a single vital sign input with icon, label, and unit
- **`KpiCard`** / **`ModuleCard`** (`app/admin/page.tsx`) — Stat cards with trend indicators and sparklines
- **`ProgressRing`** / **`Sparkline`** (`app/analytics/page.tsx`) — SVG data-viz micro-components

---

## 5. Page-by-Page UI Structure

### 5.1 Global Clinic Dashboard (`/dashboard`)

- **4 KPI stat cards** (Schools, Students, Assessments, Referrals) in a `grid-cols-4` ribbon
- **System Status** card (1/3) + **Command Centre** grid (2/3) in a middle row
- **Charts row**: Visit Trends (area chart, daily/weekly toggle) + Visit Types (donut chart)
- **Live Clinic Feed** (2/3) + **Reports & Analytics** sidebar (1/3) in the bottom row

### 5.2 Admin Command Centre (`/admin`)

- Performance cards with sparklines and trend badges
- System Status panel (Malaffi Integration, HL7 Server, Compliance) with pulsing live dots
- Quick-action grid linking to sub-admin pages
- Live Clinic Feed showing recent audit logs and security events

### 5.3 Health Analytics (`/analytics`)

- Date-range filter bar with export buttons (PDF, CSV, Print)
- Two-row chart grid: Visit Trends (area), Visit Types (donut), Monthly Comparison (bar), School Comparison
- Data table with pagination, search, and column sorting

### 5.4 Assessment / Visit List (`/visits`)

- Tabbed interface: All Records, Today, Follow-ups, Sent Home/Hospital
- 3 clinic stat cards (Visits Today, In Clinic, Sent Home)
- Advanced filter bar (search, date range, visit type, outcome)
- Data grid with outcome pill badges, quick-view modal, print action

### 5.5 New Assessment (`/visits/new`)

- **Two-column layout** (70% form / 30% sidebar)
- **Card 1 – Visit Details**: School, Student (searchable dropdown), Visit Type, Chief Complaint
- **Card 2 – Vital Signs**: 3-column sub-grid with icon-labelled input tiles
- **Card 3 – Assessment & Notes**: Complaint textarea with quick-add chips, Pain Scale (emoji selector), Diagnosis with common-diagnoses dropdown, Treatment, Notes
- **Card 4 – Vision & Health Record**: Eye acuity selects, colour blindness, corrective lenses
- **Sidebar**: Patient Snapshot (allergies, conditions, medications, stats), Recent History timeline
- **Fixed footer bar**: Cancel (ghost) + Save Assessment (primary blue)

### 5.6 Schools (`/schools`)

- Card grid layout (one card per school)
- Each card shows status badge, address, phone, email, principal, quick-action buttons

### 5.7 Students (`/students`)

- Search bar + table grid with student cards
- Inline "New Assessment" action per student row

### 5.8 Other Pages

- `/health-records` — List + detail pages for health record management
- `/hl7` — HL7 message log with status filtering
- `/users` — User management table
- `/import/*` — CSV import wizards for students, visits, assessments, users, health records
- `/settings/mfa` — MFA setup with QR code display
- `/login` — Centred login card with MFA support

---

## 6. Design Tokens

### 6.1 Colour Palette

| Token | Tailwind Class | Hex | Usage |
|-------|---------------|-----|-------|
| Primary | `blue-600` | `#2563eb` | Action buttons, focus rings, links |
| Primary Light | `blue-50` | `#eff6ff` | Hover states, active backgrounds |
| Surface | `white` | `#ffffff` | Card backgrounds |
| Canvas | `gray-50` | `#f9fafb` | Page background |
| Border | `gray-200` | `#e5e7eb` | Card borders, dividers |
| Text Primary | `gray-900` | `#111827` | Headings, body text |
| Text Secondary | `slate-500` | `#64748b` | Labels, muted text |
| Success | `emerald-500` | `#10b981` | Status badges, positive indicators |
| Warning | `amber-500` | `#f59e0b` | Warning badges |
| Danger | `rose-500` | `#f43f5e` | Error states, allergy highlights |

### 6.2 Typography Scale

| Element | Class | Size |
|---------|-------|------|
| Page title | `text-2xl font-bold` | 24 px |
| Section heading | `text-sm font-semibold` | 14 px |
| Body text | `text-sm` | 14 px |
| Label (uppercase) | `text-[11px] font-semibold uppercase tracking-wide` | 11 px |
| Micro text | `text-[10px]` | 10 px |

### 6.3 Spacing & Radius

| Token | Value |
|-------|-------|
| Card padding | `p-5` or `p-6` (20–24 px) |
| Card radius | `rounded-2xl` (16 px) |
| Input radius | `rounded-xl` (12 px) |
| Pill/chip radius | `rounded-full` |
| Grid gap | `gap-4` to `gap-6` (16–24 px) |

### 6.4 Shadows & Effects

| Effect | Usage |
|--------|-------|
| `shadow-sm` | Cards, elevated surfaces |
| `shadow-lg shadow-blue-500/30` | Floating action buttons |
| `backdrop-blur-sm` | Modal overlays |
| `focus:ring-2 focus:ring-blue-500/40` | Input focus state |
| `transition-colors` | Button/link hover transitions |

---

## 7. Responsive Breakpoints

| Breakpoint | Width | Behaviour |
|-----------|-------|-----------|
| Default | < 640 px | Single column, sidebar hidden, hamburger menu |
| `sm` | ≥ 640 px | 2-column grids |
| `md` | ≥ 768 px | Sidebar visible (collapsed) |
| `lg` | ≥ 1024 px | Full multi-column layouts |
| `xl` | ≥ 1280 px | 3-column vital signs grid, wider data tables |

---

## 8. Print Styles

The `globals.css` includes `@media print` rules that:

- Hide sidebar, header, and elements with `print:hidden`
- Remove background colours (enable exact colour reproduction)
- Prevent page-breaks inside chart wrappers and table rows
- Reset main content margin/padding for clean A4 output

