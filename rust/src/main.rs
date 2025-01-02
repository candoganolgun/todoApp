// Gerekli kütüphanelerin içe aktarılması
use actix_cors::Cors;  // CORS desteği için
use actix_web::{web, App, HttpServer, Responder, HttpResponse};  // Web sunucusu için
use serde::{Deserialize, Serialize};  // JSON serileştirme/deserileştirme için
use std::sync::Mutex;  // Thread-safe veri paylaşımı için

// Todo yapısının tanımlanması - JSON serileştirme ve deserileştirme desteği ile
#[derive(Serialize, Deserialize)]
struct Todo {
    id: u32,  // Benzersiz todo ID'si
    title: String,  // Todo başlığı
    status: String,  // Todo durumu: "todo", "in_progress", veya "completed"
}

// Uygulama durumunu tutan yapı - Thread-safe todo listesi
struct AppState {
    todos: Mutex<Vec<Todo>>,  // Thread-safe Vector içinde Todo'lar
}

// Ana fonksiyon - HTTP sunucusunun başlatılması
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    // Uygulama durumunun oluşturulması
    let state = web::Data::new(AppState {
        todos: Mutex::new(Vec::new()),
    });

    // HTTP sunucusunun yapılandırılması ve başlatılması
    HttpServer::new(move || {
        App::new()
            // CORS ayarlarının yapılması - tüm origin, method ve header'lara izin verilmesi
            .wrap(Cors::default().allow_any_origin().allow_any_method().allow_any_header())
            .app_data(state.clone())
            // API endpoint'lerinin tanımlanması
            .route("/todos", web::get().to(get_todos))  // GET /todos - Tüm todo'ları listeler
            .route("/todos", web::post().to(add_todo))  // POST /todos - Yeni todo ekler
            .route("/todos/{id}", web::put().to(update_todo))  // PUT /todos/{id} - Todo durumunu günceller
            .route("/todos/{id}", web::delete().to(delete_todo))  // Yeni eklenen DELETE endpoint'i
    })
    .bind("127.0.0.1:8080")?  // Sunucunun dinleyeceği adres
    .run()
    .await
}

// Tüm todo'ları getiren handler fonksiyonu
async fn get_todos(state: web::Data<AppState>) -> impl Responder {
    let todos = state.todos.lock().unwrap();
    HttpResponse::Ok().json(&*todos)  // Todo listesini JSON olarak döndürür
}

// Yeni todo oluşturma için gelen verinin yapısı
#[derive(Deserialize)]
struct CreateTodo {
    title: String,
}

// Yeni todo ekleyen handler fonksiyonu
async fn add_todo(state: web::Data<AppState>, todo: web::Json<CreateTodo>) -> impl Responder {
    let mut todos = state.todos.lock().unwrap();
    let new_todo = Todo {
        id: (todos.len() + 1) as u32,  // Basit ID üretimi
        title: todo.title.clone(),
        status: "todo".to_string(),  // Başlangıç durumu
    };
    todos.push(new_todo);
    HttpResponse::Created().finish()
}

// Todo güncelleme için gelen verinin yapısı
#[derive(Deserialize)]
struct UpdateTodo {
    status: String,
}

// Todo durumunu güncelleyen handler fonksiyonu
async fn update_todo(
    state: web::Data<AppState>,
    id: web::Path<u32>,
    todo: web::Json<UpdateTodo>,
) -> impl Responder {
    let mut todos = state.todos.lock().unwrap();
    let todo_id = id.into_inner();
    println!("Updating todo with ID: {} to status: {}", todo_id, todo.status);  // Debug log
    // Todo'yu ID'ye göre bulup güncelleme
    if let Some(existing_todo) = todos.iter_mut().find(|t| t.id == todo_id) {
        existing_todo.status = todo.status.clone();
        HttpResponse::Ok().finish()
    } else {
        HttpResponse::NotFound().finish()  // Todo bulunamazsa 404
    }
}

// Yeni eklenen silme fonksiyonu
async fn delete_todo(
    state: web::Data<AppState>,
    id: web::Path<u32>,
) -> impl Responder {
    let mut todos = state.todos.lock().unwrap();
    let todo_id = id.into_inner();
    
    // Vec'ten todo'yu ID'ye göre bulup silme
    if let Some(pos) = todos.iter().position(|x| x.id == todo_id) {
        todos.remove(pos);
        HttpResponse::Ok().finish()
    } else {
        HttpResponse::NotFound().finish()
    }
}