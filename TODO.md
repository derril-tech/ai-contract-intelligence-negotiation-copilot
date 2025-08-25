# TODO — Contract Intelligence & Negotiation Copilot
> 80/20 split: **[Cursor]** scaffolds, contracts, FE, infra; **[Claude]** agent graphs/prompts, clause/playbook heuristics, risk/stance logic.

---

## Phase 0 — Repo, Rules, CI ✅
- [x] [Cursor] Monorepo: `apps/{frontend,gateway,orchestrator,workers}`, `packages/{sdk}`; ESLint/Prettier/TS configs.
- [x] [Cursor] Add `PLAN.md`, `ARCH.md`, `TODO.md`, `DECISIONS.log`, `RULES-INDEX.md`.
- [x] [Cursor] `docker-compose.dev.yml`: Postgres+pgvector, Redis, NATS, MinIO; healthchecks; seed script.
- [x] [Cursor] `env.example` for DB/Redis/NATS/S3/JWT/OAuth/Signature providers.
- [x] [Cursor] Basic project structure and configuration files.

## Phase 1 — DB & API Contracts ✅
- [x] [Cursor] Prisma/SQL migrations for all tables listed in ARCH (tenancy, matters, agreements, versions/sections, clause_matches, library/playbooks, redlines, comments, approvals, risk_reports, obligations, threads/messages, signatures, integrations, audit, costs).
- [x] [Cursor] NestJS modules:
  - Auth (Auth.js callbacks), RBAC guards, RLS enforcement per org/matter.
  - Matters/Agreements: CRUD, file upload (signed S3 URLs), ingest trigger.
  - Library/Playbooks CRUD + search.
  - Matching/Redline, Risk, Comments/Approvals, Email Threads, Signature, Obligations, Exports.
  - OpenAPI 3.1, Problem+JSON, Idempotency middleware.
- [x] [Cursor] Generate typed SDKs (`packages/sdk`) for FE/workers.

## Phase 2 — Ingest & Structure Parse ✅
- [x] [Cursor] `doc-ingest` worker: DOCX/PDF → text/XML; OCR fallback; upload normalized DOCX; persist `files`.
- [x] [Cursor] `structure-parser`: headings/numbering/tables/exhibits; `sections` + page anchors; NATS progress events.
- [x] [Cursor] FE **Uploader** + **OutlineViewer**; ingest progress; section preview with anchors.
- [x] [Claude] Prompt templates for structural salvage; table/footnote handling hints.

## Phase 3 — Library, Playbooks, Matching ✅
- [x] [Cursor] Library UI (list/search), Playbooks UI (positions editor with preferred/fallback/unacceptable, risk weights, jurisdiction overrides).
- [x] [Cursor] `clause-matcher` worker: hybrid vector+rules; coverage/confidence; write `clause_matches`.
- [x] [Cursor] `GET /v1/library/search?q=&k=`; embeddings for library_clauses.
- [x] [Claude] Clause taxonomy, matching heuristics, jurisdictional aliases & canonicalization prompts.

## Phase 4 — Playbook Engine & Redline ✅
- [x] [Cursor] `playbook-engine` + `redline-engine`: select position → compose normalized change_set (insert/delete/replace + comments).
- [x] [Cursor] DOCX/PDF renderer w/ tracked‑changes; watermark drafts; signed URLs.
- [x] [Cursor] FE **RedlineEditor** (3‑pane: doc view, ClauseSidebar, RiskPanel lite); accept/reject ops; keyboard nav.
- [x] [Claude] Redline rationale phrasing, fallback escalation logic, negotiation talking points per clause.

## Phase 5 — Risk & Exceptions ✅
- [x] [Cursor] `risk-engine`: weighted category scores (legal/privacy/security/commercial); exception detectors (regex + rules); `risk_reports` CRUD.
- [x] [Cursor] FE **RiskPanel**: per‑clause risks, exceptions list, mitigations; link to sections.
- [x] [Claude] Exception pattern library (auto‑renew traps, MFN, step‑downs, one‑sided indemnity), mitigation text templates.

## Phase 6 — Comments, Approvals, SLAs ✅
- [x] [Cursor] Comments API + FE **CommentThread** (inline anchors).
- [x] [Cursor] Approvals API: create gates by role; approve/reject with notes; SLA countdown; WS `approval:{id}:status`.
- [x] [Cursor] Notifications (email/Slack webhooks) + reminders.
- [x] [Claude] Policy blocker messages & escalation copy.

## Phase 7 — Email Inbox & Stance ✅
- [x] [Cursor] `email-ingest` worker: thread model + manual paste/import; store in `threads/messages`.
- [x] [Cursor] FE **Inbox/ThreadViewer**; unresolved issues list.
- [x] [Claude] `Email.analyze` stance summary + sentiment; draft response snippets aligned to playbook.

## Phase 8 — Signature ✅
- [x] [Cursor] `signature-adapter` (DocuSign/Adobe stubs): envelope create, recipients/routing, webhook receiver → update `signatures`.
- [x] [Cursor] FE **SignatureHub**: roles/fields, preview, status stream, executed pack download.
- [x] [Claude] Validation prompts for role/sequence sanity; "ready to send" checklist.

## Phase 9 — Obligations & Renewals ✅
- [x] [Cursor] `obligation-extractor`: NER + rules; create obligations with owner/due_at/source anchor; renewal pipeline; ICS export.
- [x] [Cursor] FE **ObligationTable** + **RenewalCalendar**; snooze/escalate; CSV/ICS export.
- [x] [Claude] Obligation phrasing normalization; owner assignment heuristics.

## Phase 10 — Reports, Exports, Analytics ✅
- [x] [Cursor] `report-generator`: risk report, approval pack, comparison summary; watermarks; bundle ZIP.
- [x] [Cursor] FE **AnalyticsDash**: cycle time, auto‑accept %, risk distribution, renewal pipeline (filters by type/region).
- [x] [Claude] Executive summary templates & rationale snippets.

## Phase 11 — Hardening, Deploy, Tests, Observability ✅
- [x] [Cursor] RBAC/RLS audits; secrets vault; log redaction; legal holds & retention policies; draft vs. executed lifecycle rules.
- [x] [Cursor] Observability: OTel traces; Sentry; dashboards for redline latency, risk report latency, approval SLA breaches, signature webhook lag.
- [x] [Cursor] Cost guardrails: token buckets per org & per agreement; job concurrency caps.
- [x] [Cursor] Testing:
  - Unit: parser, matcher, redline composer, risk detectors, obligation extractor.
  - Contract: OpenAPI.
  - E2E: ingest→redline→review→approve→sign→obligations (Playwright).
  - Load: concurrent redlines/risk reports (k6).
  - Chaos: LLM latency; signature webhook delay.
  - Security: ZAP; document sanitizer tests; webhook sig validation.
- [x] [Cursor] Deploy: Vercel FE; Render/Fly APIs/workers; Neon PG; Upstash Redis; R2/S3; NATS managed.

## Ongoing
- [Cursor] Keep `DECISIONS.log` and `PLAN.md` next‑3‑tasks current.
- [Claude] Iterate prompts to improve clause coverage, risk precision, negotiation tone, and obligations recall.
