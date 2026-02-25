# Changelog — Plataforma Bíblica Online

All completed development phases and tasks are logged here in reverse chronological order.

---

## [UI] — Botão "Inscrever-se" integrado ao tema do painel
**Date:** 2026-02-25

### Updated
- `src/pages/member/CourseDetailPage.tsx` — Botão "Inscrever-se" alterado de `bg-amber-400` para `bg-slate-800 border-slate-700 text-slate-300`, alinhado com a paleta dos ícones do painel.

---

## [UX] — Saudação personalizada + ajuste de alturas mobile
**Date:** 2026-02-25

### Added
- `src/pages/member/DashboardPage.tsx` — `getGreeting()` helper returns "Bom dia", "Boa tarde" ou "Boa noite" conforme o horário. Saudação exibida no topo do dashboard como "Boa tarde, / João".

### Updated
- `src/components/ui/AnnouncementsCarousel.tsx` — Altura mobile ajustada: `h-80` (320px).
- `src/components/ui/VerseOfDay.tsx` — Altura mobile reduzida para `h-48` (192px), criando contraste visual com os Avisos no mobile.

---

## [Layout] — Desktop Hero: Avisos + Versículo do Dia lado a lado
**Date:** 2026-02-25

### Updated
- `src/pages/member/DashboardPage.tsx` — Wrapped `AnnouncementsCarousel` and `VerseOfDay` in a single `grid grid-cols-1 lg:grid-cols-[5fr_3fr] lg:h-80 gap-4` div so both cards appear side-by-side at equal height on desktop (≥1024px), stacked on mobile.
- `src/components/ui/AnnouncementsCarousel.tsx` — Outer div height changed from `h-80` to `h-72 md:h-80 lg:h-full` so it fills the grid cell on desktop.
- `src/components/ui/VerseOfDay.tsx` — Outer div height changed from `h-64` to `h-64 lg:h-full` so it fills the grid cell on desktop.

---

## [Feature] — Versículo do Dia
**Date:** 2026-02-25

### Added
- `convex/schema.ts` — New `dailyVerses` table: `reference`, `text`, `imageUrl` (optional), `date` (YYYY-MM-DD), `active`, indexed `by_date`.
- `convex/dailyVerses.ts` — `getToday` (matches today's date, falls back to most recent active), `listAll`, `create`, `update`, `remove`.
- `src/components/ui/VerseOfDay.tsx` — Card component: full-bleed background image (or slate gradient fallback), dark overlay, "Versículo do Dia" label, reference in bold, verse text. Returns null when no active verse exists.
- `src/pages/admin/AdminVersesPage.tsx` — Admin page at `/admin/versiculo`: table list, inline create/edit form with reference, text, image URL, date picker, active toggle.

### Updated
- `src/pages/member/DashboardPage.tsx` — `VerseOfDay` added between Avisos and Meus Cursos, wrapped in `SectionGuard`.
- `src/components/admin/AdminSidebar.tsx` — Added "Versículo" nav item (book icon, `/admin/versiculo`).
- `src/App.tsx` — Added `/admin/versiculo` route.

---

## [Feature] — Announcements Gallery Carousel on Dashboard
**Date:** 2026-02-25

### Added
- `convex/schema.ts` — New `announcements` table: `title`, `description` (optional), `imageUrl`, `linkUrl` (optional), `active` (boolean), `createdAt` (number), indexed `by_createdAt`.
- `convex/announcements.ts` — New file with 5 backend functions: `list` (active-only, desc order, public), `listAll` (all, admin use), `create` (admin-only mutation), `update` (admin-only mutation), `remove` (admin-only mutation).
- `src/components/ui/AnnouncementsCarousel.tsx` — New carousel component: queries `api.announcements.list`, renders a horizontal scroll row of announcement cards (`w-72`, image top + title/description bottom). Wraps cards in `<a>` when `linkUrl` is set. Returns `null` when no active announcements exist.
- `src/pages/admin/AdminAnnouncementsPage.tsx` — New admin management page at `/admin/anuncios`: lists all announcements with thumbnail, title, active toggle, inline edit form, and delete. Uses `AdminLayout`.

### Updated
- `src/pages/member/DashboardPage.tsx` — `AnnouncementsCarousel` added as the **first section** inside the main content div, wrapped in `SectionGuard`.
- `src/components/admin/AdminSidebar.tsx` — Added "Anúncios" nav item (megaphone icon, `/admin/anuncios`) between "Cursos" and "Membros".
- `src/App.tsx` — Imported `AdminAnnouncementsPage`; added `/admin/anuncios` route inside the `AdminLayout` route guard.

---

## [Improvement] — Ranking Preview on Dashboard
**Date:** 2026-02-25

### Updated
- `src/pages/member/DashboardPage.tsx` — Added `LeaderboardPreviewSection` component: shows top-3 podium cards (gold/silver/bronze) with avatar, level name, XP, and streak. Current user's card is highlighted with an amber ring. A "Ver ranking completo →" button links to `/ranking`. Section is wrapped in `SectionGuard` and placed above the Comunidade banner.

---

## [Feature] — Ranking Page (Community Leaderboard)
**Date:** 2026-02-25

### Added
- `convex/users.ts` — `listLeaderboard` query: returns all users sorted by `xp` descending, exposing only display-safe fields (`_id`, `name`, `imageUrl`, `xp`, `level`, `streak`, `role`).
- `src/pages/member/RankingPage.tsx` — New leaderboard page: trophy icon header, top-3 podium cards with gold/silver/bronze medal treatment and larger avatars, full ranked list for positions 4+, current user row highlighted with amber left border + `bg-amber-400/5`. Level names from `getLevelInfo` shown on every row. Streak shown as `🔥` counter.
- Route `/ranking` in `src/App.tsx` inside `ProtectedLayout`.

### Updated
- `src/components/ui/Navbar.tsx` — Added "Ranking" nav link after "Comunidade" in the hamburger drawer, with amber active-state styling.

---

## [Feature] — Reddit-style Community Forum (Thread Detail Pages)
**Date:** 2026-02-25

### Added
- `src/pages/member/CommunityPostPage.tsx` — New discussion thread detail page: shows full post body, author info, pinned badge, admin pin/unpin + delete actions, all replies listed, and a reply form at the bottom. Uses `useParams` for `postId`, fetches via `api.forum.getPost` and `api.forum.getReplies`. Deleting the post navigates back to `/comunidade`.
- Route `/comunidade/:postId` in `src/App.tsx` pointing to `CommunityPostPage`, nested inside `ProtectedLayout`.

### Updated
- `src/components/ui/ForumSection.tsx` — Removed accordion/expand logic and `PostReplies` sub-component. `PostCard` is now a clickable feed row that navigates to `/comunidade/:postId`; body is truncated to 2 lines (`line-clamp-2`). Admin pin/delete buttons use `e.stopPropagation()` to avoid triggering navigation. Reply count button also navigates to the thread. New post form and sorted order (pinned first, then newest) are unchanged.

---

## [Improvement] — Robust Seed Database for UI Testing
**Date:** 2026-02-25

### Updated
- `convex/seed.ts` — Expanded seed to cover every major UI state:
  - **Cleanup**: Badge purge added at top of cleanup block (deletes all `userBadges` and `badges` before re-seeding).
  - **Videos**: Replaced 10 fake sequential-pattern video IDs with real BibleProject YouTube IDs for Família, Apocalipse, and Introdução à Teologia; added 4 new Salmos video IDs for Course 8.
  - **Members**: Ana's XP bumped to 220; added 3 new seed members — Lúcia (xp 420, level 3), Rafael (xp 90, level 1), Beatriz (xp 680, level 4).
  - **Badges**: New section creates 3 badges — Primeiros Passos, Estudante Dedicado, Buscador da Palavra.
  - **Course 1**: Added `welcomeVideoUrl`; captured 4th lesson as `c1m2l2` for progress tracking.
  - **Course 2**: Captured 4th lesson as `c2m2l2`.
  - **Course 3**: Added `welcomeVideoUrl` (reuses `ora_porque` video).
  - **Course 8 (NEW)**: Draft course "Salmos: Orações de Israel" by Pastor Carlos — 2 modules, 4 lessons, 1 quiz.
  - **Enrollments**: Replaced block — 10 enrollments covering fully-complete, in-progress, and zero-progress states across all 5 seed members.
  - **Progress**: Replaced block — Ana completes all 4 Course 1 lessons (fully-completed course); 1 lesson in Course 3 (in-progress); Courses 4 & 5 at zero progress. Pedro completes Course 2 Module 1 + first lesson of Course 5.
  - **Lesson Comments**: New section — 6 comments across 3 lessons with pastor replies (threaded).
  - **User Badges**: New section — Ana gets all 3 badges, Pedro gets 1, Beatriz gets 2.
  - **Return string**: Updated to reflect new counts (5 members, 7 published + 1 draft, 10 enrollments, 8 progress records, 3 badges, 6 comments).

---

## [Improvement] — Hamburger Menu Navbar
**Date:** 2026-02-24

### Updated
- `src/components/ui/Navbar.tsx` — Full rewrite: removed inline nav links from the header bar; header now shows only logo + UserButton + hamburger icon. Clicking the hamburger opens a right-anchored slide-in drawer (`w-64`, `duration-300` transition) with a dark backdrop. Drawer contains vertical nav links — Painel, Comunidade, and role-based links (Admin for admins, Meu Painel for pastors). Active route is highlighted in amber. Clicking any link or the backdrop closes the drawer.

---

## [Feature] — Section Icons, Meus Cursos & Enrollment
**Date:** 2026-02-24

### Added
- `enrollments` table in schema (userId, courseId, enrolledAt with indexes)
- `convex/enrollments.ts` — `enroll` mutation, `isEnrolled` query, `getMyEnrolledCourses` query
- YouTube Shorts-style section headers with amber badge + SVG icon for Pastores, Cursos, and Meus Cursos
- "Meus Cursos" section on DashboardPage — shows enrolled courses in a horizontal scroll (appears only when there are enrollments)
- "Inscrever-se" / "Inscrito ✓" button on CourseDetailPage header
- `SectionGuard` React error boundary — silently hides new sections if Convex functions aren't deployed yet

---

## [Feature] — Pastor Profile: Bio, Social Links & Course Gallery
**Date:** 2026-02-24

### Added
- `socialLinks` object field to `users` schema (instagram, youtube, facebook, twitter, website — all optional)
- `updatePastorProfile` mutation in `convex/users.ts` — saves bio + social links in one call
- Social link icon badges (Instagram, YouTube, Facebook, Twitter/X, Globe) on the pastor profile page header
- Dedicated "Sobre" bio card on the profile page
- Horizontal-scroll course gallery (matching Dashboard style) replacing the grid layout

### Updated
- `AdminMembersPage` — pastor rows now show bio textarea + 5 social link URL inputs with a single "Salvar perfil" button
- `PastorProfilePage` — restructured layout: header → bio card → course scroll

---

## [Feature] — Pastor Profile Page
**Date:** 2026-02-24

### Added
- `bio: v.optional(v.string())` field to `users` table in `convex/schema.ts`
- `getById` query and `updateBio` mutation in `convex/users.ts`
- New page `src/pages/member/PastorProfilePage.tsx` — shows pastor avatar, name, bio, and their published courses
- Route `/pastores/:pastorId` added to `src/App.tsx` inside the protected layout

### Updated
- `src/components/ui/PastorCard.tsx` — now a clickable `<Link>` that navigates to the pastor profile page; accepts `_id` prop
- `src/pages/member/DashboardPage.tsx` — passes `_id` to `PastorCard`
- `src/pages/admin/AdminMembersPage.tsx` — adds inline bio textarea + "Salvar" button for pastor/admin rows

---

## [Improvement] — Remove CoursesPage, Badges & Fix Back Navigation
**Date:** 2026-02-24

### Updated
- `src/components/ui/NetflixCourseCard.tsx` — Removed `pastorLabel` amber pill badge and prop entirely
- `src/pages/member/CourseDetailPage.tsx` — "Voltar" link now points to `/painel` instead of `/cursos`
- `src/components/ui/Navbar.tsx` — Removed "Cursos" nav link (pointed to removed `/cursos` route)
- `src/App.tsx` — Removed `/cursos` route and `CoursesPage` import
- `src/pages/member/DashboardPage.tsx` — Removed `pastorLabel` prop from `NetflixCourseCard` usage

---

## [Improvement] — Sophisticated Gallery Redesign (NetflixCourseCard)
**Date:** 2026-02-24

### Updated
- `src/components/ui/NetflixCourseCard.tsx` — Full rewrite to premium shadcn-inspired design:
  - Fixed card size `w-[280px] h-[400px]`; `rounded-2xl overflow-hidden`
  - Full-bleed image fills entire card height via `object-cover`
  - Deep gradient overlay `from-black via-black/60 to-transparent` for text readability
  - New optional `pastorLabel` prop: small amber pill badge at top-left
  - Arrow icon (`→`) at bottom-right, fades in on hover (`opacity-0 → opacity-100`)
  - Hover: `scale-[1.03]` + `ring-2 ring-amber-400/50` + `shadow-2xl shadow-black/60`
  - Fallback (no thumbnail): slate-800 bg + centered book SVG + title overlay retained
- `src/pages/member/DashboardPage.tsx` — Scroll row improvements:
  - Added `[&::-webkit-scrollbar]:hidden` to hide scrollbar cleanly
  - Changed `gap-4` → `gap-5`; added `py-1` to give hover ring room at card edges
  - Passes `pastorLabel={pastor.name}` to each `NetflixCourseCard`

---

## [Feature] — Dashboard Netflix Redesign + Pastor Avatars
**Date:** 2026-02-24

### Added
- `convex/schema.ts` — Added `imageUrl: v.optional(v.string())` to the `users` table for storing Clerk avatar URLs
- `convex/users.ts` — Updated `getOrCreateUser` to accept and patch `imageUrl` on every login (keeps Clerk avatar fresh); added `listPastors` query (returns all users with `role === "pastor"`)
- `src/components/UserSync.tsx` — Now passes `imageUrl: user.imageUrl` to `getOrCreateUser` on each auth sync
- `src/components/ui/NetflixCourseCard.tsx` — New fixed-width (256px) card with 16:9 thumbnail, gradient overlay, title on bottom, hover scale + amber glow; used in dashboard Netflix rows
- `src/components/ui/PastorCard.tsx` — New circular avatar card (60px) with Clerk image or initial-letter fallback; used in Pastores section

### Updated
- `src/pages/member/DashboardPage.tsx` — Full redesign: replaced 3-column course grid with:
  - **Pastores** section: horizontal scroll of `PastorCard` components (all pastors)
  - **Cursos** section: one labeled Netflix row per pastor who has ≥1 published course; "Outros Cursos" row for legacy/admin courses (no `createdBy` or creator not a pastor)
  - Forum section retained at bottom

---

## [Improvement] — Navbar Panel Links for Admin and Pastor
**Date:** 2026-02-24

### Updated
- `src/components/ui/Navbar.tsx` — Added role-aware nav links: admins see an "Admin" link to `/admin/cursos`; pastors see "Meu Painel" link to `/pastor/cursos` (already existed, now admin link added alongside it)

---

## [Feature] — Pastor Role (3-Role RBAC)
**Date:** 2026-02-24

### Added
- `convex/schema.ts` — Added `"pastor"` to the `role` union on the `users` table; added `createdBy: v.optional(v.id("users"))` to the `courses` table for ownership tracking
- `convex/users.ts` — `updateRole` mutation now accepts `"admin" | "pastor" | "member"`
- `convex/courses.ts` — Added `listMyCourses` query (filters by `createdBy`); updated `createCourse` to accept `createdBy`; added ownership guard to `updateCourse` and `deleteCourse` (admin or course owner can edit/delete)
- `src/components/pastor/PastorLayout.tsx` — Two-column layout for the pastor panel (sidebar + content)
- `src/components/pastor/PastorSidebar.tsx` — Sidebar with "Meus Cursos" nav link and member area link
- `src/pages/pastor/PastorCoursesPage.tsx` — Pastor's scoped course list (only their own courses via `listMyCourses`)
- `src/pages/pastor/PastorCourseEditorPage.tsx` — Course/module/lesson editor wrapped in `PastorLayout`
- `src/pages/pastor/PastorQuizBuilderPage.tsx` — Quiz builder wrapped in `PastorLayout`

### Updated
- `src/App.tsx` — Added `PastorLayout` route guard (allows `admin` or `pastor`); added `/pastor/cursos`, `/pastor/cursos/:courseId`, and `/pastor/cursos/:courseId/aulas/:lessonId/quiz` routes
- `src/pages/admin/AdminMembersPage.tsx` — Replaced toggle button with a `<select>` dropdown for 3-role assignment (Membro / Pastor / Admin); updated role badge colors (amber for Pastor, purple for Admin)
- `src/pages/admin/AdminCoursesPage.tsx` — Passes `createdBy: me._id` on course creation and `requesterId: me._id` to update/delete mutations
- `src/components/ui/ForumSection.tsx` — `meRole` type extended to include `"pastor"`; `RoleBadge` now shows amber "Pastor" badge for pastor role
- `src/components/ui/LessonComments.tsx` — Same `meRole` and `RoleBadge` updates for pastor badge
- `src/components/ui/Navbar.tsx` — Added "Meu Painel" link (visible only to users with `role === "pastor"`) pointing to `/pastor/cursos`

---

## [Improvement] — Sign-In Page: Bible Background Image
**Date:** 2026-02-24

### Updated
- `src/pages/SignInPage.tsx` — Added `bible-bg.jpg` as a decorative background image with `opacity-20`, using a relative wrapper + absolutely positioned `<img>` pattern; content div elevated with `relative z-10` to sit above the background

---

## [Improvement] — Auth Pages: Logo & Portuguese Localization
**Date:** 2026-02-24

### Updated
- `src/pages/SignInPage.tsx` — Replaced "Plataforma Bíblica" heading with the logo image (`/logo-resenha.png`)
- `src/pages/SignUpPage.tsx` — Same logo replacement
- `src/main.tsx` — Added `ptBR` localization from `@clerk/localizations` to `ClerkProvider`, so the Clerk widget renders in Portuguese
- Installed `@clerk/localizations` package

---

## [Feature] — Anti-Skip Video Enforcement
**Date:** 2026-02-23

### Updated
- `src/components/ui/YouTubePlayer.tsx` — Re-added anti-skip enforcement: tracks a `maxReachedRef` high-water mark; if the player's current time jumps more than 2 seconds ahead of that mark, it seeks back to the max reached position. Progress bar reflects the furthest point watched, not current position. Interval polling changed from 1s to 500ms for tighter enforcement.

---

## [Feature] — Comments & Community Forum
**Date:** 2026-02-23

### Convex Schema — New Tables
- `comments` — lesson-scoped Q&A comments with optional `parentId` for threading; indexes `by_lessonId`, `by_parentId`
- `forumPosts` — community-wide posts with `pinned` flag; index `by_createdAt`
- `forumReplies` — replies to forum posts; index `by_postId`

### Convex Backend
- `convex/comments.ts` — `getCommentsByLesson`, `getReplies`, `addComment`, `deleteComment` (author or admin only)
- `convex/forum.ts` — `getPosts` (with reply count), `getPost`, `getReplies`, `createPost`, `addReply`, `deletePost`, `deleteReply`, `togglePin` (admin only)

### New Components
- `src/components/ui/LessonComments.tsx` — Threaded comment component for lessons: top-level comments + one level of replies, delete button (author/admin), author role badge (Professor for admins)
- `src/components/ui/ForumSection.tsx` — Full community forum: create post, reply inline, pin/unpin (admins), delete (author/admin), pinned posts bubble to top

### Pages Updated
- `LessonPage.tsx` — `LessonComments` rendered below the quiz section
- `DashboardPage.tsx` — `ForumSection` rendered at the bottom of the main page

---

## [Phase 3] — Admin Panel
**Date:** 2026-02-23

### Convex Backend — New Functions
- `convex/users.ts` — added `listAll`, `updateRole`
- `convex/courses.ts` — added `listAll` (returns all courses regardless of status)
- `convex/modules.ts` — added `updateModule`, `deleteModule`
- `convex/lessons.ts` — added `updateLesson`, `deleteLesson`
- `convex/quizzes.ts` — added `upsertQuiz` (create or update), `deleteQuiz`
- `convex/progress.ts` — added `getProgressByUser`

### Routing
- `App.tsx` — Added `AdminLayout` role guard (redirects non-admins to `/painel`)
- Admin routes: `/admin/cursos`, `/admin/cursos/:courseId`, `/admin/cursos/:courseId/aulas/:lessonId/quiz`, `/admin/membros`

### Admin Components
- `src/components/admin/AdminSidebar.tsx` — Sidebar with Cursos / Membros nav, UserButton, link to member area
- `src/components/admin/AdminLayout.tsx` — Shared layout wrapper (sidebar + main content + title/actions slot)

### Admin Pages
- `src/pages/admin/AdminCoursesPage.tsx` — List all courses with status toggle (draft/published), inline create form, edit and delete actions
- `src/pages/admin/AdminCourseEditorPage.tsx` — Edit course info, manage modules (add/rename/delete), manage lessons per module (add/edit/delete), link to quiz builder per lesson
- `src/pages/admin/AdminMembersPage.tsx` — Table of all members with name, email, level, XP, streak, role; search filter; toggle admin/member role
- `src/pages/admin/AdminQuizBuilderPage.tsx` — Dynamic quiz builder: add/remove questions, 4 options per question, click to set correct answer, upsert saves to Convex

---

## [Phase 2] — Member UI
**Date:** 2026-02-23

### Convex Backend Functions
- `convex/users.ts` — `getOrCreateUser`, `getMe`, `updateXPAndLevel` (with streak logic)
- `convex/courses.ts` — `listPublished`, `getCourse`, `createCourse`, `updateCourse`, `deleteCourse`
- `convex/modules.ts` — `getModulesByCourse`, `createModule`
- `convex/lessons.ts` — `getLessonsByModule`, `getLesson`, `createLesson`
- `convex/quizzes.ts` — `getQuizByLesson`, `createQuiz`
- `convex/progress.ts` — `getMyProgress`, `getLessonProgress`, `completeLesson` (XP + level + streak)

### Routing & Auth
- Installed `react-router-dom`
- `App.tsx` — Full route tree with `ProtectedLayout` guard (redirects unauthenticated users to `/entrar`)
- Portuguese routes: `/entrar`, `/cadastro`, `/painel`, `/cursos`, `/cursos/:courseId`, `/cursos/:courseId/aulas/:lessonId`

### Pages
- `src/pages/SignInPage.tsx` — Clerk sign-in component, dark themed
- `src/pages/SignUpPage.tsx` — Clerk sign-up component, dark themed
- `src/pages/member/DashboardPage.tsx` — XP, level, streak, CTA to courses
- `src/pages/member/CoursesPage.tsx` — Grid of published courses
- `src/pages/member/CourseDetailPage.tsx` — Course detail with module/lesson list, lock icons, progress indicators
- `src/pages/member/LessonPage.tsx` — YouTube embed player + multiple choice quiz + XP reward on completion

### Components
- `src/components/UserSync.tsx` — Syncs Clerk user to Convex on first login
- `src/components/ui/Navbar.tsx` — Top nav with active link highlighting and Clerk UserButton
- `src/components/ui/XPBar.tsx` — Animated XP progress bar with level labels
- `src/components/ui/LevelBadge.tsx` — Level number + name badge (sm/md/lg sizes)
- `src/components/ui/StreakCounter.tsx` — Daily streak display with flame icon
- `src/components/ui/CourseCard.tsx` — Thumbnail card linking to course detail

### Lib
- `src/lib/levels.ts` — `LEVELS` array, `getLevelInfo(xp)` helper, `extractYouTubeId(url)` helper

---

## [Phase 1] — Project Setup & Schema
**Date:** 2026-02-23

### Project Scaffold
- Vite + React + TypeScript initialized in project root
- `npm` as package manager, Node v24.3.0

### TailwindCSS v4
- Installed `tailwindcss` and `@tailwindcss/vite`
- Configured via `vite.config.ts` plugin
- `src/index.css` uses `@import "tailwindcss"`

### Clerk
- Installed `@clerk/clerk-react`
- `src/main.tsx` wrapped with `ClerkProvider`
- Publishable key via `VITE_CLERK_PUBLISHABLE_KEY` env var

### Convex
- Installed `convex`
- `src/main.tsx` wrapped with `ConvexProviderWithClerk` (unified auth)
- Deployment initialized: `bold-shepherd-678` (team: willly-negreiros)
- `convex/auth.config.ts` — Clerk issuer `https://tough-kodiak-98.clerk.accounts.dev`

### Schema
- `convex/schema.ts` — 8 tables defined:
  - `users` — clerkId, name, email, xp, level, streak, lastActiveDate, role
  - `courses` — title, description, thumbnailUrl, status, createdAt
  - `modules` — courseId, title, order
  - `lessons` — moduleId, title, videoUrl, order
  - `quizzes` — lessonId, questions[]
  - `progress` — userId, lessonId, completed, quizScore, completedAt
  - `badges` — name, description, xpRequired
  - `userBadges` — userId, badgeId, earnedAt

### Folder Structure
```
src/
├── components/ui/
├── components/admin/
├── components/member/
├── pages/admin/
├── pages/member/
├── hooks/
└── lib/
convex/
```

### Support Files
- `.env.local` — Clerk + Convex keys
- `SETUP.md` — Step-by-step dashboard configuration guide

---

## Upcoming

### [Phase 4] — Gamification
- Full XP mutation on completion
- Automatic level calculation
- Streak tracking
- Badge unlock logic
- Community leaderboard
