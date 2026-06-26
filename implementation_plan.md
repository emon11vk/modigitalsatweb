# Admin Module — Implementation Plan

## Background

The student-facing exam interface exists. We need to add:
1. **RBAC** — root admin (`emon11vk@gmail.com`) + dynamic admin list
2. **Visual Exam Editor** — JSON import → card-per-question editing → save to Supabase  
3. **Per-question Image Upload** — upload to Supabase Storage, inline preview

## Architecture Decisions

### Database Setup via Service Role Key (Backend-less)

> [!IMPORTANT]
> The PRD calls for SQL migrations, RLS policies, and `SECURITY DEFINER` functions. Since we have **no backend server** and the secret key **must not be exposed in frontend code**, we will use a **one-time Node.js setup script** (`scripts/setup-db.ts`) that runs locally with the service role key to create tables, functions, RLS policies, and seed the root admin. This script is run once by the developer — not shipped to the browser.

The frontend will continue using the **anon key** for all operations. RLS policies will enforce authorization at the database level.

### Admin UI — Tab-Based Layout

The existing `AdminScreen.tsx` will be **replaced** with a full-featured admin module containing tabs:
- **Dashboard** — overview stats
- **Exam Editor** — JSON import → visual editor → save
- **Admin Management** — root-only admin grant/revoke
- **Module Manager** — existing module list (migrated from current AdminScreen)

### Service Role Key Handling

The service role key will **only** be used in:
1. The one-time setup script (`scripts/setup-db.ts`) — runs locally via `npx tsx`
2. **Never** in frontend code — all browser operations use the anon key + RLS

---

## Proposed Changes

### Database Setup Script

#### [NEW] [setup-db.ts](file:///d:/coding-space/modigitalsat.web/scripts/setup-db.ts)

A Node.js script that uses the Supabase service role key to:
- Create the `admins` table with email, granted_by, granted_at, is_root columns
- Create `is_root_admin()` and `is_admin()` SECURITY DEFINER functions
- Apply RLS policies on `admins` (read: admins only, insert/delete: root only)
- Create `exams`, `exam_sections`, `exam_questions` tables
- Apply RLS policies on exam tables (admins: full CRUD)
- Create `exam-question-images` storage bucket with public read, admin-only write policies
- Seed root admin row for `emon11vk@gmail.com`

---

### Shared Hooks & Utils

#### [NEW] [useAdminRole.ts](file:///d:/coding-space/modigitalsat.web/src/hooks/useAdminRole.ts)

Hook that checks if the current user is admin/root:
- Gets user email from `supabase.auth.getUser()`
- Checks root status by hardcoded email comparison
- Checks admin status by querying the `admins` table
- Returns `{ loading, isAdmin, isRoot, email }`

#### [NEW] [normalizeExamJson.ts](file:///d:/coding-space/modigitalsat.web/src/utils/normalizeExamJson.ts)

JSON normalizer from PRD §5.4 — parses raw JSON and normalizes into the internal exam/sections/questions structure. Uses `crypto.randomUUID()` for stable IDs.

#### [NEW] [examEditorReducer.ts](file:///d:/coding-space/modigitalsat.web/src/utils/examEditorReducer.ts)

Central reducer for the exam editor state (from PRD §5.4) — handles IMPORT_JSON, UPDATE_QUESTION_FIELD, UPDATE_CHOICE, SET_CORRECT_ANSWER, SET_QUESTION_IMAGE, SAVE states, ADD_QUESTION, REMOVE_QUESTION, REORDER, etc.

#### [NEW] [saveExam.ts](file:///d:/coding-space/modigitalsat.web/src/utils/saveExam.ts)

Upsert function that flattens editor state tree back into Supabase tables (exams → exam_sections → exam_questions).

---

### Admin Components

#### [MODIFY] [AdminScreen.tsx](file:///d:/coding-space/modigitalsat.web/src/components/AdminScreen.tsx)

**Complete rewrite.** The new AdminScreen becomes the shell with:
- `useAdminRole()` guard — redirects non-admins
- Tab navigation (Dashboard, Exam Editor, Exam Manager, Admin Management)
- Root-only gating for the Admin Management tab
- Removes the service role key usage (was insecure)

#### [NEW] [AdminDashboard.tsx](file:///d:/coding-space/modigitalsat.web/src/components/admin/AdminDashboard.tsx)

Overview panel showing:
- Total exams, total questions, total admins counts
- Recent activity feed
- Quick action buttons

#### [NEW] [ExamEditorPanel.tsx](file:///d:/coding-space/modigitalsat.web/src/components/admin/ExamEditorPanel.tsx)

The visual exam editor:
- **JsonImportPanel** — textarea + file drop for JSON import
- **ExamMetaBar** — title editing, save button, status indicator
- **SectionList → SectionBlock → QuestionCard** — card-per-question UI
- Each QuestionCard contains: question text, passage (collapsible), choices with correct-answer radio, explanation, image upload slot
- Save button calls `saveExam()` to persist to Supabase

#### [NEW] [ExamManagerPanel.tsx](file:///d:/coding-space/modigitalsat.web/src/components/admin/ExamManagerPanel.tsx)

Lists all saved exams with:
- Title, section count, question count, created date
- Edit button (loads exam into editor)
- Delete button

#### [NEW] [AdminManagementPanel.tsx](file:///d:/coding-space/modigitalsat.web/src/components/admin/AdminManagementPanel.tsx)

Root-only panel:
- Admin list table (email, granted_at, granted_by, Revoke button)
- Grant admin form (email input + Grant button)
- All operations go through RLS (root-only insert/delete policies)

#### [NEW] [ImageUploadSlot.tsx](file:///d:/coding-space/modigitalsat.web/src/components/admin/ImageUploadSlot.tsx)

Per-question image upload from PRD §6.3:
- File picker with drag-drop support
- 5MB size limit, image MIME validation
- Uploads to Supabase Storage `exam-question-images` bucket
- Shows inline preview thumbnail
- Remove/replace support

---

### App Integration

#### [MODIFY] [types.ts](file:///d:/coding-space/modigitalsat.web/src/types.ts)

Add admin-related types and screen types for admin sub-screens.

#### [MODIFY] [App.tsx](file:///d:/coding-space/modigitalsat.web/src/App.tsx)

- Pass `currentUser` to `AdminScreen` so it can check roles
- The admin nav item visibility will be controlled by the AdminScreen itself (shows "Access Denied" for non-admins rather than hiding the nav)

---

## Open Questions

> [!IMPORTANT]
> **Question ID stability**: The PRD recommends `crypto.randomUUID()` at JSON-parse time. I'll proceed with this approach — IDs are stable from import through image upload and save. Confirm this is acceptable?

> [!IMPORTANT]
> **Existing module system integration**: The current app has a `modules`/`questions` table schema used by students. The PRD introduces new `exams`/`exam_sections`/`exam_questions` tables. Should we:
> - **Option A**: Keep both systems separate (new exam editor writes to new tables, old module system stays as-is)
> - **Option B**: Eventually migrate the old module system to the new exam tables
> 
> I'll proceed with **Option A** for now — the exam editor writes to the new tables, the existing module import stays in the "Module Manager" tab.

> [!IMPORTANT]
> **Storage cleanup**: On image replace/remove, I'll delete the old file from storage before uploading the new one (clean approach). Orphaned files won't accumulate.

---

## Verification Plan

### Manual Verification
1. Run `scripts/setup-db.ts` and verify tables/policies are created in Supabase dashboard
2. Sign in as `emon11vk@gmail.com` → verify root admin access, can see Admin Management tab
3. Grant admin to another email → verify it appears in admin list
4. Sign in as granted admin → verify admin access but no Admin Management tab
5. Sign in as regular student → verify no admin access (redirect away)
6. Import a sample JSON → verify question cards render correctly
7. Edit question fields → save → reload → verify data persists
8. Upload image to a question → verify preview and URL persistence
9. Test invalid JSON input → verify inline error without crash

### Automated Tests
- `npx tsx scripts/setup-db.ts` — verify script runs without errors
- `npm run build` — verify no TypeScript errors
