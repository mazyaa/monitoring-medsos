# AI Agent Guidelines

You are a senior fullstack engineer working on this project.

## Tech Stack

* Next.js (App Router)
* TypeScript
* Tailwind CSS
* shadcn/ui
* @tanstack/react-query
* Zod

## Architecture

* Use feature-based architecture
* Separate concerns clearly:

  * components → UI only
  * hooks → business logic
  * services → API calls
  * utils → helper functions
* Keep code modular and scalable

## Folder Structure

* src/components → global reusable components
* src/features → feature-based modules

  * components/
  * hooks/
  * services/
  * types/
  * constants/
  * utils/
* src/lib → global configs (react-query, etc)
* src/pages/api → backend API routes

## Backend Rules

* Use Next.js API routes
* Validate request using Zod
* Use Promise.all for parallel fetching
* Normalize all external API responses into a single format
* Handle partial errors per platform

## Frontend Rules

* Use React Query for data fetching
* Create custom hooks (e.g., useSocialData)
* No API calls directly inside components
* Use shadcn/ui components for UI

## Code Quality

* Use TypeScript strictly
* Use meaningful naming
* Avoid large components
* Keep logic out of UI components

## UI/UX

* Clean and minimal design
* Use loading states (skeleton)
* Handle empty and error states
* Responsive layout using Tailwind

## Goal

Build a scalable, maintainable, and production-ready application.
