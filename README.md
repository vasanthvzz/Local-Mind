# Local Mind

Local Mind is a powerful, locally-hosted chat and reasoning application designed to provide intelligent interactions with your data. It features a modern React-based frontend and a robust FastAPI backend.

## 🚀 Features

- **Intelligent Chat Interface**: A clean and responsive chat UI built with React.
- **Local Processing**: Ensures data privacy by processing requests locally (or via your configured backend).
- **Markdown Support**: Renders complex responses with proper formatting using `react-markdown`.
- **Fast & Scalable**: Powered by FastAPI for high-performance API handling.
- **Database Integration**: robust data persistence with SQLAlchemy and PostgreSQL.

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
