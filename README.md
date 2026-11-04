# PopoCarry

Source snapshot of `C:/popocarry`, uploaded on 2026-11-04 (Asia/Seoul).

## Local setup

1. Install Node.js and run `npm ci`.
2. Copy `.env.example` to `.env.local` and supply your own settings.
3. Run `npm run db:generate`.
4. For a new empty local database only, set `DATABASE_URL` in your shell and run `npx prisma db push`. Prisma CLI does not automatically load `.env.local`. Do not run this against an existing database without a backup and schema review.
5. Run `npm run dev` or `npm run build` then `npm start`.

Existing database contents, credentials, uploaded files, logs, QA databases and build outputs are deliberately excluded. This repository is a source snapshot, not a full data backup.

TypeScript check passed before upload. See IMPLEMENTATION_NOTES.md for implementation limitations. VERIFICATION_CURRENT.json records earlier isolated checks with mocked payment responses; it does not prove live payment or OAuth readiness.
