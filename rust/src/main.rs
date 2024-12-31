use actix_cors::Cors;
use actix_web::{web, App, HttpServer, Responder, HttpResponse};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Serialize, Deserialize)]
struct Todo {
    id: u32,
    title: String,
    completed: bool,
}

struct AppState {
    todos: Mutex<Vec<Todo>>,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let state = web::Data::new(AppState {
        todos: Mutex::new(Vec::new()),
    });

    HttpServer::new(move || {
        App::new()
            .wrap(Cors::default().allow_any_origin().allow_any_method().allow_any_header())
            .app_data(state.clone())
            .route("/todos", web::get().to(get_todos))
            .route("/todos", web::post().to(add_todo))
            .route("/todos/{id}", web::put().to(update_todo))
    })
    .bind("127.0.0.1:8080")?
    .run()
    .await
}

async fn get_todos(state: web::Data<AppState>) -> impl Responder {
    let todos = state.todos.lock().unwrap();
    HttpResponse::Ok().json(&*todos)
}

#[derive(Deserialize)]
struct CreateTodo {
    title: String,
}

async fn add_todo(state: web::Data<AppState>, todo: web::Json<CreateTodo>) -> impl Responder {
    let mut todos = state.todos.lock().unwrap();
    let new_todo = Todo {
        id: (todos.len() + 1) as u32,
        title: todo.title.clone(),
        completed: false,
    };
    todos.push(new_todo);
    HttpResponse::Created().finish()
}

#[derive(Deserialize)]
struct UpdateTodo {
    completed: bool,
}

async fn update_todo(
    state: web::Data<AppState>,
    id: web::Path<u32>,
    todo: web::Json<UpdateTodo>,
) -> impl Responder {
    let mut todos = state.todos.lock().unwrap();
    let todo_id = id.into_inner(); // Extract id before the closure to avoid move issues
    if let Some(existing_todo) = todos.iter_mut().find(|t| t.id == todo_id) {
        existing_todo.completed = todo.completed;
        HttpResponse::Ok().finish()
    } else {
        HttpResponse::NotFound().finish()
    }
}