//! Todo List Backend API
//! Bu modül, todo list uygulamasının backend kısmını içerir.
//! RESTful API prensipleriyle geliştirilmiş ve CRUD operasyonlarını destekler.

// Gerekli external crate'lerin import edilmesi
use actix_cors::Cors;  // Cross-Origin Resource Sharing (CORS) desteği için
use actix_web::{web, App, HttpServer, Responder, HttpResponse, http::header, middleware::Logger};  // Web framework
use serde::{Deserialize, Serialize};  // JSON serileştirme/deserileştirme işlemleri için
use std::sync::Mutex;  // Thread-safe veri paylaşımı için
use std::fs;  // Dosya sistemi operasyonları için
use std::io::Write;  // Dosyaya yazma işlemleri için
use std::path::PathBuf;

// JSON dosyasının yolunu container içindeki data klasörüne ayarla
const JSON_FILE_PATH: &str = "/app/data/todos.json";

/// Todo yapısı
/// Bir todo öğesinin sahip olduğu tüm özellikleri tanımlar
#[derive(Serialize, Deserialize, Clone)]
struct Todo {
    id: u32,            // Benzersiz tanımlayıcı
    title: String,      // Todo başlığı
    status: String,     // Todo durumu ("todo", "in_progress", "completed")
}

/// Uygulama durumu
/// Tüm todo'ları thread-safe bir şekilde tutan yapı
struct AppState {
    todos: Mutex<Vec<Todo>>,  // Thread-safe vector içinde Todo'lar
}

/// JSON dosyasından todo'ları yükler
/// 
/// # Returns
/// 
/// * `Vec<Todo>` - Yüklenen todo'ların listesi
/// 
/// # İşleyiş
/// 
/// 1. JSON dosyasını okumayı dener
/// 2. Dosya varsa içeriği parse eder
/// 3. Herhangi bir hata durumunda boş bir liste döner
fn load_todos() -> Vec<Todo> {
    // Dosya dizininin varlığını kontrol et ve oluştur
    if let Some(parent) = PathBuf::from(JSON_FILE_PATH).parent() {
        std::fs::create_dir_all(parent).unwrap_or_else(|e| {
            eprintln!("Failed to create directory: {}", e);
        });
    }

    match std::fs::read_to_string(JSON_FILE_PATH) {
        Ok(contents) => {
            serde_json::from_str(&contents).unwrap_or_else(|_| {
                println!("JSON parsing error, starting with empty todos");
                Vec::new()
            })
        }
        Err(_) => {
            println!("No existing todos file, starting with empty todos");
            let empty_todos = Vec::new();
            // Boş dosyayı oluştur
            save_todos(&empty_todos).unwrap_or_else(|e| {
                eprintln!("Failed to create initial todos file: {}", e);
            });
            empty_todos
        }
    }
}


/// Todo'ları JSON dosyasına kaydeder
/// 
/// # Arguments
/// 
/// * `todos` - Kaydedilecek todo'ların listesi
/// 
/// # Returns
/// 
/// * `std::io::Result<()>` - İşlemin başarı durumu
/// 
/// # İşleyiş
/// 
/// 1. Todo'ları JSON formatına dönüştürür
/// 2. Dosyayı oluşturur veya üzerine yazar
/// 3. JSON verisini dosyaya yazar
fn save_todos(todos: &Vec<Todo>) -> std::io::Result<()> {
    let json = serde_json::to_string_pretty(todos)?;
    let mut file = fs::File::create(JSON_FILE_PATH)?;
    file.write_all(json.as_bytes())?;
    Ok(())
}

/// Ana fonksiyon
/// Web sunucusunu başlatır ve API endpoint'lerini yapılandırır
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    std::env::set_var("RUST_LOG", "actix_web=info");
    env_logger::init();

      // Uygulama durumunu oluştur ve paylaşılabilir hale getir
    let state = web::Data::new(AppState {
        todos: Mutex::new(load_todos()),
    });

    println!("Server starting at http://0.0.0.0:8080");
    
    // HTTP sunucusunu yapılandır ve başlat
    HttpServer::new(move || {
        // CORS ayarlarını yapılandır - tüm origins, methods ve headers'a izin ver
        let cors = Cors::default()
            .allowed_origin("http://localhost:5173")
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE"])
            .allowed_headers(vec![header::AUTHORIZATION, header::ACCEPT, header::CONTENT_TYPE])
            .max_age(3600);

        App::new()
            .wrap(cors)
            .wrap(Logger::default())
              // Uygulama durumunu paylaş
            .app_data(state.clone())
            .service(
                web::scope("/todos")
                // API endpoint'lerini tanımla
                    .route("", web::get().to(get_todos)) // Tüm todo'ları listele
                    .route("", web::post().to(add_todo))  // Yeni todo ekle
                    .route("/{id}", web::put().to(update_todo)) // Todo durumunu güncelle
                    .route("/{id}", web::delete().to(delete_todo)) // Todo'yu sil
            )
    })
    .bind("127.0.0.1:8080")? // Sunucuyu localhost:8080'e bağla
    .run()
    .await
}

/// Tüm todo'ları getiren handler
/// 
/// # Arguments
/// 
/// * `state` - Paylaşılan uygulama durumu
/// 
/// # Returns
/// 
/// * JSON formatında todo listesi
async fn get_todos(state: web::Data<AppState>) -> impl Responder {
    let todos = state.todos.lock().unwrap();
    HttpResponse::Ok().json(&*todos)
}

/// Yeni todo oluşturma için gelen verinin yapısı
#[derive(Deserialize)]
struct CreateTodo {
    title: String,  // Yeni todo'nun başlığı
}

/// Yeni todo ekleyen handler
/// 
/// # Arguments
/// 
/// * `state` - Paylaşılan uygulama durumu
/// * `todo` - Oluşturulacak todo'nun bilgileri
/// 
/// # Returns
/// 
/// * Başarı durumunda 201 Created
/// * Hata durumunda 500 Internal Server Error
async fn add_todo(state: web::Data<AppState>, todo: web::Json<CreateTodo>) -> impl Responder {
    let mut todos = state.todos.lock().unwrap();
    
    // Yeni ID'yi hesapla (mevcut en yüksek ID + 1)
    let new_id = todos.iter()
        .map(|t| t.id)
        .max()
        .unwrap_or(0) + 1;
    
    // Yeni todo oluştur
    let new_todo = Todo {
        id: new_id,
        title: todo.title.clone(),
        status: "todo".to_string(),  // Başlangıç durumu
    };
    
    todos.push(new_todo);
    
    // Değişiklikleri kaydet
    if let Err(e) = save_todos(&todos) {
        eprintln!("Error saving todos: {}", e);
        return HttpResponse::InternalServerError().finish();
    }
    
    HttpResponse::Created().finish()
}

/// Todo güncelleme için gelen verinin yapısı
#[derive(Deserialize)]
struct UpdateTodo {
    status: String,  // Yeni durum
}

/// Todo durumunu güncelleyen handler
/// 
/// # Arguments
/// 
/// * `state` - Paylaşılan uygulama durumu
/// * `id` - Güncellenecek todo'nun ID'si
/// * `todo` - Güncellenecek durum bilgisi
/// 
/// # Returns
/// 
/// * Başarı durumunda 200 OK
/// * Todo bulunamazsa 404 Not Found
/// * Hata durumunda 500 Internal Server Error
async fn update_todo(
    state: web::Data<AppState>,
    id: web::Path<u32>,
    todo: web::Json<UpdateTodo>,
) -> impl Responder {
    let mut todos = state.todos.lock().unwrap();
    let todo_id = id.into_inner();
    
    // Todo'yu ID'ye göre bul ve güncelle
    if let Some(existing_todo) = todos.iter_mut().find(|t| t.id == todo_id) {
        existing_todo.status = todo.status.clone();
        
        // Değişiklikleri kaydet
        if let Err(e) = save_todos(&todos) {
            eprintln!("Error saving todos: {}", e);
            return HttpResponse::InternalServerError().finish();
        }
        
        HttpResponse::Ok().finish()
    } else {
        HttpResponse::NotFound().finish()
    }
}

/// Todo'yu silen handler
/// 
/// # Arguments
/// 
/// * `state` - Paylaşılan uygulama durumu
/// * `id` - Silinecek todo'nun ID'si
/// 
/// # Returns
/// 
/// * Başarı durumunda 200 OK
/// * Todo bulunamazsa 404 Not Found
/// * Hata durumunda 500 Internal Server Error
async fn delete_todo(
    state: web::Data<AppState>,
    id: web::Path<u32>,
) -> impl Responder {
    let mut todos = state.todos.lock().unwrap();
    let todo_id = id.into_inner();
    
    // Todo'yu ID'ye göre bul ve sil
    if let Some(pos) = todos.iter().position(|x| x.id == todo_id) {
        todos.remove(pos);
        
        // Değişiklikleri kaydet
        if let Err(e) = save_todos(&todos) {
            eprintln!("Error saving todos: {}", e);
            return HttpResponse::InternalServerError().finish();
        }
        
        HttpResponse::Ok().finish()
    } else {
        HttpResponse::NotFound().finish()
    }
}