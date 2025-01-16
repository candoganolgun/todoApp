from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import numpy as np
import wave
import os

"""
Kullanılan Kütüphaneler:
- FastAPI: Modern, hızlı web framework. Async operasyonlar ve otomatik API dok. için
- CORSMiddleware: Cross-Origin isteklerini yönetmek için
- FileResponse: Dosya stream etmek için optimize edilmiş response sınıfı
- numpy (np): Bilimsel hesaplamalar ve array işlemleri için
- wave: WAV ses dosyalarını okuma/yazma işlemleri için
- os: Dosya sistemi operasyonları için
"""

# FastAPI uygulaması oluşturma
app = FastAPI()

# CORS (Cross-Origin Resource Sharing) ayarları
# Frontend'in farklı bir domain'den API'ye erişmesine izin verir
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],     # Tüm kaynaklardan gelen isteklere izin ver
    allow_credentials=True,   # Kimlik doğrulama bilgilerinin paylaşımına izin ver
    allow_methods=["*"],     # Tüm HTTP metodlarına izin ver
    allow_headers=["*"],     # Tüm HTTP headerlarına izin ver
)

def create_melody_file():
    """WAV dosyası oluştur ve kaydet
    
    Bu fonksiyon:
    1. Belirtilen frekanslarda sinüs dalgaları oluşturur
    2. Her notayı belirli bir süre çalar
    3. Fade in/out efektleri ekler
    4. Tüm melodiyi WAV formatında kaydeder
    """
    filename = "melody.wav"
    sample_rate = 44100      # CD kalitesi ses (saniyede 44100 örnek)
    duration_ms = 500        # Her nota 500 milisaniye

    # WAV dosyası oluşturma ve konfigürasyonu
    with wave.open(filename, 'wb') as wav_file:
        wav_file.setnchannels(1)      # Mono ses
        wav_file.setsampwidth(2)      # 16-bit ses kalitesi
        wav_file.setframerate(sample_rate)  # Örnekleme hızı

        # Müzik notaları ve süreleri (frekans, milisaniye)
        notes = [
      (294, 500),    # D4
    (330, 250),     # E4
    (349, 250),     # F4
    (392, 500),    # G4
    (349, 250),     # F4
    (330, 250),     # E4
    (294, 500),    # D4
    (262, 250),     # C4
    (294, 250),     # D4
    (330, 500),    # E4
    (294, 250),     # D4
    (262, 250),     # C4
    (220, 1000),    # A3
    (0, 250),       # Rest
    (294, 500),    # D4
    (330, 250),     # E4
    (349, 250),     # F4
    (392, 500),    # G4
    (349, 250),     # F4
    (330, 250),     # E4
    (294, 500),    # D4
    (262, 250),     # C4
    (294, 250),     # D4
    (330, 500),    # E4
    (294, 250),     # D4
    (262, 250),     # C4
    (220, 1000)     # A3
        ]

        # Melodiyi 3 kez tekrarla
        for _ in range(3):
            for freq, duration in notes:
                # Ses dalgası oluşturma
                samples = duration * sample_rate // 1000  # Toplam örnek sayısı
                t = np.linspace(0, duration/1000, samples, False)  # Zaman dizisi
                tone = np.sin(2 * np.pi * freq * t)  # Sinüs dalgası
                
                # Yumuşak geçişler için fade efektleri
                fade_len = int(samples * 0.1)  # Toplam sürenin %10'u
                tone[:fade_len] *= np.linspace(0, 1, fade_len)    # Fade in
                tone[-fade_len:] *= np.linspace(1, 0, fade_len)   # Fade out
                
                # 16-bit ses verisine dönüştürme
                audio_data = (tone * 32767).astype(np.int16)
                wav_file.writeframes(audio_data.tobytes())
    
    return filename

# Uygulama başlatıldığında çalışacak fonksiyon
@app.on_event("startup")
async def startup_event():
    """Başlangıçta WAV dosyasını oluştur"""
    print("Creating melody file...")
    create_melody_file()

# /stream endpoint'i - Müzik dosyasını stream eder
@app.get("/stream")
async def stream_audio():
    """WAV dosyasını stream et
    
    Bu endpoint:
    1. Dosyanın varlığını kontrol eder
    2. Yoksa yeni dosya oluşturur
    3. Dosyayı istemciye gönderir
    """
    if not os.path.exists("melody.wav"):
        create_melody_file()
    
    return FileResponse(
        "melody.wav",
        media_type="audio/wav",        # Dosya türü
        headers={
            "Cache-Control": "no-cache",  # Browser cache'i devre dışı bırak
            "Accept-Ranges": "bytes",     # Parçalı indirmeye izin ver
        }
    )

# Uygulamayı başlat
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)  # Tüm IP'lerden erişime izin ver