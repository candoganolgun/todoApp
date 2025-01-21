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
#[derive(Debug, Serialize, Deserialize, Clone)]
struct Todo {
    id: u32,            // Benzersiz tanımlayıcı
    title: String,      // Todo başlığı
    status: String,     // Todo durumu ("todo", "in_progress", "completed")
    description: String,  // Her zaman Some("") olarak başlayacak
    start_date: String,    // Yeni alan
    end_date: String,      // Yeni alan
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
fn save_todos(todos: &[Todo]) -> std::io::Result<()> {
    println!("Saving todos to file: {:?}", todos);
    let json = serde_json::to_string_pretty(todos)?;
    let mut file = fs::File::create(JSON_FILE_PATH)?;
    file.write_all(json.as_bytes())?;
    println!("Successfully saved todos to file");
    Ok(())
}

/// Ana fonksiyon
/// Web sunucusunu başlatır ve API endpoint'lerini yapılandırır
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    std::env::set_var("RUST_LOG", "actix_web=debug"); // Log seviyesini debug'a çektik
    env_logger::init();

    let state = web::Data::new(AppState {
        todos: Mutex::new(load_todos()),
    });

    println!("Server starting at http://0.0.0.0:8080");
    
    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin("http://localhost:5173")
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE"])
            .allowed_headers(vec![
                header::CONTENT_TYPE,
                header::ACCEPT,
                header::ORIGIN,
            ])
            .supports_credentials()
            .max_age(3600);

        App::new()
            .wrap(cors)
            .wrap(Logger::default())
            .app_data(state.clone())
            .service(
                web::scope("/todos")
                    // Spesifik endpoint'leri önce tanımla
                    .route("/{id}", web::get().to(get_todo_by_id))  // GET /{id} önce gelmeli
                    .route("/{id}", web::put().to(update_todo))
                    .route("/{id}", web::delete().to(delete_todo))
                    // Genel endpoint'ler sonda olmalı
                    .route("", web::get().to(get_todos))
                    .route("", web::post().to(add_todo))
            )
    })
    .bind("0.0.0.0:8080")?
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
    
    // Yeni todo oluşturulurken boş description alanı ekle
    let new_todo = Todo {
        id: new_id,
        title: todo.title.clone(),
        status: "todo".to_string(),  // Başlangıç durumu
        description: "".to_string(), // Boş string ile başlat
        start_date: "".to_string(),          // Yeni alan
        end_date: "".to_string(),            // Yeni alan
    };
    
    println!("Creating new todo: {:?}", new_todo);
    
    todos.push(new_todo);
    
    // Değişiklikleri kaydet
    if let Err(e) = save_todos(&todos) {
        eprintln!("Error saving todos: {}", e);
        return HttpResponse::InternalServerError().finish();
    }
    
    HttpResponse::Created().finish()
}

/// Todo güncelleme için gelen verinin yapısı
#[derive(Debug, Deserialize, Clone)]  // Debug trait'ini ekledik
struct UpdateTodo {
    status: Option<String>,      // Status güncellemesi için
    description: Option<String>, // Description güncellemesi için
    start_date: Option<String>,    // Yeni alan
    end_date: Option<String>,      // Yeni alan
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
    update_data: web::Json<UpdateTodo>,
) -> impl Responder {
    println!("Received update request: {:?}", update_data);
    
    let mut todos = state.todos.lock().unwrap();
    let todo_id = id.into_inner();
    
    // Todo'yu ID'ye göre bul ve güncelle
    if let Some(existing_todo) = todos.iter_mut().find(|t| t.id == todo_id) {
        // Status güncellemesi
        if let Some(status) = &update_data.status {
            existing_todo.status = status.clone();
            println!("Updated status to: {}", status);
        }
        
        // Description güncellemesi - boş string yerine None olmasını engelle
        if let Some(description) = &update_data.description {
            existing_todo.description = description.clone();
            println!("Updated description to: {:?}", existing_todo.description);
        }
        
        // Tarih güncellemeleri
        if let Some(start_date) = &update_data.start_date {
            existing_todo.start_date = start_date.clone();
        }
        
        if let Some(end_date) = &update_data.end_date {
            existing_todo.end_date = end_date.clone();
        }
        
        println!("Final todo state: {:?}", existing_todo);
        
        // Bu kısmı yorum satırından çıkarıyoruz
        let updated_todo = existing_todo.clone();
        if let Err(e) = save_todos(&todos) {
            eprintln!("Error saving todos: {}", e);
            return HttpResponse::InternalServerError().finish();
        }
        
        // Güncellenmiş todo'yu JSON olarak dön
        HttpResponse::Ok().json(updated_todo)
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

// Tekil todo getirme handler'ı ekle
async fn get_todo_by_id(
    state: web::Data<AppState>,
    id: web::Path<u32>,
) -> impl Responder {
    let todo_id = id.into_inner();
    println!("GET request received for todo id: {}", todo_id);  // Debug log
    
    let todos = state.todos.lock().unwrap();
    
    match todos.iter().find(|t| t.id == todo_id) {
        Some(todo) => {
            println!("Found todo: {:?}", todo);  // Debug log
            HttpResponse::Ok().json(todo)
        }
        None => {
            println!("Todo not found with id: {}", todo_id);  // Debug log
            HttpResponse::NotFound().json(format!("Todo with id {} not found", todo_id))
        }
    }
}