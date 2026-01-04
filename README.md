# National Police Department Management System (NPDMS)

## Overview
NPDMS is a federated, edge-first police management system designed for nationwide deployment across India.

## Architecture
- **Edge-First**: Police stations operate fully offline
- **Federated**: No monolithic central system  
- **AI-Assisted**: Human authority always retained
- **Zero Trust**: Never trust, always verify

## Quick Start
```bash
make setup-dev     # Setup development environment
make start-dev     # Start all services
make test          # Run tests
```

## Project Structure
```
npdms/
├── services/     # Backend microservices (Go)
├── ai/           # AI/ML services (Python)
├── ui/           # Frontend applications (Next.js)
├── infra/        # Infrastructure as Code
├── edge/         # Edge deployment packages
├── docs/         # Documentation
└── scripts/      # Development scripts
```

## Documentation
See `docs/architecture/` for complete system documentation:
- PHASE_0_SYSTEM_BLUEPRINT.md
- PHASE_1_UI_UX_DESIGN.md
- PHASE_2_DEVELOPMENT_PLAN.md
- PHASE_3_PROJECT_STRUCTURE.md
- PHASE_4_TECH_STACK.md
- PHASE_5_AI_IMPLEMENTATION.md
- PHASE_6_DEVSECOPS.md
- PHASE_7_SELF_AUDIT.md

## License
RESTRICTED - Government of India
