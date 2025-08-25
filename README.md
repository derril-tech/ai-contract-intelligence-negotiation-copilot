# Contract Intelligence & Negotiation Copilot

An AI-assisted copilot that ingests, drafts, redlines, negotiates, approves, and executes contracts with playbook-driven positions, clause-level risk scoring, counterparty stance analysis, and post-signature obligation tracking.

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- Python 3.11+

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd contract-intelligence-monorepo
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development environment**
   ```bash
   npm run dev
   ```

This will start all services:
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:3001
- **Orchestrator**: http://localhost:8000
- **MinIO Console**: http://localhost:9001
- **NATS Dashboard**: http://localhost:8222

## 🏗️ Architecture

### Monorepo Structure

```
├── apps/
│   ├── frontend/          # Next.js 14 React app
│   ├── gateway/           # NestJS API gateway
│   ├── orchestrator/      # FastAPI + CrewAI orchestrator
│   └── workers/           # Python Celery workers
├── packages/
│   └── sdk/              # Shared TypeScript SDK
└── docker-compose.dev.yml # Development environment
```

### Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui
- **API Gateway**: NestJS, TypeScript, Prisma, OpenAPI 3.1
- **Orchestrator**: FastAPI, CrewAI, Python 3.11
- **Workers**: Celery, Python 3.11, LangChain
- **Database**: PostgreSQL + pgvector
- **Cache**: Redis
- **Message Bus**: NATS
- **Storage**: MinIO (S3-compatible)
- **Infrastructure**: Docker, Docker Compose

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start all services
npm run dev:down         # Stop all services
npm run dev:logs         # View logs

# Building
npm run build           # Build all apps
npm run build:frontend  # Build frontend only
npm run build:gateway   # Build gateway only
npm run build:sdk       # Build SDK only

# Testing
npm run test            # Run all tests
npm run test:frontend   # Test frontend
npm run test:gateway    # Test gateway
npm run test:sdk        # Test SDK

# Linting
npm run lint            # Lint all code
npm run lint:frontend   # Lint frontend
npm run lint:gateway    # Lint gateway
npm run lint:sdk        # Lint SDK

# Database
npm run db:setup        # Setup database
npm run db:reset        # Reset database
```

### Individual App Development

#### Frontend (Next.js)
```bash
cd apps/frontend
npm run dev
```

#### Gateway (NestJS)
```bash
cd apps/gateway
npm run start:dev
```

#### Orchestrator (FastAPI)
```bash
cd apps/orchestrator
uvicorn main:app --reload
```

#### Workers (Celery)
```bash
cd apps/workers
celery -A celery_app worker --loglevel=info
```

## 📚 API Documentation

- **Gateway API**: http://localhost:3001/api
- **Orchestrator API**: http://localhost:8000/docs

## 🗄️ Database

The application uses PostgreSQL with pgvector extension for vector similarity search.

### Key Tables

- `orgs`, `users`, `memberships` - Tenancy & users
- `matters`, `agreements`, `files` - Core contract data
- `sections`, `clause_matches` - Document structure & analysis
- `library_clauses`, `playbooks` - Clause library & positions
- `redlines`, `comments`, `approvals` - Collaboration
- `risk_reports`, `obligations` - Risk & compliance
- `signatures`, `threads` - Execution & communication

## 🤖 AI Agents & Workers

### CrewAI Agents
- **Classifier** - Contract type classification
- **Clause Librarian** - Clause matching & library management
- **Redliner** - Playbook application & redline generation
- **Risk Analyst** - Risk scoring & exception detection
- **Privacy Counsel** - Privacy & compliance analysis
- **Security Auditor** - Security requirements review
- **Finance Controller** - Commercial terms analysis
- **Negotiation Strategist** - Stance analysis & strategy
- **Signature Coordinator** - Signature envelope preparation
- **Obligations Scribe** - Obligation extraction & tracking

### Background Workers
- `doc-ingest` - Document parsing & OCR
- `structure-parser` - Document structure analysis
- `clause-matcher` - Clause matching & alignment
- `playbook-engine` - Playbook application
- `redline-engine` - Redline generation & rendering
- `risk-engine` - Risk analysis & scoring
- `email-ingest` - Email thread processing
- `signature-adapter` - Signature provider integration
- `obligation-extractor` - Obligation extraction
- `report-generator` - Report generation
- `analytics-aggregator` - Analytics & metrics

## 🔐 Security

- JWT-based authentication
- Role-based access control (RBAC)
- Row-level security (RLS) in database
- Input validation & sanitization
- Rate limiting
- CORS configuration
- Environment variable management

## 📊 Monitoring & Observability

- Structured logging with correlation IDs
- OpenTelemetry tracing
- Prometheus metrics
- Sentry error tracking
- Health checks for all services

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API docs at http://localhost:3001/api

---

**Built with ❤️ by the Contract Intelligence Team**
