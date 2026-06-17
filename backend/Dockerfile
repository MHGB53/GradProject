FROM python:3.10-slim

# Install Microsoft ODBC Driver 18 for SQL Server (required by pyodbc on Linux).
# Detects Debian version dynamically so this works on both Bullseye and Bookworm.
RUN apt-get update && apt-get install -y --no-install-recommends \
        curl gnupg2 apt-transport-https ca-certificates \
    && . /etc/os-release \
    && curl -sSL https://packages.microsoft.com/keys/microsoft.asc \
       | gpg --dearmor -o /usr/share/keyrings/microsoft.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft.gpg] \
       https://packages.microsoft.com/debian/${VERSION_ID}/prod ${VERSION_CODENAME} main" \
       > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql18 unixodbc-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first to maximise Docker layer cache reuse.
# requirements.txt lives at the project root (build context = project root).
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the full project: FastAPI code + frontend static assets that
# backend/main.py still mounts via StaticFiles (html/, css/, js/, assets/).
COPY . .

# Ensure upload directories exist so StaticFiles mounts don't fail on cold start.
RUN mkdir -p uploads/community uploads/profiles uploads/quiz_images

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
