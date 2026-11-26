---
name: verify-before-done
description: Use before reporting any task or phase of RaktSetu Live as finished. A checklist of commands and manual checks, and the format for the final report.
---
# Verify before done

Run, and show the output of:
1. `npm run typecheck`
2. `npm run build`
3. `npm test` (once tests exist)

Then check in the browser:
- 375px width: nothing overflows, buttons are easy to tap.
- Keyboard only: tab order makes sense and focus is visible.
- The public page works with no login and no console errors.
- Anything touching data: confirm with the RLS tests or by trying the forbidden action as anon and as the wrong staff user.

Final report (keep it short):
- Changed: files and behaviour.
- Verified: what you actually ran and saw.
- Not verified: anything you could not test (say why, e.g. needs real Supabase project).
- Needs the human: accounts, keys, real-world steps.
Never say "done" if a command failed or a check was skipped without saying so.
