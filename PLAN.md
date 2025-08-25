# Project Plan — Contract Intelligence & Negotiation Copilot

## Current Goal
Ship an MVP that runs end‑to‑end: **upload → ingest/parse → classify → clause match → auto‑redline w/ rationale → risk report → approvals → signature → obligations extraction**.  
Local dev via `docker-compose` (Postgres+pgvector, Redis, NATS, MinIO). FE on Vercel; APIs/workers on Render for MVP.

## 80/20 Build Strategy
- **80% [Cursor]**: monorepo/infra, DB schema + migrations, REST/OpenAPI, WS events, FE (Redline editor, Risk, Approvals, Signature, Obligations, Library/Playbooks), signature adapters (stubs), doc renderers, CI/CD, observability, RBAC/RLS.
- **20% [Claude]**: CrewAI agent graphs (Classifier, Librarian, Redliner, Risk/Privacy/Security/Finance, Negotiation, Signature, Obligations), prompt packs, clause‑matching heuristics, playbook logic templates, risk/exception detectors wording, stance analysis prompts.

## Next 3 Tasks
1. **[Cursor]** Monorepo scaffold + `docker-compose.dev` (pgvector/Redis/NATS/MinIO) + `.env.example` + GitHub Actions (lint/test/build, SBOM+sign).
2. **[Cursor]** NestJS gateway modules: auth, matters/agreements/files/ingest, library/playbooks, matching/redline, risk, comments/approvals, signature, obligations; OpenAPI 3.1, Problem+JSON, Idempotency.
3. **[Claude]** Orchestrator (FastAPI + CrewAI) FSM `created→ingesting→classifying→matching→redlining→reviewing→approving→signing→executed→obligations` + tool adapters (RAG.search, Playbook.apply, Redline.diff, Risk.score, Policy.check, Email.analyze, Signature.prepare/status, Obligation.extract).

## Phase Plan
- **P0** Repo/infra/CI + rule docs  
- **P1** Contracts: DB + API + auth/RLS  
- **P2** Ingest & structure parse (outline/sections)  
- **P3** Clause library, playbooks, matcher  
- **P4** Playbook engine + redline diff + DOCX/PDF render + editor UI  
- **P5** Risk scoring & exceptions (privacy/security/finance lanes)  
- **P6** Comments, approvals, SLAs & notifications  
- **P7** Email inbox & stance analysis  
- **P8** Signature adapters & webhooks  
- **P9** Obligations/renewals (calendar/alerts)  
- **P10** Reports/exports + analytics  
- **P11** Hardening, tests, deploy, cost guardrails

## Definition of Done (MVP)
- Upload DOCX/PDF → parsed to sections with anchors; type classified.
- Library/playbook CRUD; matches for common clauses with confidence.
- Auto‑redline draft with margin rationale; DOCX/PDF exports (track changes).
- Risk report (category breakdown + exceptions) visible in UI.
- Approval flow with role gates; decision logs; WS updates.
- Signature envelope (DocuSign/Adobe adapter) created; status streamed; executed pack stored.
- Obligations extracted to a table + renewal calendar; ICS export.
