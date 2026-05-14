# Mizan AI - Professional Legal Research RAG System ⚖️

Mizan AI is a state-of-the-art, multimodal, and multilingual (Urdu & English) legal research assistant designed to navigate complex Pakistani constitutional and corporate case laws with extreme accuracy and speed.

## 🌟 Core Features
- **Multilingual Support**: Fully understands and generates accurate legal responses in both English and Urdu.
- **Strict Anti-Hallucination**: Employs rigorous metadata chunking and citation injection. Every response is strictly grounded in the ingested corpus.
- **Hybrid Retrieval Strategy**: Uses both Dense (Semantic) and Sparse (Keyword/Lexical) vectors through the powerful `BAAI/bge-m3` embedding model to ensure no legal nuance is missed.
- **Deep Research Agent**: Employs LangGraph conditional routing to differentiate between simple QnA and deep constitutional/corporate research.
- **Extreme Speed**: Powered by **Groq** (`Llama-3.3-70B`) for lightning-fast inference and reasoning.
- **Bulletproof Security**: Secured by a custom JWT authentication layer, ensuring unauthorized access is blocked.

## 🛠️ Technology Stack
- **Backend**: FastAPI (Asynchronous Python API)
- **Vector Database**: Qdrant (via Docker)
- **Agentic Flow**: LangGraph & LangChain
- **LLM Engine**: Groq
- **Embeddings**: FlagEmbedding (`BAAI/bge-m3`)
- **Document Parsing**: PyMuPDF (`fitz`)

## 📦 Local Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Hamid-GenAI-Eng/Mizan-AI.git
   cd Mizan-AI
   ```

2. **Install Dependencies**
   Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

3. **Pre-Download the Multilingual Model**
   Because the `BAAI/bge-m3` model is large (~2-5GB), it is recommended to download it manually before starting the server to avoid timeouts.
   ```bash
   python download_model.py
   ```

4. **Environment Variables**
   Create a `.env` file in the root directory and add the following keys:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   QDRANT_HOST=localhost
   QDRANT_PORT=6333
   SECRET_KEY=your_secure_random_secret_string
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   ```

5. **Start Qdrant Vector Database**
   Ensure Docker Desktop is running, then start the Qdrant container:
   ```bash
   docker compose up -d
   ```

## 📚 Ingesting the Legal Corpus

Place all your legal documents (PDFs and TXTs) in the `Legal_corpus/` directory. Then run the ingestion pipeline:
```bash
python ingest.py
```
*(Note: If you are running a strict test, you can set `LIMIT = 3` inside `ingest.py` to test parsing on a small batch before running the full ingestion process).*

## 🚀 Running the API Server

Start the FastAPI server:
```bash
uvicorn mizan_ai.main:app --reload
```
The server will start on `http://127.0.0.1:8000`.

## 🧪 Testing the System
You can test the end-to-end functionality (Authentication + Complex Chat queries) using the provided comprehensive test script:
```bash
python comprehensive_test.py
```

## 🔒 API Endpoints Overview
* `POST /api/v1/auth/token`: Exchanges Admin credentials for a JWT Bearer token.
* `POST /api/v1/chat/`: Agentic chat endpoint (Requires JWT Token).
* `POST /api/v1/documents/upload`: Uploads and parses new legal documents (Requires JWT Token).
* `GET /health`: Health check endpoint.
