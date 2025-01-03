Docker Compose ile uygulamayı başlatın:

bash
cd todo-app
docker-compose up --build
Bu komutlar:

İlk çalıştırmada imajları oluşturacak
Backend için 8080 portunu açacak.
Frontend için 5173 portunu açacak.
İki servis arasında bir Docker network oluşturacak.

Uygulama başladıktan sonra:

Frontend: http://localhost:5173
Backend: http://localhost:8080

adreslerinden erişilebilir olacak.
Önemli Notlar:

Windows'ta Docker Desktop ile WSL'in yüklü ve çalışır durumda olması gerekir.

Frontend'in doğru URL'i kullandığından emin olmak için tarayıcınızın developer tools'unda Network sekmesini açın ve 
istekleri kontrol edin.
