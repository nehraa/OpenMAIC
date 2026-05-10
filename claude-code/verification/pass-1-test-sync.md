# Pass 1: Test-Sync

**Status:** FAIL
**Time:** 2026-05-09T21:48:27+05:30
**Attempt:** 129

## Details

Missing test files for:\n\n- shared/types/assignment.ts (missing test)\n- student/app/api/auth/join/route.ts (missing test)\n- student/app/api/auth/me/route.ts (missing test)\n- student/app/api/student/assignments/[assignmentId]/route.ts (missing test)\n- student/app/api/student/assignments/route.ts (missing test)\n- student/app/api/student/classes/route.ts (missing test)\n- student/app/api/student/live-sessions/[sessionId]/completion/route.ts (missing test)\n- student/app/api/student/live-sessions/[sessionId]/join/route.ts (missing test)\n- student/app/api/student/live-sessions/[sessionId]/questions/route.ts (missing test)\n- student/app/api/student/live-sessions/[sessionId]/route.ts (missing test)\n- student/app/api/student/live-sessions/route.ts (missing test)\n- student/app/api/student/sessions/[sessionId]/completion/route.ts (missing test)\n- student/app/api/student/sessions/[sessionId]/questions/route.ts (missing test)\n- student/app/api/student/sessions/[sessionId]/route.ts (missing test)\n- student/app/page.tsx (missing test)\n- student/lib/auth/jwt.ts (missing test)\n- student/lib/auth/require-auth.ts (missing test)\n- student/lib/db/index.ts (missing test)\n- student/middleware/auth.ts (missing test)\n- teacher/app/(dashboard)/progress/page.tsx (missing test)\n- teacher/app/(dashboard)/sessions/[sessionId]/progress/page.tsx (missing test)\n- teacher/app/(dashboard)/usage/page.tsx (missing test)\n- teacher/app/api/auth/login/route.ts (missing test)\n- teacher/app/api/auth/logout/route.ts (missing test)\n- teacher/app/api/auth/me/route.ts (missing test)\n- teacher/app/api/auth/signup/route.ts (missing test)\n- teacher/app/api/auth/verify-otp/route.ts (missing test)\n- teacher/app/api/progress/teacher/route.ts (missing test)\n- teacher/app/api/teacher/assignments/[assignmentId]/recipients/route.ts (missing test)\n- teacher/app/api/teacher/assignments/[assignmentId]/schedule/route.ts (missing test)\n- teacher/app/api/teacher/classes/[classId]/students/import-csv/route.ts (missing test)\n- teacher/app/api/teacher/library/assets/route.ts (missing test)\n- teacher/app/api/teacher/students/route.ts (missing test)\n- teacher/app/page.tsx (missing test)\n- teacher/app/teacher/assignments/[assignmentId]/page.tsx (missing test)\n- teacher/app/teacher/assignments/page.tsx (missing test)\n- teacher/app/teacher/classes/page.tsx (missing test)\n- teacher/app/teacher/quizzes/[quizId]/edit/page.tsx (missing test)\n- teacher/app/teacher/students/page.tsx (missing test)\n- teacher/components/ui/progress.tsx (missing test)\n- teacher/lib/auth/otp.ts (missing test)\n- teacher/lib/auth/require-auth.ts (missing test)\n- teacher/lib/components/assignment-form.tsx (missing test)\n- teacher/lib/components/progress-grid.tsx (missing test)\n- teacher/lib/db.ts (missing test)\n- teacher/lib/db/index.ts (missing test)\n- teacher/lib/test-setup.ts (missing test)\n- teacher/middleware/auth.ts (missing test)\n\n\n### Instructions to Pass\n\n1. Create test file for each missing test\n2. Write minimum viable test (happy path)\n3. Run tests to verify they pass\n4. Commit tests before proceeding

## Changed Files

```\nnode_modules/.modules.yaml
node_modules/.pnpm-workspace-state-v1.json
node_modules/.pnpm/eslint-config-next@16.1.2_@typescript-eslint+parser@8.59.0_eslint@9.39.4_jiti@2.6.1__ty_4f17397e722633668ba39b369c634621/node_modules/eslint-config-next/node_modules/.bin/eslint
node_modules/.pnpm/eslint-config-next@16.1.2_@typescript-eslint+parser@8.59.0_eslint@9.39.4_jiti@2.6.1__ty_4f17397e722633668ba39b369c634621/node_modules/eslint-config-next/node_modules/.bin/tsc
node_modules/.pnpm/eslint-config-next@16.1.2_@typescript-eslint+parser@8.59.0_eslint@9.39.4_jiti@2.6.1__ty_4f17397e722633668ba39b369c634621/node_modules/eslint-config-next/node_modules/.bin/tsserver
node_modules/.pnpm/eslint-config-next@16.1.2_eslint@9.39.4_jiti@2.6.1__typescript@5.9.3/node_modules/eslint-config-next/node_modules/.bin/eslint
node_modules/.pnpm/eslint-config-next@16.1.2_eslint@9.39.4_jiti@2.6.1__typescript@5.9.3/node_modules/eslint-config-next/node_modules/.bin/tsc
node_modules/.pnpm/eslint-config-next@16.1.2_eslint@9.39.4_jiti@2.6.1__typescript@5.9.3/node_modules/eslint-config-next/node_modules/.bin/tsserver
node_modules/.pnpm/eslint-config-next@16.1.2_eslint@9.39.4_jiti@2.6.1__typescript@5.9.3/node_modules/typescript-eslint
node_modules/.pnpm/eslint-import-resolver-typescript@3.10.1_eslint-plugin-import@2.32.0_eslint@9.39.4_jiti@2.6.1_/node_modules/eslint-import-resolver-typescript/node_modules/.bin/eslint
node_modules/.pnpm/eslint-import-resolver-typescript@3.10.1_eslint-plugin-import@2.32.0_eslint@9.39.4_jiti@2.6.1_/node_modules/eslint-plugin-import
node_modules/.pnpm/eslint-module-utils@2.12.1_@typescript-eslint+parser@8.59.0_eslint@9.39.4_jiti@2.6.1__t_3fe485b779eeb132c948772f9c13a888/node_modules/eslint-module-utils/node_modules/.bin/eslint
node_modules/.pnpm/eslint-plugin-import@2.32.0_@typescript-eslint+parser@8.59.0_eslint@9.39.4_jiti@2.6.1___3b7c8ecaf57edc8753febcfe8d71bd0c/node_modules/eslint-plugin-import/node_modules/.bin/eslint
node_modules/.pnpm/eslint-plugin-import@2.32.0_@typescript-eslint+parser@8.59.0_eslint@9.39.4_jiti@2.6.1___3b7c8ecaf57edc8753febcfe8d71bd0c/node_modules/eslint-plugin-import/node_modules/.bin/semver
node_modules/.pnpm/eslint-plugin-import@2.32.0_eslint-import-resolver-typescript@3.10.1_eslint@9.39.4_jiti@2.6.1_/node_modules/eslint-module-utils
node_modules/.pnpm/eslint-plugin-import@2.32.0_eslint-import-resolver-typescript@3.10.1_eslint@9.39.4_jiti@2.6.1_/node_modules/eslint-plugin-import/node_modules/.bin/eslint
node_modules/.pnpm/eslint-plugin-import@2.32.0_eslint-import-resolver-typescript@3.10.1_eslint@9.39.4_jiti@2.6.1_/node_modules/eslint-plugin-import/node_modules/.bin/semver
node_modules/.pnpm/eslint@9.39.4_jiti@2.6.1/node_modules/eslint/node_modules/.bin/jiti
node_modules/.pnpm/lock.yaml
node_modules/.pnpm/node_modules/.bin/acorn
node_modules/.pnpm/node_modules/.bin/baseline-browser-mapping
node_modules/.pnpm/node_modules/.bin/browserslist
node_modules/.pnpm/node_modules/.bin/eslint
node_modules/.pnpm/node_modules/.bin/jiti
node_modules/.pnpm/node_modules/.bin/js-yaml
node_modules/.pnpm/node_modules/.bin/jsesc
node_modules/.pnpm/node_modules/.bin/json5
node_modules/.pnpm/node_modules/.bin/loose-envify
node_modules/.pnpm/node_modules/.bin/nanoid
node_modules/.pnpm/node_modules/.bin/next
node_modules/.pnpm/node_modules/.bin/node-which
node_modules/.pnpm/node_modules/.bin/parser
node_modules/.pnpm/node_modules/.bin/prebuild-install
node_modules/.pnpm/node_modules/.bin/prettier
node_modules/.pnpm/node_modules/.bin/rc
node_modules/.pnpm/node_modules/.bin/resolve
node_modules/.pnpm/node_modules/.bin/semver
node_modules/.pnpm/node_modules/.bin/tsc
node_modules/.pnpm/node_modules/.bin/tsserver
node_modules/.pnpm/node_modules/.bin/update-browserslist-db
node_modules/.pnpm/node_modules/@typescript-eslint/eslint-plugin
node_modules/.pnpm/node_modules/@typescript-eslint/parser
node_modules/.pnpm/node_modules/@typescript-eslint/project-service
node_modules/.pnpm/node_modules/@typescript-eslint/scope-manager
node_modules/.pnpm/node_modules/@typescript-eslint/tsconfig-utils
node_modules/.pnpm/node_modules/@typescript-eslint/type-utils
node_modules/.pnpm/node_modules/@typescript-eslint/types
node_modules/.pnpm/node_modules/@typescript-eslint/typescript-estree
node_modules/.pnpm/node_modules/@typescript-eslint/utils
node_modules/.pnpm/node_modules/@typescript-eslint/visitor-keys
node_modules/.pnpm/node_modules/eslint-config-next
node_modules/.pnpm/node_modules/eslint-module-utils
node_modules/.pnpm/node_modules/eslint-plugin-import
node_modules/.pnpm/node_modules/globals
node_modules/.pnpm/node_modules/next
node_modules/.pnpm/node_modules/typescript-eslint
node_modules/.pnpm/prebuild-install@7.1.3/node_modules/node-abi
node_modules/.pnpm/prebuild-install@7.1.3/node_modules/prebuild-install/node_modules/.bin/rc
node_modules/.pnpm/sharp@0.34.5/node_modules/sharp/node_modules/.bin/semver
package.json
pnpm-lock.yaml
postgres/migrations/002_rls_policies.sql
shared/types/assignment.ts
student/app/api/auth/join/route.ts
student/app/api/auth/me/route.ts
student/app/api/student/assignments/[assignmentId]/route.ts
student/app/api/student/assignments/route.ts
student/app/api/student/classes/route.ts
student/app/api/student/live-sessions/[sessionId]/completion/route.ts
student/app/api/student/live-sessions/[sessionId]/join/route.ts
student/app/api/student/live-sessions/[sessionId]/questions/route.ts
student/app/api/student/live-sessions/[sessionId]/route.ts
student/app/api/student/live-sessions/route.ts
student/app/api/student/sessions/[sessionId]/completion/route.ts
student/app/api/student/sessions/[sessionId]/questions/route.ts
student/app/api/student/sessions/[sessionId]/route.ts
student/app/page.tsx
student/lib/auth/jwt.ts
student/lib/auth/require-auth.ts
student/lib/db/index.ts
student/middleware/auth.ts
student/package.json
teacher/app/(dashboard)/progress/page.tsx
teacher/app/(dashboard)/sessions/[sessionId]/progress/page.tsx
teacher/app/(dashboard)/usage/page.tsx
teacher/app/api/auth/login/route.ts
teacher/app/api/auth/logout/route.ts
teacher/app/api/auth/me/route.ts
teacher/app/api/auth/signup/route.ts
teacher/app/api/auth/verify-otp/route.ts
teacher/app/api/progress/teacher/route.ts
teacher/app/api/teacher/assignments/[assignmentId]/recipients/route.ts
teacher/app/api/teacher/assignments/[assignmentId]/schedule/route.ts
teacher/app/api/teacher/classes/[classId]/students/import-csv/route.ts
teacher/app/api/teacher/library/assets/route.ts
teacher/app/api/teacher/students/route.ts
teacher/app/page.tsx
teacher/app/teacher/assignments/[assignmentId]/page.tsx
teacher/app/teacher/assignments/page.tsx
teacher/app/teacher/classes/page.tsx
teacher/app/teacher/quizzes/[quizId]/edit/page.tsx
teacher/app/teacher/students/page.tsx
teacher/claude-code/plan/FIX_REQUEST.md
teacher/claude-code/verification/attempt-count.txt
teacher/claude-code/verification/current-failures.json
teacher/components/ui/progress.tsx
teacher/lib/auth/otp.ts
teacher/lib/auth/require-auth.ts
teacher/lib/components/assignment-form.tsx
teacher/lib/components/progress-grid.tsx
teacher/lib/db.ts
teacher/lib/db/index.ts
teacher/lib/server/assignments.ts
teacher/lib/server/quizzes.ts
teacher/lib/test-setup.ts
teacher/middleware/auth.ts
teacher/package.json
```

---
**Next:** BLOCKED - Fix required before proceeding
