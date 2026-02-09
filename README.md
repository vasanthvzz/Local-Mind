# Local Mind

Local Mind is a powerful, locally-hosted chat and reasoning application designed to provide intelligent interactions with your data. It features a modern React-based frontend and a robust FastAPI backend.

## 🚀 Features

- **Intelligent Chat Interface**: A clean and responsive chat UI built with React.
- **Local Processing**: Ensures data privacy by processing requests locally (or via your configured backend).
- **Markdown Support**: Renders complex responses with proper formatting using `react-markdown`.
- **Fast & Scalable**: Powered by FastAPI for high-performance API handling.
- **Database Integration**: robust data persistence with SQLAlchemy and PostgreSQL.

## 🎥 Demo

[![Watch the Demo](Images/Screenshot%202026-02-09%20111310.png)](https://www.loom.com/share/c8c3d356b3234c4fbecf2dcace5316ca)

### Screenshots

![Screenshot 1](Images/Screenshot%202026-02-09%20111310.png)
![Screenshot 2](Images/Screenshot%202026-02-09%20111322.png)

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: TypeScript
- **Styling**: CSS / Tailwind (if applicable)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: [React Router](https://reactrouter.com/)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Language**: Python 3.11+
- **Database ORM**: [SQLAlchemy](https://www.sqlalchemy.org/)
- **Database Driver**: `psycopg2-binary` (PostgreSQL)
- **Package Manager**: [uv](https://github.com/astral-sh/uv) (recommended)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Python](https://www.python.org/) (v3.11 or higher)
- [PostgreSQL](https://www.postgresql.org/) (ensure the service is running and you have a database created)
- [Ollama](https://ollama.com/) (required for running local models)

## 🦙 Models & Inference Setup

This project uses **Ollama** to serve state-of-the-art open-source models locally.

### 1. Install & Serve Ollama
First, [download and install Ollama](https://ollama.com/download) for your system. Once installed, start the Ollama server:
```bash
ollama serve
```

### 2. Pull Required Models
We use specific models optimized for reasoning and retrieval:

```bash
# Pull the LLM
ollama pull llama3.1:8b

# Pull the Embedding Model
ollama pull bge-m3
```

### 🧠 Model Architecture & Comparison

#### **Large Language Model (LLM): Llama 3.1 8B**
We use Mega's **Llama 3.1 8B** for its superior reasoning capabilities and efficiency in local environments.

| Feature | **Llama 3.1 8B** 🏆 | Mistral 7B v0.3 | Gemma 7B |
| :--- | :--- | :--- | :--- |
| **Context Window** | **128k** | 32k | 8k |
| **Reasoning** | **SOTA** for size class | High | Moderate |
| **Function Calling** | Native & Robust | Supported | Limited |
| **License** | Open Weights | Apache 2.0 | Open Weights |
| **Best For** | Complex RAG, Long-context | General Chat | Creative Writing |

#### **Embedding Model: BGE-M3**
We leverage **BAAI's BGE-M3** (Multi-Lingual, Multi-Functionality, Multi-Granularity) for high-precision semantic search.

| Feature | **BGE-M3** 🏆 | OpenAI text-embedding-3 | E5-Mistral-7B |
| :--- | :--- | :--- | :--- |
| **Retrieval Score (MTEB)** | **Top Tier** | High | Very High (Heavy) |
| **Multilingual** | **100+ Languages** | Good | Moderate |
| **Max Token Length** | **8192** | 8191 | 32k |
| **Hybrid Search** | **Dense + Sparse + ColBERT** | Dense Only | Dense Only |
| **Efficiency** | Highly Optimized | API Dependent | Resource Heavy |

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/vasanthvzz/Local-Mind.git
cd Local-Mind
```

### 2. Backend Setup
Navigate to the backend directory:
```bash
cd localmind-backend
```

Create a virtual environment and install dependencies.
**Using `uv` (Recommended):**
```bash
# Verify uv is installed
uv --version

# Sync dependencies
uv sync
```

**Using `pip`:**
```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

> **Note:** Ensure you have configured your environment variables (e.g., database URL) in a `.env` file if required by the application.

### 3. Frontend Setup
Navigate to the frontend directory:
```bash
cd ../localmind-frontend
```

Install the dependencies:
```bash
npm install
```

## 🏃‍♂️ Running the Application

### Start the Backend
From the `localmind-backend` directory:
```bash
# Using uv
uv run uvicorn main:app --reload

# Or using standard python
uvicorn main:app --reload
```
The backend API will be available at `http://localhost:8000` (or the port specified in the logs).

### Start the Frontend
From the `localmind-frontend` directory:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173` to verify the application is running.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
