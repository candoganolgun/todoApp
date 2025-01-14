# Python 3.12 base image
FROM python:3.12-slim

# Çalışma dizinini ayarla
WORKDIR /app

# Sistem bağımlılıklarını kur
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# requirements.txt dosyasını kopyala
COPY requirements.txt .

# Python bağımlılıklarını kur
RUN pip install --no-cache-dir -r requirements.txt

# Uygulama kodunu kopyala
COPY . .

# Port ayarı
EXPOSE 8000

# Uygulamayı başlat
CMD ["uvicorn", "musicgenerator:app", "--host", "0.0.0.0", "--port", "8000"]
