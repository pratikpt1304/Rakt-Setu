---
description: Build one phase of RaktSetu Live from docs/BUILD_PLAN.md, verify it, and report.
---
Usage: /build-raktsetu <phase number>

1. Read AGENTS.md, docs/SPEC.md and the requested phase in docs/BUILD_PLAN.md.
2. Write a short plan for the phase and list what you need from the human.
3. Implement the tasks in order, following the rules in .agents/rules/.
4. For database changes, follow the supabase-migrations skill.
5. Run the verify-before-done skill and fix failures.
6. Tick the finished boxes in docs/BUILD_PLAN.md.
7. Report using the format in verify-before-done, then stop and wait for the human.
