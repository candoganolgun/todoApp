Docker Compose ile uygulamayı başlatın:

bash
cd todo-app
docker-compose up --build
Bu komutlar:

İlk çalıştırmada imajları oluşturacak
Backend için 8080 portunu açacak
Frontend için 5173 portunu açacak
İki servis arasında bir Docker network oluşturacak

Uygulama başladıktan sonra:

Frontend: http://localhost:5173
Backend: http://localhost:8080

adreslerinden erişilebilir olacak.
Önemli Notlar:

Windows'ta Docker Desktop'ın yüklü ve çalışır durumda olması gerekir
İlk build biraz zaman alabilir, özellikle Rust dependencies'leri derlenirken
Her iki container'ın da başarıyla başladığından emin olmak için logları kontrol edin
Eğer portlar sizin makinenizde kullanımdaysa, docker-compose.yml dosyasında port mapping'leri değiştirebilirsiniz

Tekrar Build etme durumunda; 

Tüm container'ları ve volume'ları temizleyin:
docker-compose down -v
docker system prune -a

Yeniden build edin ve başlatın:
docker-compose up --build

Frontend'in doğru URL'i kullandığından emin olmak için tarayıcınızın developer tools'unda Network sekmesini açın ve 
istekleri kontrol edin.

todos.json dosyasının oluşturulduğunu kontrol etmek için:
docker exec -it <backend-container-id> ls /app/data