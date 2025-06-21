# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 kanban application bootstrapped with `create-next-app`, using the App Router architecture. The project is set up with TypeScript, Tailwind CSS v4, and ESLint.

## Key Technologies

- **Next.js 15** with App Router (`app/` directory structure)
- **React 19** with TypeScript
- **Tailwind CSS v4** with PostCSS integration
- **Lucide React** for icons
- **Class Variance Authority** and **clsx/tailwind-merge** for conditional styling
- **ESLint** for code quality

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

The development server runs on http://localhost:3000.

## Project Structure

- `app/` - Next.js App Router directory containing pages and layouts
  - `layout.tsx` - Root layout with Geist font configuration
  - `page.tsx` - Home page component
  - `globals.css` - Global styles with Tailwind directives
- `public/` - Static assets (SVG icons)
- Configuration files:
  - `tailwind.config.js` - Tailwind CSS configuration with dark mode support
  - `postcss.config.js` - PostCSS configuration
  - `next.config.ts` - Next.js configuration
  - `tsconfig.json` - TypeScript configuration
  - `eslint.config.mjs` - ESLint configuration

## Architecture Notes

- Uses App Router with React Server Components by default
- Font optimization via `next/font` with Geist Sans and Geist Mono
- Dark mode support configured in Tailwind with class-based switching
- Component styling uses utility classes with Tailwind CSS
- SVG assets are optimized through Next.js `<Image>` component

## Development Workflow

When making changes:
1. Run `npm run lint` to check code quality
2. The development server provides hot reloading for immediate feedback
3. Components should follow the existing patterns in `app/page.tsx`
4. Use TypeScript for type safety
5. Follow the existing Tailwind CSS utility patterns for styling