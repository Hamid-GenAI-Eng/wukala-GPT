FROM python:3.10-slim

WORKDIR /app

# Install system dependencies needed for PyMuPDF, sqlite, etc.
RUN apt-get update && apt-get install -y \
    build-essential \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Expose port
EXPOSE 8000

# Command to run the application
CMD ["sh", "-c", "uvicorn mizan_ai.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
