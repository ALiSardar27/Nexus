# Nexus Platform – Week 1 Implementation

## Project Architecture Overview

### Tech Stack

- React + TypeScript
- Vite
- Tailwind CSS
- React Router

---

## Folder Structure Explanation

### /src/components

Reusable UI components (Buttons, Cards, Navbar, Sidebar).

### /src/pages

Main route-based pages (Login, Dashboard, etc.).

### /src/layouts

Layout wrappers like DashboardLayout.

### /src/context

Global state management (Auth context if exists).

### /src/routes

Application routing configuration.

---

## Routing Flow

main.tsx → App.tsx → Routes → Pages

Authentication-based route rendering (if implemented).

---

## UI Theme Standardization

- Primary Color: #2563EB
- Secondary Color: #9333EA
- Font: Inter
- Responsive Grid: Tailwind Grid System
