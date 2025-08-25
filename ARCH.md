# Architecture Overview — Contract Intelligence & Negotiation Copilot

## Topology
- **Frontend**: Next.js 14 (Vercel), TS, shadcn/Tailwind, TanStack Query + Zustand, TipTap/ProseMirror (tracked changes), custom diff renderer, WS/SSE, Recharts.
- **API Gateway**: NestJS (REST, RBAC, OpenAPI 3.1, rate limits, Idempotency, Problem+JSON).
- **Auth**: Auth.js + JWT (short‑lived) + refresh; SAML/OIDC; SCIM.
- **Orchestrator**: FastAPI + CrewAI; FSM `created→ingesting→classifying→matching→redlining→reviewing→approving→signing→executed→obligations`.
- **Workers (Python)**: `doc-ingest`, `structure-parser`, `clause-matcher`, `playbook-engine`, `redline-engine`, `risk-engine`, `email-ingest`, `signature-adapter`, `obligation-extractor`, `report-generator`, `analytics-aggregator`.
- **Infra**: NATS bus; Celery (Redis/NATS backend); Postgres + pgvector; S3/R2; Redis (Upstash); WS gateway; OTel + Prometheus/Grafana + Sentry; Vault/KMS.

## Core Data (Postgres)
Tenancy (orgs/users/memberships); matters, agreements (status, metadata), files, agreement_versions, sections, clause_matches; library_clauses; playbooks & positions; redlines (normalized change sets + DOCX/PDF keys); comments; approvals; risk_reports; obligations; threads/messages; signatures; integrations; audit_log; costs.

## API Surface (v1)
- **Matters/Agreements**: create/list, file upload, ingest, status.
- **Redline & Risk**: match, redline (by playbook), risk report, signed export URLs.
- **Library/Playbooks**: CRUD + search + positions.
- **Comments/Approvals**: threads, decisions, due dates, SLAs.
- **Email & Signature**: threads/messages; envelope prepare + status webhooks.
- **Obligations**: extract, CRUD, ICS export.
- **Exports**: risk/approval pack; executed bundle.
Conventions: Idempotency‑Key on writes; Problem+JSON errors; cursor pagination; signed URLs; strict RLS by org/matter.

## Orchestration & Agents
Agents: **Classifier, Clause Librarian, Redliner, Risk Analyst, Privacy Counsel, Security Auditor, Finance Controller, Negotiation Strategist, Signature Coordinator, Obligations Scribe**.  
Tools: **RAG.search**, **Playbook.apply**, **Redline.diff**, **Risk.score**, **Policy.check**, **Email.analyze**, **Signature.prepare/status**, **Obligation.extract**.

## Realtime
WS channels: `agreement:{id}:progress`, `agreement:{id}:risk`, `agreement:{id}:comments`, `approval:{id}:status`, `signature:{id}:status`. SSE fallback; presence in editor/review.

## Security & Safety
RBAC roles (Owner/Admin/Counsel/DealDesk/Privacy/Security/Finance/Viewer); Postgres RLS; secrets vaulted; tokens envelope‑encrypted; immutable audit; watermarking for drafts; PII/DLP scans; legal holds & retention.

## Deployment
FE: Vercel. APIs/Workers: Render/Fly (MVP) → GKE (scale). DB: Neon/Cloud SQL + pgvector (PITR). Cache: Upstash Redis. Storage: S3/R2. Bus: NATS. CI/CD: GitHub Actions; Terraform; SBOM + cosign.
