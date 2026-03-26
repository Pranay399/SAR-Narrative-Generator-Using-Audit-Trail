# SAR Narrative Generator — Backend

A production-grade FastAPI backend for automated Suspicious Activity Report (SAR) generation using a local AML processing engine, LangChain orchestration, and local Ollama LLMs.

## Tech Stack

| Component | Technology |
|---|---|
| API | FastAPI + Uvicorn |
| Database | PostgreSQL + SQLAlchemy |
| Data Processing | Apache PySpark |
| ML Tracking | MLflow |
| LLM Orchestration | LangChain + LlamaIndex |
| Vector Store | ChromaDB |
| Local LLMs | Ollama (llama3.1 + mistral) |

## Prerequisites

1. **Python 3.10+**
2. **PostgreSQL** — create a database called `sar_db`
3. **Java 8+** — required for PySpark  
4. **Ollama** — running with `llama3.1` and `mistral` models pulled:
   ```bash
   ollama pull llama3.1
   ollama pull mistral
   ollama pull nomic-embed-text
   ```

## Setup

```bash
# 1. Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate   # Windows

# 2. Configure environment
copy .env.example .env
# Edit .env with your PostgreSQL credentials

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Visit `http://localhost:8000/docs` for the interactive Swagger UI.

## API Endpoints

| Method | Path | Description | Role |
|---|---|---|---|
| POST | `/api/v1/auth/token` | Login & get JWT | All |
| POST | `/api/v1/auth/register` | Create new user | Compliance Officer |
| POST | `/api/v1/upload/` | Upload CSV/JSON case file | All |
| GET | `/api/v1/cases/` | List cases (RBAC filtered) | All |
| GET | `/api/v1/cases/{id}` | View SAR for a case | All |
| PATCH | `/api/v1/cases/{id}/narrative` | Edit the SAR narrative | All |
| GET | `/api/v1/cases/{id}/download` | Download SAR report | All |
| GET | `/api/v1/explanation/{id}` | AI explanation of flags | All |

## Project Structure

```
app/
├── main.py                   # FastAPI entrypoint
├── core/
│   ├── config.py             # Settings & env vars
│   └── security.py           # JWT & password hashing
├── db/
│   ├── database.py           # SQLAlchemy DB session
│   └── models.py             # User, CaseData, AuditLog tables
├── api/
│   ├── dependencies.py       # Auth & RBAC dependencies
│   └── routes/
│       ├── auth.py           # Login & user management
│       ├── upload.py         # File upload + pipeline trigger
│       ├── cases.py          # View/Edit/Download SAR
│       └── explanation.py    # AI explanation via SHAP + Mistral
└── engine/
│   ├── processing.py         # PySpark AML feature engineering
│   └── tracking.py           # MLflow experiment logging
└── llm/
    ├── rag.py                # LlamaIndex + ChromaDB RAG pipeline
    └── chains.py             # LangChain Ollama orchestration
```

## AML Features Detected

- **Smurfing**: Multiple transactions just below reporting threshold (₹10,000)
- **Rapid Movement**: Transactions within 1 hour of each other
- **Foreign Transfer Risk**: Transactions to foreign destinations
- **High Value Transactions**: Transactions above ₹10,000
- **Transaction Frequency Score**: Total count per account
