# PRD — Admin Module for Digital SAT Practice Platform
### Role-Based Access Control, Visual Exam Editor & Image Upload Pipeline

**Stack:** React (frontend) + Supabase (Auth, Postgres, Storage, RLS)
**Audience:** Antigravity (AI dev agent) / Engineering team
**Author intent:** This document is both a product spec and an implementation-ready prompt. Treat every section under "Implementation Spec" as the actual build instructions.

---

## 1. Background & Context

The student-facing exam interface for a Digital SAT practice platform is already built. The system currently has **no Admin flow at all** — no role system, no way to create/edit exams through a UI, and no image pipeline for question assets.

This PRD defines three connected features:

1. **Role-Based Access Control (RBAC)** — bootstrap a root admin, allow that root admin to promote other Gmail accounts to Admin.
2. **Visual Exam Editor** ("Microsoft Forms"-style) — paste raw exam JSON, get an editable card-per-question UI, persist edits back to Supabase.
2. **Per-question Image Upload** — upload images directly inside each question block, store in Supabase Storage, preview inline, persist the URL into the question data.

---

## 2. Goals & Non-Goals

### Goals
- A secure, DB-enforced (not just UI-enforced) permission system with one hardcoded root admin and a dynamic admin list.
- A JSON-import → visual-editor pipeline that round-trips cleanly (import → edit → save → re-render identically).
- Inline image upload per question, stored in Supabase Storage, with public/signed URL persisted in the question record.

### Non-Goals (out of scope for this PRD)
- Building the exam-taking/student runtime (already exists).
- Versioning/drafts/scheduled publishing of exams (can be a fast-follow).
- Multi-tenant org structure — this is a single-platform, flat admin list.
- Fine-grained per-admin permission scopes (all admins are equal rank below root).

---

## 3. Personas

| Persona | Description |
|---|---|
| **Root Admin** | Exactly one account: `emon11vk@gmail.com`. Hardcoded as the only entity that can grant/revoke Admin role. Cannot be demoted by anyone, including itself, through the UI. |
| **Admin** | Any Gmail account promoted by Root. Can create/edit/import exams, upload images, manage questions. Cannot manage other admins. |
| **Student** | Existing role, no changes in this PRD. |

---

## 4. Feature 1 — Role-Based Access Control

### 4.1 Functional Requirements
- FR1.1: System recognizes `emon11vk@gmail.com` as root admin **at the database/policy level**, not just via a frontend check.
- FR1.2: Root admin sees an "Admin Management" screen inside `/admin` listing all current admins (email, granted date, granted by).
- FR1.3: Root admin can input any email address and grant Admin role. The grant should work whether or not that user has signed up yet (pre-provisioned) — when they later sign in with that Google account, they get Admin rights immediately.
- FR1.4: Root admin can revoke Admin role from any non-root admin.
- FR1.5: Non-root admins must not see the Admin Management screen, and any direct API/RLS attempt to grant/revoke roles by a non-root user must be rejected at the database level.
- FR1.6: Root status itself is never stored as an editable row a regular admin could tamper with — it is derived from the hardcoded email, checked via a `SECURITY DEFINER` function, so even a compromised `admins` table row can't grant someone root.

### 4.2 Implementation Spec — Database & RLS

**Auth assumption:** Supabase Auth with Google OAuth provider enabled (sign-in is via Gmail, consistent with the "Gmail account" requirement).

#### Table: `admins`

```sql
create table public.admins (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  granted_by text, -- email of the admin/root who granted this
  granted_at timestamptz not null default now(),
  is_root boolean not null default false
);

-- Helpful index for the email lookups used everywhere
create index admins_email_idx on public.admins (lower(email));
```

> Note: We store `email` (not just `user_id`) because FR1.3 requires pre-provisioning admins who haven't signed up yet. We reconcile `email` → `auth.users.id` at login time (see 4.2.4).

#### 4.2.1 Root check function (SECURITY DEFINER, hardcoded)

This is the load-bearing piece: root status is **never** read from a mutable table for the purpose of authorization. It's a hardcoded literal inside a function only the database can execute with elevated rights.

```sql
create or replace function public.is_root_admin(check_email text)
returns boolean
language sql
security definer
stable
as $$
  select lower(check_email) = lower('emon11vk@gmail.com');
$$;
```

#### 4.2.2 "Is this JWT an admin?" helper

```sql
create or replace function public.is_admin(check_email text)
returns boolean
language sql
security definer
stable
as $$
  select public.is_root_admin(check_email)
     or exists (
       select 1 from public.admins a
       where lower(a.email) = lower(check_email)
     );
$$;
```

`security definer` is required here so that RLS on `admins` itself (see below) doesn't create a chicken-and-egg problem when a policy needs to check admin status.

#### 4.2.3 RLS Policies on `admins`

```sql
alter table public.admins enable row level security;

-- Anyone authenticated can READ the admin list (needed so the frontend
-- can check "am I admin?" without a backend round trip). If you want this
-- tighter, restrict to admins only — see commented alternative below.
create policy "Admins list is readable by admins"
on public.admins for select
to authenticated
using ( public.is_admin(auth.jwt() ->> 'email') );

-- INSERT (grant admin): only root may insert new rows
create policy "Only root can grant admin"
on public.admins for insert
to authenticated
with check ( public.is_root_admin(auth.jwt() ->> 'email') );

-- DELETE (revoke admin): only root may delete, and root row can't be deleted
create policy "Only root can revoke admin"
on public.admins for delete
to authenticated
using (
  public.is_root_admin(auth.jwt() ->> 'email')
  and is_root = false
);

-- UPDATE: not needed for MVP (no role tiers) — explicitly deny by omission.
-- With RLS enabled and no UPDATE policy, all updates are rejected by default.
```

**Why this is safe:** `auth.jwt() ->> 'email'` reads the email from the verified Supabase Auth JWT — a user cannot spoof this client-side. Combined with `is_root_admin()` doing a hardcoded string comparison, no row tampering in `admins` can ever fabricate root status.

#### 4.2.4 Reconciling pre-provisioned grants on login

Since FR1.3 allows granting admin to an email before that user signs up, add a trigger that runs after a new `auth.users` row appears (Supabase fires this through `auth.users` insert, accessible via a trigger on that table or via a Postgres function called from a Supabase Auth Hook):

```sql
-- Optional convenience: keep admins.user_id populated once they sign up.
alter table public.admins add column user_id uuid references auth.users(id);

create or replace function public.sync_admin_user_id()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.admins
  set user_id = new.id
  where lower(email) = lower(new.email) and user_id is null;
  return new;
end;
$$;

create trigger on_auth_user_created_sync_admin
after insert on auth.users
for each row execute function public.sync_admin_user_id();
```

#### 4.2.5 Seeding root on first migration

```sql
insert into public.admins (email, granted_by, is_root)
values ('emon11vk@gmail.com', 'system', true)
on conflict (email) do nothing;
```

#### 4.2.6 Applying `is_admin()` to exam tables

Every admin-write table (exams, questions, etc., see Feature 2) reuses the same helper:

```sql
create policy "Admins can manage exams"
on public.exams for all
to authenticated
using ( public.is_admin(auth.jwt() ->> 'email') )
with check ( public.is_admin(auth.jwt() ->> 'email') );
```

This is the single source of truth — define it once, reuse on every admin-gated table, rather than re-deriving permission logic per table.

### 4.3 Frontend: Admin Management UI

**Route:** `/admin/management` (guarded; root-only — see 4.4)

**Component tree:**
```
AdminManagementPage
 ├─ RootGuard               (redirects non-root away)
 ├─ AdminList               (table: email, granted_at, granted_by, [Revoke] button)
 └─ GrantAdminForm          (email input + "Grant Admin" button)
```

**`useAuth` / role hook** (shared across the whole admin module):

```jsx
// hooks/useAdminRole.js
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useAdminRole() {
  const [state, setState] = useState({ loading: true, isAdmin: false, isRoot: false, email: null });

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (active) setState({ loading: false, isAdmin: false, isRoot: false, email: null });
        return;
      }
      const email = user.email;
      const isRoot = email?.toLowerCase() === 'emon11vk@gmail.com';
      let isAdmin = isRoot;
      if (!isRoot) {
        const { data, error } = await supabase
          .from('admins')
          .select('email')
          .ilike('email', email)
          .maybeSingle();
        isAdmin = !error && !!data;
      }
      if (active) setState({ loading: false, isAdmin, isRoot, email });
    })();
    return () => { active = false; };
  }, []);

  return state;
}
```

> **Security note:** This hook is for UI gating (show/hide nav, redirect) only. The actual enforcement is the RLS policies in 4.2.3 — never trust this hook as the security boundary. Any "admin-only" mutation must also be protected by an RLS policy that re-checks `auth.jwt()`.

**Grant form submit handler:**

```jsx
async function handleGrant(email) {
  const { error } = await supabase
    .from('admins')
    .insert({ email: email.trim().toLowerCase(), granted_by: currentUserEmail });

  if (error) {
    // Will fail here if current user isn't root — RLS rejects it server-side.
    toast.error(error.message.includes('row-level security')
      ? 'You do not have permission to grant admin access.'
      : error.message);
    return;
  }
  toast.success(`Granted admin access to ${email}`);
  refetchAdminList();
}
```

**Revoke handler:** same pattern with `.delete().eq('email', target)` — RLS blocks it for non-root and blocks deleting the root row regardless of caller.

### 4.4 Route Guarding

```jsx
function RootGuard({ children }) {
  const { loading, isRoot } = useAdminRole();
  if (loading) return <Spinner />;
  if (!isRoot) return <Navigate to="/admin" replace />;
  return children;
}

function AdminGuard({ children }) {
  const { loading, isAdmin } = useAdminRole();
  if (loading) return <Spinner />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}
```

---

## 5. Feature 2 — Visual Exam Editor (JSON Import → Card UI)

### 5.1 Functional Requirements
- FR2.1: Admin can paste a raw JSON string/file representing a full exam (sections, questions, choices, answers) into a text area or drop a `.json` file.
- FR2.2: On valid parse, the system renders one **card/block per question**, editable inline — question text, choices, correct answer, explanation.
- FR2.3: Invalid JSON shows an inline parse error with line/position info, without crashing the editor.
- FR2.4: Edits are held in local component state and explicitly saved (Save button) to Supabase — not auto-saved on every keystroke, to avoid partial/garbage writes.
- FR2.5: The editor must tolerate "reasonable" schema variation (e.g. missing `explanation` field) without breaking.

### 5.2 Expected Input JSON Shape (normalize to this internally)

```json
{
  "examTitle": "SAT Practice Test 1",
  "sections": [
    {
      "sectionName": "Reading and Writing - Module 1",
      "questions": [
        {
          "id": "q1",
          "type": "multiple_choice",
          "passage": "Optional long-form passage text...",
          "questionText": "Which choice completes the text with the most logical transition?",
          "choices": [
            { "key": "A", "text": "However" },
            { "key": "B", "text": "Therefore" },
            { "key": "C", "text": "For example" },
            { "key": "D", "text": "In contrast" }
          ],
          "correctAnswer": "B",
          "explanation": "Optional explanation text",
          "imageUrl": null
        }
      ]
    }
  ]
}
```

If the admin's source JSON differs (e.g. flat array of questions, different key names), the import step should run through a **normalizer function** rather than forcing the admin to reformat manually.

### 5.3 Implementation Spec — Database

```sql
create table public.exams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.exam_sections (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  name text not null,
  position int not null default 0
);

create table public.exam_questions (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.exam_sections(id) on delete cascade,
  position int not null default 0,
  type text not null default 'multiple_choice',
  passage text,
  question_text text not null,
  choices jsonb not null default '[]', -- [{ key: "A", text: "..." }, ...]
  correct_answer text,
  explanation text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.exams enable row level security;
alter table public.exam_sections enable row level security;
alter table public.exam_questions enable row level security;

-- Admins: full read/write. Students: read-only on published exams (adapt to your existing exam-delivery logic).
create policy "Admins manage exams" on public.exams for all
  to authenticated using (public.is_admin(auth.jwt() ->> 'email')) with check (public.is_admin(auth.jwt() ->> 'email'));

create policy "Admins manage sections" on public.exam_sections for all
  to authenticated using (public.is_admin(auth.jwt() ->> 'email')) with check (public.is_admin(auth.jwt() ->> 'email'));

create policy "Admins manage questions" on public.exam_questions for all
  to authenticated using (public.is_admin(auth.jwt() ->> 'email')) with check (public.is_admin(auth.jwt() ->> 'email'));
```

> Add separate `select`-only policies for the `student` role against whatever "exam is published/active" condition already exists in your current student-facing schema — that logic predates this PRD and should be merged in, not replaced.

### 5.4 Implementation Spec — React Component & State Architecture

**Component tree:**

```
ExamEditorPage
 ├─ JsonImportPanel
 │    ├─ <textarea> or file drop zone
 │    └─ "Parse & Load" button
 ├─ ExamMetaBar           (exam title, save button, status indicator)
 └─ SectionList
      └─ SectionBlock (per section)
           └─ QuestionCard[]   (per question — the "Microsoft Forms" block)
                ├─ QuestionTextField
                ├─ PassageField (optional, collapsible)
                ├─ ChoiceList
                │    └─ ChoiceRow[] (text input + "set as correct" radio)
                ├─ ExplanationField
                └─ ImageUploadSlot   (Feature 3, embedded here)
```

**State design — central reducer, not scattered `useState`:**

Since questions need reordering, nested editing, and a clean save/diff story, model the whole exam as one normalized state tree with a reducer:

```jsx
// examEditorReducer.js
const initialState = {
  exam: null,        // { id?, title }
  sections: [],       // [{ id (temp or real), name, questions: [...] }]
  status: 'idle',     // 'idle' | 'parsing' | 'parse_error' | 'ready' | 'saving' | 'saved' | 'save_error'
  parseError: null,
};

function examEditorReducer(state, action) {
  switch (action.type) {
    case 'IMPORT_JSON_START':
      return { ...state, status: 'parsing', parseError: null };

    case 'IMPORT_JSON_SUCCESS':
      return {
        ...state,
        exam: action.payload.exam,
        sections: action.payload.sections,
        status: 'ready',
      };

    case 'IMPORT_JSON_ERROR':
      return { ...state, status: 'parse_error', parseError: action.payload };

    case 'UPDATE_QUESTION_FIELD': {
      const { sectionIndex, questionIndex, field, value } = action.payload;
      const sections = structuredClone(state.sections);
      sections[sectionIndex].questions[questionIndex][field] = value;
      return { ...state, sections };
    }

    case 'UPDATE_CHOICE_TEXT': {
      const { sectionIndex, questionIndex, choiceIndex, text } = action.payload;
      const sections = structuredClone(state.sections);
      sections[sectionIndex].questions[questionIndex].choices[choiceIndex].text = text;
      return { ...state, sections };
    }

    case 'SET_CORRECT_ANSWER': {
      const { sectionIndex, questionIndex, key } = action.payload;
      const sections = structuredClone(state.sections);
      sections[sectionIndex].questions[questionIndex].correctAnswer = key;
      return { ...state, sections };
    }

    case 'SET_QUESTION_IMAGE': {
      const { sectionIndex, questionIndex, imageUrl } = action.payload;
      const sections = structuredClone(state.sections);
      sections[sectionIndex].questions[questionIndex].imageUrl = imageUrl;
      return { ...state, sections };
    }

    case 'SAVE_START':
      return { ...state, status: 'saving' };
    case 'SAVE_SUCCESS':
      return { ...state, status: 'saved' };
    case 'SAVE_ERROR':
      return { ...state, status: 'save_error' };

    default:
      return state;
  }
}
```

**JSON parsing & normalization:**

```jsx
// normalizeExamJson.js
export function normalizeExamJson(raw) {
  const data = JSON.parse(raw); // throws on invalid JSON — caught by caller

  const examTitle = data.examTitle ?? data.title ?? 'Untitled Exam';
  const rawSections = data.sections ?? [{ sectionName: 'Section 1', questions: data.questions ?? [] }];

  const sections = rawSections.map((s, sIdx) => ({
    id: `temp-section-${sIdx}`,
    name: s.sectionName ?? s.name ?? `Section ${sIdx + 1}`,
    questions: (s.questions ?? []).map((q, qIdx) => ({
      id: q.id ?? `temp-q-${sIdx}-${qIdx}`,
      type: q.type ?? 'multiple_choice',
      passage: q.passage ?? '',
      questionText: q.questionText ?? q.text ?? '',
      choices: (q.choices ?? []).map((c) =>
        typeof c === 'string' ? { key: c[0], text: c } : { key: c.key, text: c.text }
      ),
      correctAnswer: q.correctAnswer ?? q.answer ?? null,
      explanation: q.explanation ?? '',
      imageUrl: q.imageUrl ?? null,
    })),
  }));

  return { exam: { title: examTitle }, sections };
}
```

**Import panel hookup:**

```jsx
function JsonImportPanel({ dispatch }) {
  const [raw, setRaw] = useState('');

  function handleParse() {
    dispatch({ type: 'IMPORT_JSON_START' });
    try {
      const { exam, sections } = normalizeExamJson(raw);
      dispatch({ type: 'IMPORT_JSON_SUCCESS', payload: { exam, sections } });
    } catch (err) {
      dispatch({ type: 'IMPORT_JSON_ERROR', payload: err.message });
    }
  }

  return (
    <div className="json-import-panel">
      <textarea
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder="Paste exam JSON here..."
        rows={10}
      />
      <button onClick={handleParse}>Parse &amp; Load</button>
    </div>
  );
}
```

**Saving — flatten state tree back to Supabase tables (upsert pattern):**

```jsx
async function saveExam(state, dispatch, currentUserEmail) {
  dispatch({ type: 'SAVE_START' });
  try {
    // 1. Upsert exam
    const { data: examRow, error: examErr } = await supabase
      .from('exams')
      .upsert({ id: state.exam.id, title: state.exam.title, created_by: currentUserEmail })
      .select()
      .single();
    if (examErr) throw examErr;

    for (const [sIdx, section] of state.sections.entries()) {
      const { data: sectionRow, error: sectionErr } = await supabase
        .from('exam_sections')
        .upsert({
          id: section.id.startsWith('temp-') ? undefined : section.id,
          exam_id: examRow.id,
          name: section.name,
          position: sIdx,
        })
        .select()
        .single();
      if (sectionErr) throw sectionErr;

      const questionRows = section.questions.map((q, qIdx) => ({
        id: q.id.startsWith('temp-') ? undefined : q.id,
        section_id: sectionRow.id,
        position: qIdx,
        type: q.type,
        passage: q.passage,
        question_text: q.questionText,
        choices: q.choices,
        correct_answer: q.correctAnswer,
        explanation: q.explanation,
        image_url: q.imageUrl,
      }));

      const { error: qErr } = await supabase.from('exam_questions').upsert(questionRows);
      if (qErr) throw qErr;
    }

    dispatch({ type: 'SAVE_SUCCESS' });
  } catch (err) {
    console.error(err);
    dispatch({ type: 'SAVE_ERROR' });
  }
}
```

> For MVP, batching every section/question as separate upserts is fine at typical SAT exam sizes (~150 questions). If this becomes a bottleneck, switch to a single RPC (`plpgsql` function) that accepts the whole JSON payload and writes it transactionally.

---

## 6. Feature 3 — Per-Question Image Upload (Supabase Storage)

### 6.1 Functional Requirements
- FR3.1: Each `QuestionCard` has an image upload control (file picker + drag-drop optional).
- FR3.2: On file selection, image uploads to Supabase Storage immediately (not deferred to exam save) and the resulting public URL populates `imageUrl` in editor state.
- FR3.3: Immediate inline preview (thumbnail) shown in the card after upload completes.
- FR3.4: Admin can remove/replace an image; replacing should not orphan storage indefinitely (delete-then-upload or use a stable per-question filename).
- FR3.5: Upload restricted to image MIME types and a reasonable size cap (e.g. 5MB) on the client, enforced again via a Storage bucket policy.

### 6.2 Implementation Spec — Storage Bucket & Policy

```sql
-- Run once via Supabase dashboard or SQL:
insert into storage.buckets (id, name, public)
values ('exam-question-images', 'exam-question-images', true)
on conflict (id) do nothing;
```

**Storage RLS policies** (storage policies live on `storage.objects`, scoped by bucket):

```sql
-- Anyone can READ (public bucket — images are embedded in exams students view)
create policy "Public read for exam images"
on storage.objects for select
to public
using ( bucket_id = 'exam-question-images' );

-- Only admins can INSERT/UPDATE/DELETE into this bucket
create policy "Admins can upload exam images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'exam-question-images'
  and public.is_admin(auth.jwt() ->> 'email')
);

create policy "Admins can update exam images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'exam-question-images'
  and public.is_admin(auth.jwt() ->> 'email')
);

create policy "Admins can delete exam images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'exam-question-images'
  and public.is_admin(auth.jwt() ->> 'email')
);
```

**File path convention** — use a stable, predictable path so re-uploads naturally overwrite instead of accumulating orphans:

```
exam-question-images/{examId}/{questionId}/{timestamp}-{originalFilename}
```

(Use `examId`/`questionId` if they already exist as real UUIDs; fall back to a temp client-generated UUID before first save, and re-key on save if needed — or simpler: generate the question's UUID client-side at import time rather than waiting for the DB round-trip, so the ID is stable from the start. Recommended: assign `crypto.randomUUID()` to every question in `normalizeExamJson` instead of `temp-q-...` strings, and use plain `upsert` without `id: undefined` stripping.)

### 6.3 Implementation Spec — React Upload Component

```jsx
// ImageUploadSlot.jsx
import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export function ImageUploadSlot({ examId, questionId, imageUrl, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please upload a PNG, JPG, WEBP, or GIF image.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('Image must be smaller than 5MB.');
      return;
    }

    setUploading(true);
    setError(null);

    const path = `${examId}/${questionId}/${Date.now()}-${file.name}`;

    const { error: uploadErr } = await supabase.storage
      .from('exam-question-images')
      .upload(path, file, { upsert: true, cacheControl: '3600' });

    if (uploadErr) {
      setError(uploadErr.message);
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('exam-question-images')
      .getPublicUrl(path);

    onUploaded(publicUrlData.publicUrl);
    setUploading(false);
  }

  async function handleRemove() {
    onUploaded(null);
    // Optional: also delete from storage. Requires storing the path
    // alongside the URL if you want a clean delete; otherwise leave the
    // orphaned file (cheap on storage cost) or run a periodic cleanup job.
  }

  return (
    <div className="image-upload-slot">
      {imageUrl ? (
        <div className="image-preview">
          <img src={imageUrl} alt="Question visual" style={{ maxWidth: 240, borderRadius: 8 }} />
          <button type="button" onClick={handleRemove}>Remove image</button>
        </div>
      ) : (
        <label className="upload-dropzone">
          {uploading ? 'Uploading...' : 'Click or drag an image here'}
          <input
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={handleFileChange}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
      )}
      {error && <p className="upload-error">{error}</p>}
    </div>
  );
}
```

**Wiring into `QuestionCard`:**

```jsx
function QuestionCard({ examId, sectionIndex, questionIndex, question, dispatch }) {
  return (
    <div className="question-card">
      {/* ...questionText, choices, etc... */}
      <ImageUploadSlot
        examId={examId}
        questionId={question.id}
        imageUrl={question.imageUrl}
        onUploaded={(url) =>
          dispatch({
            type: 'SET_QUESTION_IMAGE',
            payload: { sectionIndex, questionIndex, imageUrl: url },
          })
        }
      />
    </div>
  );
}
```

---

## 7. End-to-End Data Flow Summary

```
1. Root admin (emon11vk@gmail.com) signs in → seeded as root via SQL migration.
2. Root opens /admin/management → grants admin@example.com via GrantAdminForm
   → INSERT into admins → RLS checks is_root_admin(jwt.email) → passes → row created.
3. admin@example.com signs in with Google → auth.users row created
   → trigger syncs admins.user_id → useAdminRole() resolves isAdmin = true.
4. Admin opens /admin/exams/new → pastes JSON → normalizeExamJson() parses
   → examEditorReducer populates sections/questions → cards render.
5. Admin uploads an image inside a question card → Supabase Storage upload
   → public URL returned → SET_QUESTION_IMAGE updates reducer state → preview shown.
6. Admin clicks Save → saveExam() upserts exams → exam_sections → exam_questions
   → RLS on each table re-validates is_admin(jwt.email) → success.
7. Student-facing runtime (existing) reads exams/exam_questions via its own
   read-only RLS policy — unaffected by this PRD except for the new schema.
```

---

## 8. Open Questions / Decisions Needed Before Build

1. **Question ID stability** — recommend generating `crypto.randomUUID()` at JSON-parse time (not after first save) so image upload paths and upserts have a stable key from the start. Confirm this is acceptable vs. waiting on DB-generated IDs.
2. **Storage cleanup on image replace/remove** — decide if orphaned files in `exam-question-images` need a cleanup job, or if the cost is negligible enough to ignore for now.
3. **Multiple choice schema** — confirm whether all question types in the real JSON export are `multiple_choice`, or if free-response/grid-in SAT math questions need a different `type` and different `QuestionCard` rendering.
4. **Exam publish state** — this PRD doesn't define a `status` (draft/published) field. Confirm whether students should only see exams marked published, which would require adding a `status` column and adjusting the student-read RLS policy.

---

## 9. Acceptance Criteria Checklist

- [ ] `emon11vk@gmail.com` has root admin rights with no setup step required beyond running the migration.
- [ ] Root, and only root, can grant/revoke Admin role; verified by attempting the mutation as a non-root authenticated user and confirming RLS rejection.
- [ ] A non-existent Gmail account can be pre-granted Admin and gains access on first sign-in.
- [ ] Pasting valid exam JSON renders one card per question with editable fields.
- [ ] Pasting invalid JSON shows a clear inline error and does not crash the page.
- [ ] Each question card supports direct image upload, with immediate preview and persistence to `imageUrl` on save.
- [ ] All admin-only tables (`admins`, `exams`, `exam_sections`, `exam_questions`) and the `exam-question-images` storage bucket reject writes from non-admin authenticated users at the RLS layer (not just hidden in the UI).
