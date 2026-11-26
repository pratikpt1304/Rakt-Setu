# Prompts to paste into Antigravity

## 1. Master prompt (paste once, in Agent Manager, with this folder open as the workspace)
You are building RaktSetu Live. Read AGENTS.md, docs/SPEC.md and docs/BUILD_PLAN.md completely before doing anything. Then:
1. Summarise the product and the plan back to me in under 10 lines.
2. List anything you need from me (accounts, keys) using docs/HUMAN_TASKS.md.
3. Start Phase 0. After each phase, run the verify-before-done skill, update the checkboxes in docs/BUILD_PLAN.md, report what you verified and what you could not, and stop and wait for me to say "next phase".
Follow every rule in AGENTS.md. Do not invent real blood banks or data.

## 2. One phase at a time
Run the /build-raktsetu workflow for Phase N.

## 3. When something breaks
Reproduce the problem first and show me the exact error. Find the root cause. Fix only that. Re-run typecheck and build, then tell me what you changed and why.

## 4. Security review (run before launch)
Review the whole repo against .agents/rules/security.md and supabase/schema.sql. Try to break it: list every way an anonymous or staff user could read or write data they should not. Report findings as a table with severity, then fix the real issues.

## 5. Design review
Open the site at 375px width. List anything that is hard to read, hard to tap, or confusing for a panicked first-time user. Fix the top five problems without adding new features.
