---
target: ExamManagerPanel.tsx
total_score: 28
p0_count: 0
p1_count: 1
timestamp: 2026-06-26T16-16-36Z
slug: src-components-admin-exammanagerpanel-tsx
---
#### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Good loading states, but no success toasts for actions. |
| 2 | Match System / Real World | 4 | Folder metaphor works well for organizing exams. |
| 3 | User Control and Freedom | 3 | Good cancel states for deletion and folder creation. |
| 4 | Consistency and Standards | 3 | Uses established Tailwind patterns, mostly consistent. |
| 5 | Error Prevention | 3 | Inline delete confirmation prevents accidental clicks. |
| 6 | Recognition Rather Than Recall | 4 | Search and folder structures keep information visible. |
| 7 | Flexibility and Efficiency | 2 | No bulk actions; no keyboard alternatives for drag-and-drop. |
| 8 | Aesthetic and Minimalist Design | 3 | Clean but slightly cluttered with borders and card actions. |
| 9 | Error Recovery | 2 | Relies on native browser `alert()` and `confirm()` for errors/warnings. |
| 10 | Help and Documentation | 1 | No inline guidance for complex actions like folder management. |
| **Total** | | **28/40** | **Good** |

#### Anti-Patterns Verdict

**LLM assessment**: The layout feels like a standard, solid admin interface, but it suffers from a few AI tells. The most obvious is the staggered entrance animation on every single exam card (`opacity: 0, y: 10`). This is a classic "animate because we can" reflex that adds unnecessary delay when lists re-render (e.g., during search).

**Deterministic scan**: The automated detector found 0 specific anti-pattern violations (clean scan).

**Visual overlays**: Deterministic scan unavailable in browser overlay (relied on source review and CLI detector).

#### Overall Impression
A highly functional, well-structured management panel that successfully implements complex features like drag-and-drop. The biggest opportunity is replacing native browser alerts with in-app UI and improving the accessibility of the drag-and-drop interactions.

#### What's Working
- **Inline Delete Confirmation**: The two-step delete process (Trash icon -> Confirm/Cancel) inside the card is much better than a generic modal.
- **Drag-and-Drop States**: The visual feedback when dragging over a folder (`border-primary bg-primary/5 ring-2`) clearly communicates the drop target.

#### Priority Issues

- **[P1] Native Browser Dialogs**: 
  - **Why it matters**: Using `window.confirm` for deleting folders and `alert()` for creation errors breaks the app's aesthetic and blocks the main thread.
  - **Fix**: Replace these with custom modals or inline confirmation states (similar to how exam deletion is handled).
  - **Suggested command**: `/impeccable harden`

- **[P2] Inaccessible Drag-and-Drop**: 
  - **Why it matters**: Users who rely on keyboards cannot move exams between folders, as the HTML5 drag-and-drop API is mouse-only here.
  - **Fix**: Add a secondary way to move exams (e.g., a "Move to..." dropdown menu in the card's action area).
  - **Suggested command**: `/impeccable adapt`

- **[P2] Meaningless Entrance Animations**: 
  - **Why it matters**: Staggering the entrance of every card on mount or search filter feels sluggish and is a clear AI template tell.
  - **Fix**: Remove the staggered `motion.div` entrance on the cards, or only trigger it on initial page load, not on every re-render.
  - **Suggested command**: `/impeccable quieter`

- **[P3] Lack of Bulk Actions**: 
  - **Why it matters**: Power users managing dozens of exams will find dragging them one-by-one tedious.
  - **Fix**: Introduce checkboxes for multi-select and a bulk "Move / Delete" toolbar.
  - **Suggested command**: `/impeccable shape`

#### Persona Red Flags

**Alex (Power User)**:
- Must move exams one by one; no bulk select.
- No keyboard shortcuts for frequent actions (e.g., creating a new folder).

**Sam (Accessibility-Dependent User)**:
- Completely locked out of organizing exams into folders because drag-and-drop is mouse-exclusive.
- Native `confirm()` dialogs can trap focus unexpectedly with screen readers.

#### Minor Observations
- The "Edit" button uses a blue tint, but the "New Folder" button uses a gray tint. The primary CTA hierarchy could be tighter.
- Empty states for folders could use a more illustrative, welcoming design rather than just dashed borders.

#### Questions to Consider
- "What if organizing exams was as easy via keyboard as it is with a mouse?"
- "Do we need the list to animate every time the user types a letter in the search box?"
