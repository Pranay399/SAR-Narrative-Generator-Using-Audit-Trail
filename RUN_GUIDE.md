# SAR Narrative Generator: Project Execution Guide

A full-stack AML detection and SAR (Suspicious Activity Report) generation system powered by **Next.js 15**, **FastAPI**, **PySpark (Pandas Fallback)**, and **Llama 3.1**.

## 🛠️ Prerequisites

1.  **Python 3.11+**
2.  **Node.js 20+** (v18+ may work)
3.  **Ollama**: Install from [ollama.com](https://ollama.com/)
    - Run: `ollama pull llama3.1`
    - Run: `ollama pull mistral`

---

## 🚀 Backend Setup (FastAPI)

1.  **Navigate to the root directory**:
    ```powershell
    cd "C:\Users\prana\SAR NARRATIVE GENERATOR"
    ```
2.  **Activate Virtual Environment**:
    ```powershell
    .\venv\Scripts\activate
    ```
3.  **Start the Server**:
    ```powershell
    uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
    ```
    *Note: The backend is configured with a **Hybrid AML Engine**. If Spark fails due to Java issues, it will automatically fall back to **Pandas Mode** (100% stable).*

---

## 💻 Frontend Setup (Next.js)

1.  **Navigate to the frontend directory**:
    ```powershell
    cd "C:\Users\prana\SAR NARRATIVE GENERATOR\frontend"
    ```
2.  **Install Dependencies** (if not already done):
    ```powershell
    npm install
    ```
3.  **Start Development Server**:
    ```powershell
    npm run dev
    ```
    *Access via [http://localhost:3000](http://localhost:3000)*

---

## 🧪 Testing instructions

### 1. Login Credentials
- **Email**: `admin@fintrace.com`
- **Password**: `Password123`
*(If you haven't registered this user, see `app/api/routes/auth.py` for bootstrapping instructions)*

### 2. Upload Sample Data
1.  Go to the **Admin / Upload** page.
2.  Select the **`sample_case.csv`** file located in the root project folder.
3.  Watch the backend terminal for live tracing (`🔍 Step 1...`, `🤖 Step 3...`).
4.  Once completed, go to **Dashboard** to review the generated Narrative and AI Explanation.

---

## 📂 Key File Locations
- **Backend API**: `app/`
- **AML Process Logic**: `app/engine/processing.py`
- **Frontend Pages**: `frontend/app/`
- **Test Data**: `sample_case.csv`

---
**Project Mode**: Development/Demo (SQLite Fallback Enabled)
