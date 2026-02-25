# 📖 Online Biblical Learning Platform — Project Brief

## Tech Stack
- **Frontend:** Vite + React + TypeScript
- **Styling:** TailwindCSS
- **Backend/DB:** Convex DB (backend as a service, realtime)
- **Auth:** Clerk

---

## Claude Code Prompt

> You are helping me build a full-stack web application from scratch. Follow these instructions carefully and build step by step.
>
> **Project: Online Biblical Learning Platform for Church**
>
> **Tech Stack:**
> - Vite + React + TypeScript
> - TailwindCSS for styling
> - Convex DB for backend, database, and realtime functionality
> - Clerk for authentication
>
> **Start by:**
> 1. Scaffolding the Vite + React + TypeScript project
> 2. Installing and configuring Clerk
> 3. Installing and configuring Convex
> 4. Setting up TailwindCSS
> 5. Creating the folder structure below
>
> **Folder Structure:**
> ```
> src/
> ├── components/
> │   ├── ui/
> │   ├── admin/
> │   └── member/
> ├── pages/
> │   ├── admin/
> │   └── member/
> ├── hooks/
> ├── lib/
> └── convex/
>     ├── schema.ts
>     ├── users.ts
>     ├── courses.ts
>     ├── lessons.ts
>     ├── quizzes.ts
>     └── progress.ts
> ```
>
> **Convex Schema — define these tables in schema.ts:**
> - `users` — clerkId, name, email, xp, level, streak, lastActiveDate, role ("admin" | "member")
> - `courses` — title, description, thumbnailUrl, status ("draft" | "published"), createdAt
> - `modules` — courseId, title, order
> - `lessons` — moduleId, title, videoUrl, order
> - `quizzes` — lessonId, questions (array of: question, options[], correctIndex)
> - `progress` — userId, lessonId, completed, quizScore, completedAt
> - `badges` — name, description, xpRequired
> - `userBadges` — userId, badgeId, earnedAt
>
> **Business Rules to implement:**
> - A member can only unlock the next lesson after completing the current one and submitting the quiz
> - Completing a lesson grants +10 XP
> - Each correct quiz answer grants +5 XP
> - Level is calculated automatically from total XP using this scale:
>   - 0–99 XP = Cordeiro (1)
>   - 100–249 XP = Buscador (2)
>   - 250–499 XP = Discípulo (3)
>   - 500–849 XP = Escriba (4)
>   - 850–1299 XP = Apóstolo (5)
>   - 1300–1849 XP = Ancião (6)
>   - 1850–2499 XP = Levita (7)
>   - 2500–3299 XP = Sacerdote (8)
>   - 3300–4199 XP = Patriarca (9)
>   - 4200+ XP = Ungido (10)
> - Streak increments each consecutive day a member completes at least one lesson
> - Only `admin` role users can access `/admin` routes
>
> **Auth Rules (Clerk):**
> - Protect all routes except `/sign-in` and `/sign-up`
> - After first login, create a user document in Convex if it doesn't exist
> - Sync Clerk user ID with Convex `users.clerkId`
>
> **Do not build the full UI yet. Start with steps 1–5 (setup and schema only) and confirm before proceeding.**

---

## Level System

| Level | Name | XP Required |
|-------|------|-------------|
| 1 | Cordeiro | 0 XP |
| 2 | Buscador | 100 XP |
| 3 | Discípulo | 250 XP |
| 4 | Escriba | 500 XP |
| 5 | Apóstolo | 850 XP |
| 6 | Ancião | 1,300 XP |
| 7 | Levita | 1,850 XP |
| 8 | Sacerdote | 2,500 XP |
| 9 | Patriarca | 3,300 XP |
| 10 | Ungido | 4,200 XP |

---

## Features Overview

### Member Area
- Login/signup via Clerk
- Dashboard with XP, level, streak and overall progress
- List of available courses
- Video player per lesson
- Multiple choice quiz after each lesson
- XP and level progression
- Unlockable badges/achievements
- Daily study streak
- Community leaderboard

### Admin Panel
- Manage members (view, activate/deactivate)
- Create, edit, and delete courses
- Create modules and lessons inside courses
- Upload/link videos per lesson
- Create quizzes (questions + choices + correct answer)
- View member progress and engagement

---

## Next Phase Prompts

### Phase 2 — Member UI
> Now build the member-facing pages: Dashboard, Course List, Course Detail, Lesson Player with video and quiz. Use TailwindCSS. Keep components clean and modular.

### Phase 3 — Admin Panel
> Now build the admin panel pages: Member management, Course management (create/edit/delete), Module and Lesson management, Quiz builder.

### Phase 4 — Gamification
> Now implement the full gamification system: XP mutation on lesson/quiz completion, automatic level calculation, streak tracking with lastActiveDate, badge unlock logic, and leaderboard query.
