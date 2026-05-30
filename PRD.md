# PRD.md — Mơ Digital SAT

> **Document Version:** 1.0.0
> **Status:** Ready for AI Code Generation
> **Last Updated:** 2026-05-30
> **Prepared by:** Product & Architecture Team

---

## Table of Contents

1. [Project Overview & Goals](#1-project-overview--goals)
2. [Tech Stack Directive](#2-tech-stack-directive)
3. [Data Architecture & Models](#3-data-architecture--models)
4. [Detailed Feature Specifications & User Flow](#4-detailed-feature-specifications--user-flow)
   - [Feature 1 — Authentication](#feature-1--authentication)
   - [Feature 2 — SAT Practice (Verbal & Math)](#feature-2--sat-practice-verbal--math)
   - [Feature 3 — History & Review](#feature-3--history--review)
   - [Feature 4 — Vocabulary](#feature-4--vocabulary)
   - [Feature 5 — Leaderboard](#feature-5--leaderboard)
5. [API Contract (REST Endpoints)](#5-api-contract-rest-endpoints)
6. [Technical Directives for AI Coding Assistants](#6-technical-directives-for-ai-coding-assistants)
7. [File & Folder Structure](#7-file--folder-structure)
8. [Non-Functional Requirements](#8-non-functional-requirements)

---

## 1. Project Overview & Goals

### 1.1 Purpose

**Mơ Digital SAT** is a full-stack web application that enables Vietnamese high school students to prepare for the Digital SAT exam. It delivers a structured, distraction-free testing environment modeled after the official College Board **Bluebook** app, combined with vocabulary tools and a gamified point system to sustain motivation.

### 1.2 Core Goals

| # | Goal | Success Metric |
|---|------|----------------|
| G1 | Simulate authentic Digital SAT conditions | Timer, split-screen layout, per-module question count matching real test |
| G2 | Enforce first-attempt-only scoring integrity | `isFirstAttempt` flag prevents score inflation on retakes |
| G3 | Provide transparent progress tracking | History page shows all first attempts with per-question review |
| G4 | Gamify learning via a point leaderboard | `totalPoints` drives weekly engagement |
| G5 | Support active vocabulary acquisition | CRUD vocabulary items with study/flashcard mode |

### 1.3 UI/UX Philosophy

- **Minimalist & Focused:** The test-taking interface must eliminate all chrome, navigation, and distractions. No sidebar, no footer, no ads. Only the passage, the question, and the timer are visible during an active test.
- **Bluebook-Inspired:** The split-screen paradigm (passage left, question right) with a pinned top bar containing a countdown timer and a question navigator is the primary UI pattern for all practice modules.
- **Design System:**
  - **Primary:** `#1A4FA0` (SAT Blue)
  - **Primary Light:** `#EBF2FF`
  - **Accent / CTA:** `#2563EB`
  - **Surface:** `#FFFFFF`
  - **Background:** `#F8FAFC`
  - **Text Primary:** `#0F172A`
  - **Text Secondary:** `#64748B`
  - **Success:** `#16A34A`
  - **Error:** `#DC2626`
  - **Border:** `#E2E8F0`
  - **Font:** `Inter` (body), `DM Sans` (headings/UI chrome)
- **Accessibility:** WCAG 2.1 AA compliance. Minimum tap targets 44×44px. Keyboard-navigable test interface.

---

## 2. Tech Stack Directive

> **Instruction to AI Coding Assistant:** Use the following stack exactly. Do not substitute libraries unless a specified library is unavailable.

| Layer | Technology |
|-------|-----------|
| **Frontend Framework** | Next.js 14 (App Router, TypeScript) |
| **Styling** | Tailwind CSS v3 + shadcn/ui component library |
| **State Management** | Zustand (global) + React Query / TanStack Query v5 (server state) |
| **Backend** | Next.js Route Handlers (`app/api/**`) acting as a REST API |
| **Database ORM** | Prisma v5 |
| **Database** | PostgreSQL (via Supabase or Railway) |
| **Authentication** | NextAuth.js v5 (Auth.js) with Credentials provider (email/password) + Google OAuth |
| **Password Hashing** | bcryptjs |
| **Validation** | Zod (shared between frontend forms and backend Route Handlers) |
| **Testing** | Vitest + React Testing Library |
| **Deployment** | Vercel (frontend + API) + managed PostgreSQL |

---

## 3. Data Architecture & Models

### 3.1 Prisma Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────
// AUTH & USER
// ─────────────────────────────────────────────

model User {
  id            String        @id @default(cuid())
  email         String        @unique
  name          String
  passwordHash  String?       // null for OAuth users
  avatarUrl     String?
  totalPoints   Int           @default(0)  // Calculated field: kept in sync on every first-attempt submission
  role          Role          @default(STUDENT)
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  attempts      TestAttempt[]
  vocabulary    VocabularyItem[]
  accounts      Account[]     // NextAuth OAuth accounts
  sessions      Session[]

  @@index([totalPoints(sort: Desc)])
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum Role {
  STUDENT
  ADMIN
}

// ─────────────────────────────────────────────
// SAT TEST & QUESTIONS
// ─────────────────────────────────────────────

model SatTest {
  id          String        @id @default(cuid())
  title       String        // e.g. "Practice Test 1 — Module 1 Reading & Writing"
  description String?
  subject     Subject       // VERBAL | MATH
  module      Int           // 1 or 2 (SAT is modular adaptive)
  timeLimitSeconds Int      // e.g. 1920 for 32 min (Verbal M1), 2100 for 35 min (Math M1)
  questions   Question[]
  attempts    TestAttempt[]
  createdAt   DateTime      @default(now())
  isPublished Boolean       @default(false)

  @@index([subject, module])
}

enum Subject {
  VERBAL  // Reading & Writing
  MATH
}

model Question {
  id              String         @id @default(cuid())
  satTestId       String
  orderIndex      Int            // 1-based position within the test
  questionType    QuestionType
  domain          String?        // e.g. "Algebra", "Information & Ideas"
  skill           String?        // e.g. "Linear equations in one variable"

  // Passage (optional — Math questions may not have a passage)
  passageText     String?        @db.Text  // Full HTML/Markdown of the reading passage
  passageSource   String?        // Citation / source credit

  // Question stem
  stemText        String         @db.Text  // The actual question text (may contain LaTeX for Math)

  // Answer choices (always 4 for Digital SAT MCQ)
  optionA         String
  optionB         String
  optionC         String
  optionD         String

  correctOption   AnswerOption   // A | B | C | D
  explanation     String?        @db.Text  // Shown in Review Mode

  satTest         SatTest        @relation(fields: [satTestId], references: [id], onDelete: Cascade)
  responses       QuestionResponse[]

  @@index([satTestId, orderIndex])
}

enum QuestionType {
  READING_WRITING   // Verbal passage-based
  MATH_MCQ          // Math multiple choice
  MATH_SPR          // Math student-produced response (grid-in) — future scope
}

enum AnswerOption {
  A
  B
  C
  D
}

// ─────────────────────────────────────────────
// TEST ATTEMPT
// ─────────────────────────────────────────────

model TestAttempt {
  id              String             @id @default(cuid())
  userId          String
  satTestId       String
  isFirstAttempt  Boolean            // TRUE only if this is the user's FIRST attempt on this satTestId
  status          AttemptStatus      @default(IN_PROGRESS)
  score           Int?               // Correct answer count; null until submitted
  pointsAwarded   Int?               // score * 10; null for non-first attempts (always 0)
  startedAt       DateTime           @default(now())
  submittedAt     DateTime?
  timeSpentSeconds Int?              // Total seconds from start to submission

  user            User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  satTest         SatTest            @relation(fields: [satTestId], references: [id])
  responses       QuestionResponse[]

  @@unique([userId, satTestId, isFirstAttempt], name: "unique_first_attempt")
  // Note: The unique constraint on (userId, satTestId, isFirstAttempt=true) is enforced at the
  // application layer (see Section 6), not the DB constraint, to allow multiple non-first attempts.
  @@index([userId, isFirstAttempt])
  @@index([satTestId])
}

enum AttemptStatus {
  IN_PROGRESS
  SUBMITTED
  TIMED_OUT   // Auto-submitted by timer
}

model QuestionResponse {
  id              String        @id @default(cuid())
  attemptId       String
  questionId      String
  selectedOption  AnswerOption?  // null = skipped
  isCorrect       Boolean?       // null = skipped
  timeSpentSeconds Int?

  attempt         TestAttempt   @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  question        Question      @relation(fields: [questionId], references: [id])

  @@unique([attemptId, questionId])
}

// ─────────────────────────────────────────────
// VOCABULARY
// ─────────────────────────────────────────────

model VocabularyItem {
  id            String          @id @default(cuid())
  userId        String
  word          String
  partOfSpeech  String?         // noun, verb, adjective, etc.
  definition    String          @db.Text
  exampleSentence String?       @db.Text
  synonyms      String[]        // Postgres text array
  difficulty    VocabDifficulty @default(MEDIUM)
  isMastered    Boolean         @default(false)
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  user          User            @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isMastered])
  @@index([userId, word])
}

enum VocabDifficulty {
  EASY
  MEDIUM
  HARD
}
```

### 3.2 TypeScript Interfaces (Frontend, `src/types/index.ts`)

```typescript
// ─── User ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  totalPoints: number;
  role: 'STUDENT' | 'ADMIN';
  createdAt: string; // ISO 8601
}

// ─── SAT Test ────────────────────────────────────────────────────────────────
export type Subject = 'VERBAL' | 'MATH';
export type AnswerOption = 'A' | 'B' | 'C' | 'D';
export type QuestionType = 'READING_WRITING' | 'MATH_MCQ' | 'MATH_SPR';

export interface Question {
  id: string;
  orderIndex: number;
  questionType: QuestionType;
  domain: string | null;
  skill: string | null;
  passageText: string | null;   // Raw Markdown/HTML; null for Math questions without a passage
  passageSource: string | null;
  stemText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: AnswerOption;  // Exposed ONLY in Review Mode API response
  explanation: string | null;   // Exposed ONLY in Review Mode API response
}

export interface SatTest {
  id: string;
  title: string;
  description: string | null;
  subject: Subject;
  module: 1 | 2;
  timeLimitSeconds: number;
  questions: Question[];
  isPublished: boolean;
}

// ─── Test Attempt ─────────────────────────────────────────────────────────────
export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'TIMED_OUT';

export interface QuestionResponse {
  questionId: string;
  selectedOption: AnswerOption | null; // null = skipped
  isCorrect: boolean | null;
  timeSpentSeconds: number | null;
}

export interface TestAttempt {
  id: string;
  userId: string;
  satTestId: string;
  satTest: Pick<SatTest, 'id' | 'title' | 'subject' | 'module' | 'timeLimitSeconds'>;
  isFirstAttempt: boolean;
  status: AttemptStatus;
  score: number | null;           // Number of correct answers
  totalQuestions: number;
  pointsAwarded: number | null;   // null for retakes
  startedAt: string;
  submittedAt: string | null;
  timeSpentSeconds: number | null;
  responses: QuestionResponse[];  // Populated only in Review Mode
}

// ─── Vocabulary ───────────────────────────────────────────────────────────────
export type VocabDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface VocabularyItem {
  id: string;
  userId: string;
  word: string;
  partOfSpeech: string | null;
  definition: string;
  exampleSentence: string | null;
  synonyms: string[];
  difficulty: VocabDifficulty;
  isMastered: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  totalPoints: number;
  testsCompleted: number; // Count of distinct first attempts with SUBMITTED/TIMED_OUT status
}

// ─── Active Test Session (Zustand store shape) ────────────────────────────────
export interface ActiveTestSession {
  attemptId: string;
  satTest: SatTest;
  isFirstAttempt: boolean;
  currentQuestionIndex: number;       // 0-based
  answers: Record<string, AnswerOption | null>; // questionId -> selected option
  highlights: Record<string, HighlightRange[]>; // questionId -> array of highlighted ranges
  secondsRemaining: number;
  status: 'IDLE' | 'RUNNING' | 'PAUSED' | 'SUBMITTING' | 'DONE';
}

export interface HighlightRange {
  id: string;       // uuid
  start: number;    // char offset in passageText
  end: number;      // char offset in passageText
  color: string;    // CSS hex color
}
```

---

## 4. Detailed Feature Specifications & User Flow

### Feature 1 — Authentication

#### 4.1.1 Overview

The entire application is behind an authentication gate. Unauthenticated users who visit any route are redirected to `/login`. There is no public-facing landing page in this version.

#### 4.1.2 Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/login` | `LoginPage` | Email/password form + Google OAuth button |
| `/register` | `RegisterPage` | Name, email, password, confirm password |
| `/forgot-password` | `ForgotPasswordPage` | Email input → sends reset link (future scope, scaffold only) |

#### 4.1.3 UI Layout — Login Page

```
┌─────────────────────────────────────────────────────────┐
│  [Logo: Mơ Digital SAT]                                 │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Sign in to your account                        │   │
│  │                                                 │   │
│  │  Email ____________________________________________  │
│  │  Password __________________________________________  │
│  │                                    [Forgot password?]│
│  │                                                 │   │
│  │  [        Sign In        ]  ← Primary CTA button│   │
│  │                                                 │   │
│  │  ─────────────── or ────────────────            │   │
│  │                                                 │   │
│  │  [G  Continue with Google ]                     │   │
│  │                                                 │   │
│  │  Don't have an account? [Register]              │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

#### 4.1.4 Validation Rules (Zod schema, shared)

```typescript
// src/lib/validations/auth.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
```

#### 4.1.5 Session Strategy

- NextAuth.js JWT strategy. Session contains `{ id, name, email, role, totalPoints }`.
- Middleware (`src/middleware.ts`) protects all routes under `/(dashboard)/**` matcher.
- On successful registration, user is auto-signed in and redirected to `/dashboard`.

---

### Feature 2 — SAT Practice (Verbal & Math)

#### 4.2.1 Navigation Entry Points

- **Dashboard** (`/dashboard`): Displays a grid of available published `SatTest` cards, filterable by `Subject` (Verbal / Math).
- Each card shows: Test title, subject badge, number of questions, time limit, and a "Start / Retake" CTA.

#### 4.2.2 Pre-Test Gate (`/tests/[testId]/start`)

Before the test begins, show a modal/page with:
- Test metadata (title, subject, question count, time limit).
- A **warning banner** if `isFirstAttempt === false`:
  > "⚠️ You have already completed this test. This retake is for practice only and will NOT affect your score or points history."
- "Begin Test" button → navigates to `/tests/[testId]/attempt`.

**`isFirstAttempt` determination logic (frontend + confirmed on backend):**

```typescript
// Called before rendering the Pre-Test Gate
async function determineIsFirstAttempt(testId: string): Promise<boolean> {
  const res = await fetch(`/api/tests/${testId}/my-attempts`);
  const { attempts }: { attempts: TestAttempt[] } = await res.json();
  // A "completed" first attempt exists if there's one with isFirstAttempt=true
  // and status SUBMITTED or TIMED_OUT
  const hasCompletedFirstAttempt = attempts.some(
    (a) => a.isFirstAttempt && (a.status === 'SUBMITTED' || a.status === 'TIMED_OUT')
  );
  return !hasCompletedFirstAttempt; // true = this upcoming attempt IS the first
}
```

#### 4.2.3 Test Taking UI — Layout

The test interface occupies 100% of the viewport. The global navigation shell is hidden via a layout group `(test-shell)` that does NOT include the sidebar/header.

```
┌──────────────────────────────────────────────────────────────────────┐
│  TOP BAR (fixed, h-14, bg-white, border-b, shadow-sm)               │
│  [← Exit]  [Test Title]          [⏱ 31:45]   [Q 1 of 27 ▼]         │
├───────────────────────────────┬──────────────────────────────────────┤
│  LEFT PANE                    │  RIGHT PANE                          │
│  (flex-1, overflow-y-auto,    │  (w-[480px] flex-shrink-0,           │
│   p-8, bg-[#F8FAFC])          │   overflow-y-auto, p-8, bg-white,    │
│                               │   border-l border-[#E2E8F0])         │
│  PASSAGE TEXT                 │  Question 1 of 27                    │
│  (selectable, highlightable   │                                      │
│   via context menu or toolbar)│  [Stem text]                         │
│                               │                                      │
│  [Highlight toolbar appears   │  ○  A. [Option A text]               │
│   on text selection:          │  ○  B. [Option B text]               │
│   [🟡 Highlight] [✕ Remove]]  │  ○  C. [Option C text]               │
│                               │  ○  D. [Option D text]               │
│                               │                                      │
│                               │  [Mark for Review ☆]                 │
│                               │                                      │
│                               │  ─────────────────────────────────   │
│                               │  [← Previous]        [Next →]        │
├───────────────────────────────┴──────────────────────────────────────┤
│  BOTTOM BAR (fixed, h-14, bg-white, border-t)                       │
│  [Question Navigator: 1 2 3 ... 27]    [Submit Test]                 │
└──────────────────────────────────────────────────────────────────────┘
```

**For Math questions where `passageText` is null:**
- The left pane is hidden (`hidden`).
- The right pane expands to full width (`w-full`).
- The layout switches to a single-column centered layout (`max-w-2xl mx-auto`).

#### 4.2.4 Layout Implementation (Tailwind CSS + Flexbox)

```tsx
// src/app/(test-shell)/tests/[testId]/attempt/page.tsx (structure only)
<div className="flex flex-col h-screen overflow-hidden">
  {/* Top Bar */}
  <TopBar />

  {/* Main Content Area */}
  <div className="flex flex-1 overflow-hidden">
    {/* LEFT: Passage Pane — only rendered if passageText is non-null */}
    {currentQuestion.passageText && (
      <PassagePane
        passageText={currentQuestion.passageText}
        passageSource={currentQuestion.passageSource}
        highlights={highlights[currentQuestion.id] ?? []}
        onHighlightAdd={handleHighlightAdd}
        onHighlightRemove={handleHighlightRemove}
        className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC]"
      />
    )}

    {/* RIGHT: Question Pane */}
    <QuestionPane
      question={currentQuestion}
      selectedOption={answers[currentQuestion.id] ?? null}
      onSelectOption={handleSelectOption}
      isMarkedForReview={markedQuestions.has(currentQuestion.id)}
      onToggleMarkForReview={handleToggleMark}
      className={cn(
        "overflow-y-auto p-8 bg-white border-l border-[#E2E8F0]",
        currentQuestion.passageText ? "w-[480px] flex-shrink-0" : "flex-1"
      )}
    />
  </div>

  {/* Bottom Navigation Bar */}
  <BottomNavBar />
</div>
```

#### 4.2.5 Text Highlighting

- **Trigger:** User selects text in the `PassagePane` component. A floating toolbar appears near the selection.
- **Toolbar options:** "Highlight" (yellow `#FEF08A`) and "Remove Highlight" (if selection overlaps existing highlight).
- **Storage:** Highlights are stored in the Zustand `ActiveTestSession` store under `highlights[questionId]`. They are persisted locally only (not saved to DB) — this is by design since highlights are ephemeral study aids.
- **Rendering:** Highlighted ranges are rendered by splitting the passage text string at the range boundaries and wrapping matching segments in `<mark>` elements styled with the highlight color.

```typescript
// src/components/test/PassagePane.tsx — highlight rendering logic
function renderPassageWithHighlights(text: string, highlights: HighlightRange[]): React.ReactNode {
  if (!highlights.length) return <p>{text}</p>;

  const sorted = [...highlights].sort((a, b) => a.start - b.start);
  const segments: React.ReactNode[] = [];
  let cursor = 0;

  for (const hl of sorted) {
    if (cursor < hl.start) {
      segments.push(<span key={`t-${cursor}`}>{text.slice(cursor, hl.start)}</span>);
    }
    segments.push(
      <mark
        key={hl.id}
        style={{ backgroundColor: hl.color }}
        className="rounded-sm cursor-pointer"
        onClick={() => onHighlightRemove(hl.id)}
      >
        {text.slice(hl.start, hl.end)}
      </mark>
    );
    cursor = hl.end;
  }

  if (cursor < text.length) {
    segments.push(<span key={`t-end`}>{text.slice(cursor)}</span>);
  }

  return <p className="leading-8 text-[#0F172A]">{segments}</p>;
}
```

#### 4.2.6 Timer — Countdown & Auto-Submit

- The timer is initialized from `satTest.timeLimitSeconds` when the attempt is created.
- It counts down using a `useInterval` hook that decrements `secondsRemaining` in the Zustand store every second.
- **Display format:** `MM:SS` in the TopBar. Color changes: normal `text-[#0F172A]` → amber `text-amber-500` when ≤ 5 minutes remain → red `text-red-600 animate-pulse` when ≤ 1 minute remains.
- **Auto-submit trigger:**

```typescript
// src/hooks/useTestTimer.ts
useEffect(() => {
  if (secondsRemaining <= 0 && status === 'RUNNING') {
    // Prevent double-submit
    setStatus('SUBMITTING');
    submitAttempt({ triggeredBy: 'TIMER' }); // sets AttemptStatus = TIMED_OUT
  }
}, [secondsRemaining, status]);
```

- The timer state lives in the Zustand store so it persists across question navigation without re-renders resetting it.
- **Tab visibility:** Use the `visibilitychange` event to pause the timer when the tab is hidden (anti-cheat measure). Log a `tabSwitchCount` field on the attempt (schema extensible — add `tabSwitchCount Int @default(0)` to `TestAttempt`).

#### 4.2.7 Test Submission Flow (CRITICAL — see also Section 6)

```
User clicks "Submit Test" OR timer reaches 0
  │
  ▼
[Frontend] Set status = 'SUBMITTING', show loading overlay
  │
  ▼
[Frontend] Collect final answers from Zustand store:
  payload = { answers: Record<questionId, AnswerOption|null>, triggeredBy: 'USER'|'TIMER' }
  │
  ▼
[API] POST /api/attempts/[attemptId]/submit
  │
  ├─ [Backend] Fetch attempt from DB, verify it belongs to current user, verify status = IN_PROGRESS
  ├─ [Backend] Grade each answer against Question.correctOption
  ├─ [Backend] Calculate score = count of correct answers
  │
  ├─ IF attempt.isFirstAttempt === true:
  │     pointsAwarded = score * 10
  │     UPDATE User.totalPoints += pointsAwarded  (atomic increment)
  │     SAVE QuestionResponse records with isCorrect populated
  │     UPDATE TestAttempt: status=SUBMITTED|TIMED_OUT, score, pointsAwarded, submittedAt
  │
  └─ IF attempt.isFirstAttempt === false:
        pointsAwarded = 0
        SAVE QuestionResponse records (for this session's review, but NOT affecting history)
        UPDATE TestAttempt: status=SUBMITTED|TIMED_OUT, score, pointsAwarded=0, submittedAt
        NOTE: These responses are saved but the attempt is excluded from the History page query
  │
  ▼
[API] Return: { attemptId, score, totalQuestions, pointsAwarded, isFirstAttempt }
  │
  ▼
[Frontend] Navigate to /tests/[testId]/results/[attemptId]
```

#### 4.2.8 Results Screen (`/tests/[testId]/results/[attemptId]`)

Displays immediately after submission:
- Score: `X / Y correct` as a large display number.
- Points awarded (or "Retake — no points awarded" banner if `isFirstAttempt === false`).
- Accuracy percentage and a simple radial progress chart.
- CTAs: "Review Answers" → navigates to Review Mode | "Back to Tests" | "Retake Test".

---

### Feature 3 — History & Review

#### 4.3.1 History Page (`/history`)

**Query:** Fetch all `TestAttempt` records for the current user where `isFirstAttempt = true` AND `status IN ('SUBMITTED', 'TIMED_OUT')`. Order by `submittedAt DESC`.

**UI Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│  My Test History                       [Filter: All | V | M]    │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Practice Test 1 — Module 1 Reading & Writing             │  │
│  │  📅 Jun 15, 2026, 9:32 AM  ·  ⏱ 28m 14s  ·  🏆 +110 pts  │  │
│  │  Score: 11 / 27 correct   [████████░░░░░░░] 41%            │  │
│  │                                      [Review Answers →]    │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌─── another attempt card ────────────────────────────────┐   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

- Each card is a `<button>` or anchor linking to Review Mode.
- If no attempts exist, show an empty state: "You haven't completed any tests yet. [Browse Tests →]"

#### 4.3.2 Review Mode (`/history/[attemptId]/review`)

This re-uses the exact same split-screen layout component as Feature 2, but in **read-only mode** with the following differences:

| Property | Test Mode | Review Mode |
|----------|-----------|-------------|
| Timer | Active countdown | Hidden (replaced by "Review Mode" badge) |
| Answer options | Selectable radio buttons | Non-interactive, color-coded |
| Submit button | Visible | Hidden |
| Navigation | Free | Free |
| Answer state | From Zustand store | From `attempt.responses` loaded from API |

**Answer Color Coding:**

```
For each question in Review Mode:
  - User's selected option:
      if isCorrect === true  → green background: bg-[#DCFCE7] border-[#16A34A] text-[#15803D]
      if isCorrect === false → red background:   bg-[#FEE2E2] border-[#DC2626] text-[#B91C1C]
  - Correct option (always shown, even if user skipped):
      → green background with a ✓ icon, regardless of whether user selected it

  - Explanation panel (below answer choices):
      → Collapsible section: "Explanation" accordion
      → Shows question.explanation text
```

**API for Review:** `GET /api/attempts/[attemptId]/review` — returns the full `TestAttempt` with `responses` populated AND `Question.correctOption` + `Question.explanation` fields included (these are excluded from the regular test-taking API).

---

### Feature 4 — Vocabulary

#### 4.4.1 Routes

| Route | Description |
|-------|-------------|
| `/vocabulary` | List all vocabulary items for current user |
| `/vocabulary/new` | Create a new vocabulary item (modal or page) |
| `/vocabulary/[id]/edit` | Edit existing item |
| `/vocabulary/study` | Flashcard study mode |

#### 4.4.2 Vocabulary List UI (`/vocabulary`)

```
┌──────────────────────────────────────────────────────────────────┐
│  My Vocabulary                  [+ Add Word]  [🃏 Study Mode]     │
│  [Search...]   [Filter: All | Easy | Medium | Hard | Mastered]   │
├──────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  ameliorate          [adj]         [Medium]  [✓ Mastered] │   │
│  │  to make something bad or unsatisfactory better           │   │
│  │  Ex: "The new policy will ameliorate traffic conditions." │   │
│  │  Synonyms: improve, mitigate, alleviate                   │   │
│  │                                  [Edit ✏] [Delete 🗑]     │   │
│  └───────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

#### 4.4.3 Add/Edit Form

Fields: Word (required), Part of Speech (select), Definition (textarea, required), Example Sentence (textarea), Synonyms (tag input — comma-separated), Difficulty (radio: Easy/Medium/Hard), Is Mastered (checkbox).

#### 4.4.4 Flashcard Study Mode (`/vocabulary/study`)

- Shows one card at a time: Front = word + part of speech. Back = definition + example + synonyms (revealed on click/tap).
- Navigation: Previous / Next buttons + keyboard arrows.
- Filter: "Study unmastered only" toggle.
- "Mark as Mastered" button on the back of each card → calls `PATCH /api/vocabulary/[id]` with `{ isMastered: true }`.

#### 4.4.5 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/vocabulary` | List all items for authenticated user |
| `POST` | `/api/vocabulary` | Create new item |
| `GET` | `/api/vocabulary/[id]` | Get single item |
| `PATCH` | `/api/vocabulary/[id]` | Update item |
| `DELETE` | `/api/vocabulary/[id]` | Delete item |

All vocabulary endpoints are scoped to `session.user.id` — a user can only access their own words.

---

### Feature 5 — Leaderboard

#### 4.5.1 Route: `/leaderboard`

#### 4.5.2 Data Query

```sql
-- Prisma equivalent: fetch top 50 users ordered by totalPoints descending
SELECT id, name, "avatarUrl", "totalPoints",
  COUNT(DISTINCT ta.id) FILTER (WHERE ta."isFirstAttempt" = true AND ta.status IN ('SUBMITTED', 'TIMED_OUT')) AS "testsCompleted"
FROM "User" u
LEFT JOIN "TestAttempt" ta ON ta."userId" = u.id
GROUP BY u.id
ORDER BY u."totalPoints" DESC
LIMIT 50;
```

Implemented as `GET /api/leaderboard`. Returns `LeaderboardEntry[]` with `rank` assigned by position in the sorted result.

#### 4.5.3 Points Formula

```
pointsAwarded = correctAnswers * 10
```

- **Applied ONLY on `isFirstAttempt === true` attempts.**
- `User.totalPoints` is incremented atomically in the submission transaction:

```typescript
// In /api/attempts/[attemptId]/submit route handler
await prisma.$transaction(async (tx) => {
  await tx.testAttempt.update({
    where: { id: attemptId },
    data: { status, score, pointsAwarded, submittedAt: new Date() },
  });

  if (attempt.isFirstAttempt) {
    await tx.user.update({
      where: { id: userId },
      data: { totalPoints: { increment: pointsAwarded } },
    });
  }
});
```

#### 4.5.4 Leaderboard UI

```
┌──────────────────────────────────────────────────────────────┐
│  🏆  Leaderboard                          Updated just now   │
├──────────────────────────────────────────────────────────────┤
│  RANK  STUDENT                   TESTS   POINTS              │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ 🥇 1   Nguyen Minh Anh   [avatar]   12    1,340 pts    │   │← Gold card bg-[#FEF9C3]
│ └────────────────────────────────────────────────────────┘   │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ 🥈 2   Tran Thi Bich     [avatar]    9    1,100 pts    │   │← Silver card bg-[#F1F5F9]
│ └────────────────────────────────────────────────────────┘   │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ 🥉 3   Le Van Cuong      [avatar]   11    980 pts      │   │← Bronze card bg-[#FEF3C7]
│ └────────────────────────────────────────────────────────┘   │
│   4    Pham Duc Huy               7    870 pts              │
│   5    Hoang Thi Lan              6    790 pts              │
│  ...                                                         │
│ ┌── YOUR RANK (sticky if not in top visible) ────────────┐   │
│ │  #14   You (Nguyen Van A)        5    510 pts          │   │← Highlighted border-blue
│ └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

- Top 3 cards are visually differentiated with medal emoji and distinct background colors.
- The current user's row is always shown at the bottom of the list (even if outside top 50) with a highlighted blue border.
- Leaderboard is refreshed every 60 seconds using TanStack Query `staleTime: 60_000`.

---

## 5. API Contract (REST Endpoints)

All endpoints under `/api/**`. All require a valid NextAuth session unless marked `[PUBLIC]`. Return `application/json`. Errors return `{ error: string, code: string }`.

### 5.1 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create user account. Body: `{ name, email, password }`. Returns `{ user }`. |
| `POST` | `/api/auth/[...nextauth]` | NextAuth handler (login, callback, signout) |

### 5.2 Tests

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tests` | List all published tests. Optional query: `?subject=VERBAL\|MATH` |
| `GET` | `/api/tests/[testId]` | Get test metadata + questions (WITHOUT `correctOption` and `explanation`) |
| `GET` | `/api/tests/[testId]/my-attempts` | List current user's attempts for a test. Used to determine `isFirstAttempt`. |

### 5.3 Attempts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/attempts` | Create a new attempt. Body: `{ satTestId }`. Backend determines `isFirstAttempt`. Returns `TestAttempt` with `isFirstAttempt` flag. |
| `GET` | `/api/attempts/[attemptId]` | Get attempt details |
| `POST` | `/api/attempts/[attemptId]/submit` | Submit attempt. Body: `{ answers: Record<string, AnswerOption\|null>, triggeredBy: 'USER'\|'TIMER' }` |
| `GET` | `/api/attempts/[attemptId]/review` | Get attempt with responses + `correctOption` + `explanation` per question. Only accessible if attempt status is SUBMITTED or TIMED_OUT and belongs to current user. |

### 5.4 History

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/history` | Returns all `isFirstAttempt=true, status IN (SUBMITTED, TIMED_OUT)` attempts for current user, ordered by `submittedAt DESC`. |

### 5.5 Vocabulary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/vocabulary` | List user's vocabulary items |
| `POST` | `/api/vocabulary` | Create item. Body: `VocabularyItem` fields (excluding `id`, `userId`, timestamps) |
| `GET` | `/api/vocabulary/[id]` | Get single item (must belong to user) |
| `PATCH` | `/api/vocabulary/[id]` | Partial update |
| `DELETE` | `/api/vocabulary/[id]` | Delete item |

### 5.6 Leaderboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/leaderboard` | Returns top 50 users by `totalPoints`, with current user injected if not in top 50. |

---

## 6. Technical Directives for AI Coding Assistants

> **⚠️ READ THIS SECTION CAREFULLY. These are non-negotiable implementation rules.**

### 6.1 CRITICAL: `isFirstAttempt` Logic

This is the most important business rule in the entire application. Implement it as follows:

#### 6.1.1 On `POST /api/attempts` (Creating a new attempt)

```typescript
// src/app/api/attempts/route.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createAttemptSchema = z.object({ satTestId: z.string().cuid() });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { satTestId } = createAttemptSchema.parse(body);

  // ── STEP 1: Check for existing completed first attempt ──────────────────
  const existingFirstAttempt = await prisma.testAttempt.findFirst({
    where: {
      userId: session.user.id,
      satTestId,
      isFirstAttempt: true,
      status: { in: ['SUBMITTED', 'TIMED_OUT'] },
    },
  });

  // ── STEP 2: Check for any IN_PROGRESS attempt (resume or discard) ────────
  const inProgressAttempt = await prisma.testAttempt.findFirst({
    where: {
      userId: session.user.id,
      satTestId,
      status: 'IN_PROGRESS',
    },
  });

  // If there's an IN_PROGRESS attempt, discard it (mark as abandoned)
  // before creating a new one. Do NOT allow two concurrent attempts.
  if (inProgressAttempt) {
    await prisma.testAttempt.update({
      where: { id: inProgressAttempt.id },
      data: { status: 'TIMED_OUT', submittedAt: new Date() },
    });
  }

  // ── STEP 3: Determine isFirstAttempt ─────────────────────────────────────
  // isFirstAttempt = true ONLY if NO completed first attempt exists for this (user, test) pair.
  const isFirstAttempt = !existingFirstAttempt;

  // ── STEP 4: Create the new attempt ────────────────────────────────────────
  const attempt = await prisma.testAttempt.create({
    data: {
      userId: session.user.id,
      satTestId,
      isFirstAttempt, // ← Set here, immutably. Never updated after creation.
      status: 'IN_PROGRESS',
    },
  });

  return Response.json({ attempt }, { status: 201 });
}
```

#### 6.1.2 On `POST /api/attempts/[attemptId]/submit` (Submitting)

```typescript
// src/app/api/attempts/[attemptId]/submit/route.ts
export async function POST(req: Request, { params }: { params: { attemptId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const attempt = await prisma.testAttempt.findUnique({
    where: { id: params.attemptId },
    include: { satTest: { include: { questions: true } } },
  });

  if (!attempt) return Response.json({ error: 'Not found' }, { status: 404 });
  if (attempt.userId !== session.user.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
  if (attempt.status !== 'IN_PROGRESS') return Response.json({ error: 'Already submitted' }, { status: 409 });

  const { answers, triggeredBy } = await req.json();
  // answers: Record<questionId, AnswerOption | null>

  // ── STEP 1: Grade all questions ────────────────────────────────────────────
  let score = 0;
  const responses = attempt.satTest.questions.map((q) => {
    const selected = answers[q.id] ?? null;
    const isCorrect = selected !== null ? selected === q.correctOption : null;
    if (isCorrect === true) score++;
    return {
      attemptId: attempt.id,
      questionId: q.id,
      selectedOption: selected,
      isCorrect,
    };
  });

  // ── STEP 2: Calculate points (ONLY for first attempt) ─────────────────────
  const pointsAwarded = attempt.isFirstAttempt ? score * 10 : 0;
  const finalStatus = triggeredBy === 'TIMER' ? 'TIMED_OUT' : 'SUBMITTED';
  const submittedAt = new Date();
  const timeSpentSeconds = Math.round(
    (submittedAt.getTime() - attempt.startedAt.getTime()) / 1000
  );

  // ── STEP 3: Atomic transaction ─────────────────────────────────────────────
  await prisma.$transaction([
    // Save individual question responses
    prisma.questionResponse.createMany({ data: responses }),
    // Update the attempt record
    prisma.testAttempt.update({
      where: { id: attempt.id },
      data: { status: finalStatus, score, pointsAwarded, submittedAt, timeSpentSeconds },
    }),
    // ONLY update user totalPoints if this was their first attempt
    ...(attempt.isFirstAttempt
      ? [
          prisma.user.update({
            where: { id: session.user.id },
            data: { totalPoints: { increment: pointsAwarded } },
          }),
        ]
      : []),
  ]);

  return Response.json({
    attemptId: attempt.id,
    score,
    totalQuestions: attempt.satTest.questions.length,
    pointsAwarded,
    isFirstAttempt: attempt.isFirstAttempt,
  });
}
```

### 6.2 Zustand Store Structure

```typescript
// src/store/testSessionStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ActiveTestSession, AnswerOption, HighlightRange } from '@/types';

interface TestSessionActions {
  initSession: (session: Omit<ActiveTestSession, 'status'>) => void;
  setAnswer: (questionId: string, option: AnswerOption | null) => void;
  addHighlight: (questionId: string, highlight: HighlightRange) => void;
  removeHighlight: (questionId: string, highlightId: string) => void;
  navigateToQuestion: (index: number) => void;
  decrementTimer: () => void;
  setStatus: (status: ActiveTestSession['status']) => void;
  clearSession: () => void;
}

const initialState: ActiveTestSession = {
  attemptId: '',
  satTest: null!,
  isFirstAttempt: true,
  currentQuestionIndex: 0,
  answers: {},
  highlights: {},
  secondsRemaining: 0,
  status: 'IDLE',
};

export const useTestSessionStore = create<ActiveTestSession & TestSessionActions>()(
  devtools(
    (set) => ({
      ...initialState,
      initSession: (session) => set({ ...session, status: 'RUNNING' }),
      setAnswer: (questionId, option) =>
        set((s) => ({ answers: { ...s.answers, [questionId]: option } })),
      addHighlight: (questionId, highlight) =>
        set((s) => ({
          highlights: {
            ...s.highlights,
            [questionId]: [...(s.highlights[questionId] ?? []), highlight],
          },
        })),
      removeHighlight: (questionId, highlightId) =>
        set((s) => ({
          highlights: {
            ...s.highlights,
            [questionId]: (s.highlights[questionId] ?? []).filter((h) => h.id !== highlightId),
          },
        })),
      navigateToQuestion: (index) => set({ currentQuestionIndex: index }),
      decrementTimer: () => set((s) => ({ secondsRemaining: Math.max(0, s.secondsRemaining - 1) })),
      setStatus: (status) => set({ status }),
      clearSession: () => set(initialState),
    }),
    { name: 'TestSessionStore' }
  )
);
```

### 6.3 Layout Group Strategy (Next.js App Router)

```
src/app/
├── (auth)/               ← Layout: no sidebar, centered card
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/          ← Layout: sidebar nav + top header
│   ├── layout.tsx        ← Renders <Sidebar /> and <TopHeader />
│   ├── dashboard/page.tsx
│   ├── history/page.tsx
│   ├── leaderboard/page.tsx
│   └── vocabulary/page.tsx
└── (test-shell)/         ← Layout: BARE — no sidebar, no header, 100vh
    ├── layout.tsx        ← Only renders {children}, sets overflow:hidden on html/body
    └── tests/
        └── [testId]/
            ├── start/page.tsx
            ├── attempt/page.tsx
            └── results/[attemptId]/page.tsx
```

The `(test-shell)` layout MUST override body padding/margin and set `overflow: hidden` to prevent any scroll bleed:

```tsx
// src/app/(test-shell)/layout.tsx
export default function TestShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col">
      {children}
    </div>
  );
}
```

### 6.4 Review Mode — Correct Answer Display Logic

```typescript
// src/components/review/ReviewOptionItem.tsx
interface ReviewOptionProps {
  optionKey: AnswerOption;      // 'A' | 'B' | 'C' | 'D'
  optionText: string;
  selectedOption: AnswerOption | null;  // What the user chose
  correctOption: AnswerOption;          // Ground truth
}

function getOptionStyle(
  optionKey: AnswerOption,
  selectedOption: AnswerOption | null,
  correctOption: AnswerOption
): string {
  const isThisOptionCorrect = optionKey === correctOption;
  const isThisOptionSelected = optionKey === selectedOption;

  if (isThisOptionCorrect) {
    // Always highlight the correct answer green
    return 'bg-green-50 border-green-500 text-green-800 font-medium';
  }
  if (isThisOptionSelected && !isThisOptionCorrect) {
    // Highlight the wrong selection red
    return 'bg-red-50 border-red-500 text-red-800';
  }
  return 'bg-white border-gray-200 text-gray-600';
}
```

### 6.5 Security Rules

1. **Never expose `correctOption` or `explanation`** from the `Question` model in ANY API response except `GET /api/attempts/[attemptId]/review` (and only after verifying the attempt is SUBMITTED/TIMED_OUT and belongs to the requesting user).
2. All API routes must validate `session.user.id` against the resource owner before returning data.
3. Use Zod to validate ALL incoming request bodies. Do NOT trust client-sent `isFirstAttempt` or `pointsAwarded` values — these are computed exclusively server-side.
4. Prisma queries must always include a `where: { userId: session.user.id }` clause for user-scoped resources.

### 6.6 Environment Variables (`.env.local`)

```
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

---

## 7. File & Folder Structure

```
mo-digital-sat/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts               ← Seeds sample tests and questions
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   ├── history/
│   │   │   │   └── [attemptId]/
│   │   │   │       └── review/
│   │   │   ├── leaderboard/
│   │   │   └── vocabulary/
│   │   ├── (test-shell)/
│   │   │   ├── layout.tsx
│   │   │   └── tests/
│   │   │       └── [testId]/
│   │   │           ├── start/
│   │   │           ├── attempt/
│   │   │           └── results/[attemptId]/
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── [...nextauth]/route.ts
│   │       │   └── register/route.ts
│   │       ├── tests/
│   │       │   ├── route.ts
│   │       │   └── [testId]/
│   │       │       ├── route.ts
│   │       │       └── my-attempts/route.ts
│   │       ├── attempts/
│   │       │   ├── route.ts
│   │       │   └── [attemptId]/
│   │       │       ├── route.ts
│   │       │       ├── submit/route.ts
│   │       │       └── review/route.ts
│   │       ├── history/route.ts
│   │       ├── vocabulary/
│   │       │   ├── route.ts
│   │       │   └── [id]/route.ts
│   │       └── leaderboard/route.ts
│   ├── components/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── test/
│   │   │   ├── TopBar.tsx
│   │   │   ├── PassagePane.tsx
│   │   │   ├── QuestionPane.tsx
│   │   │   ├── OptionItem.tsx
│   │   │   ├── BottomNavBar.tsx
│   │   │   ├── QuestionNavigator.tsx
│   │   │   └── HighlightToolbar.tsx
│   │   ├── review/
│   │   │   └── ReviewOptionItem.tsx
│   │   ├── vocabulary/
│   │   ├── leaderboard/
│   │   └── ui/                ← shadcn/ui components
│   ├── hooks/
│   │   ├── useTestTimer.ts
│   │   ├── useTextHighlight.ts
│   │   └── useSubmitAttempt.ts
│   ├── lib/
│   │   ├── auth.ts            ← NextAuth authOptions
│   │   ├── prisma.ts          ← PrismaClient singleton
│   │   └── validations/
│   │       ├── auth.ts
│   │       ├── attempt.ts
│   │       └── vocabulary.ts
│   ├── store/
│   │   └── testSessionStore.ts
│   ├── types/
│   │   └── index.ts
│   └── middleware.ts
├── tailwind.config.ts
├── next.config.mjs
└── package.json
```

---

## 8. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Time to Interactive (TTI) < 3s on 4G. Test attempt page LCP < 1.5s (passage + first question must be above the fold). |
| **Reliability** | Auto-save answers to localStorage every 10 seconds during an active attempt as a fallback against network failure or tab closure. On test resume (page reload), restore answers from localStorage if attempt is still IN_PROGRESS. |
| **Concurrency** | The `isFirstAttempt` determination and attempt creation MUST be idempotent. Use a Prisma transaction with `findFirst` + `create` in sequence. Consider a unique partial index for extra safety: `CREATE UNIQUE INDEX "one_first_attempt_per_user_test" ON "TestAttempt"("userId", "satTestId") WHERE "isFirstAttempt" = true AND status IN ('SUBMITTED', 'TIMED_OUT');` |
| **Responsiveness** | Desktop-first. Minimum supported viewport: 1024px wide. The split-screen layout collapses to a single-column stacked layout (passage above, questions below) on viewports < 768px. |
| **Loading States** | Every async operation must show a skeleton loader or spinner. Use `loading.tsx` files in the App Router for page-level suspense. |
| **Error Handling** | Global error boundary (`error.tsx`). API errors must return structured JSON `{ error: string, code: string }`. Toast notifications (via `sonner`) for success/error feedback on form submissions. |
| **Math Rendering** | For Math questions with LaTeX content in `stemText` or options, use `react-katex` or `@mathjax/react` to render math. Detect LaTeX by checking for `$...$` or `$$...$$` delimiters. |
| **Seed Data** | `prisma/seed.ts` must create at minimum: 2 published Verbal tests (27 questions each, 32 min) and 2 published Math tests (22 questions each, 35 min) with realistic SAT-style content. |

---

*End of PRD — Mơ Digital SAT v1.0.0*
