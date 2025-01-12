import React, { useState, useEffect, useRef } from "react";
import axios from "axios";  // HTTP istekleri için
import { DndProvider, useDrag, useDrop } from "react-dnd";  // Sürükle-bırak işlevselliği için
import { HTML5Backend } from "react-dnd-html5-backend";
import { Play, Pause } from "lucide-react"; // Müzik kontrol ikonları için

// Müzik kontrolü bileşeni - START
const MusicControls = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    // Audio nesnesini oluştur
    audioRef.current = new Audio("/music/background.mp3");
    const audio = audioRef.current;
    audio.loop = true; // Müziği döngüye al

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div style={{
      position: "fixed",
      top: "20px",
      right: "20px",
      zIndex: 1000,
      display: "flex",
      gap: "10px"
    }}>
      <button
        onClick={togglePlay}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "8px",
          borderRadius: "50%",
          backgroundColor: "#f3db06",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {isPlaying ? <Pause size={24} color="white" /> : <Play size={24} color="white" />}
      </button>
    </div>
  );
};
// Müzik kontrolü bileşeni - FINISH

// Sürükle-bırak için sabit tip tanımı
const ItemType = {
  TODO: "TODO",
};

// Sürüklenebilir Todo bileşeni
const DraggableTodo = ({ todo, index, onDelete }) => {
  // useDrag hook'u ile sürükleme özelliklerinin tanımlanması
  const [{ isDragging }, drag] = useDrag({
    type: ItemType.TODO,
    item: { id: todo.id, status: todo.status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      style={{
        padding: "10px",
        margin: "10px 0",
        border: "2px solid #ccc",
        borderRadius: "7px",
        background: todo.status === "completed" ? "rgba(44, 122, 61, 0.9)" : todo.status === "in_progress" ? "rgba(240, 222, 64, 0.9)" : "rgba(222, 175, 228, 0.8)", // Duruma göre task arkaplan renk değişimi
        opacity: isDragging ? 0.8 : 1,  // Sürükleme sırasında opaklık değişimi
        cursor: "move",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: "#333",
        color: todo.status === "completed" ? "rgba(255, 255, 255)" : "rgba(0, 0, 0, 0.8)", // Task durumuna göre task yazı rengi değişimi
        fontStyle: todo.status === "completed" ? "italic" : "normal", // Task durumuna göre task yazı stili değişimi
        fontWeight: "bold",
      }}
    >
  <span>{todo.title}</span>
      <button
        onClick={() => onDelete(todo.id)}
        style={{
          marginLeft: "10px",
          backgroundColor: "#ff4444",
          color: "white",
          border: "none",
          borderRadius: "4px",
          padding: "4px 8px",
          cursor: "pointer",
          fontSize: "12px"
        }}
      >
        Delete
      </button>
    </div>
  );
};

// Bırakılabilir kolon bileşeni
const DroppableColumn = ({ status, todos, updateTodoStatus, onDelete }) => {
  // useDrop hook'u ile bırakma özelliklerinin tanımlanması
  const [{ isOver }, drop] = useDrop({
    accept: ItemType.TODO,
    drop: (item) => {
      // Farklı bir duruma bırakıldığında güncelleme
      if (item.status !== status) {
        updateTodoStatus(item.id, status);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      style={{
        margin: "30px",
        padding: "10px",
        border: "1px solid #ccc",
        minWidth: "400px",
        minHeight: "600px",
        backgroundColor: isOver ? "#e9ecef" : "#f9f9f9",  // Üzerine gelindiğinde renk değişimi
        transition: "background-color 0.1s ease",
      }}
    >
      <h2>{status.replace("_", " ").toUpperCase()}</h2>
      {todos.map((todo, index) => (
        <DraggableTodo 
          key={todo.id} 
          todo={todo} 
          index={index}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};


// API base URL'ini çevre değişkeninden al
const API_URL = 'http://localhost:8080';  // Direkt olarak URL'i belirtelim

console.log('Backend URL:', API_URL); // Debug için URL'i loglayalım

// axios instance oluştur
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
    // timeout değeri ekleyelim
    timeout: 5000,
    withCredentials: true
});


// Debug için request interceptor
api.interceptors.request.use(request => {
  console.log('Starting Request:', {
    url: request.url,
    method: request.method,
    baseURL: request.baseURL,
    headers: request.headers
  });
  return request;
});

// Debug için response interceptor
api.interceptors.response.use(
  response => {
    console.log('Response:', response);
    return response;
  },
  error => {
    console.error('API Error Details:', {
      message: error.message,
      code: error.code,
      config: error.config,
      response: error.response
    });
    throw error;
  }
);

// Ana uygulama bileşeni
const App = () => {
  // State tanımlamaları
  const [todos, setTodos] = useState([]);  // Todo listesi
  const [newTodo, setNewTodo] = useState("");  // Yeni todo input'u
  const [error, setError] = useState(null);  // Hata mesajı

  // Sayfa yüklendiğinde todo'ları getir
  useEffect(() => {
    fetchTodos();
  }, []);

  // Todo'ları backend'den getiren fonksiyon
  const fetchTodos = async () => {
    try {
      console.log('Fetching todos from:', API_URL + '/todos'); // Debug log
      const response = await api.get("/todos");
      setTodos(response.data);
      setError(null);
    } catch (err) {
      const errorMessage = `Failed to fetch todos: ${err.message}`;
      console.error(errorMessage, err);
      setError(errorMessage);
    }
  };

  // Yeni todo ekleme fonksiyonu
  const addTodo = async () => {
    if (newTodo.trim()) {
      try {
        await api.post("/todos", { title: newTodo });
        setNewTodo("");
        fetchTodos();
        setError(null);
      } catch (err) {
        setError("Failed to add todo: " + err.message);
        console.error(err);
      }
    }
  };

  // Todo durumunu güncelleme fonksiyonu
  const updateTodoStatus = async (id, status) => {
    try {
      await api.put(`http://127.0.0.1:8080/todos/${id}`, { status });
      fetchTodos();
      setError(null);
    } catch (err) {
      setError(`Failed to update todo status: ${err.message}`);
      console.error("Failed to update todo status:", err);
    }
  };

  // Yeni eklenen silme fonksiyonu
  const deleteTodo = async (id) => {
    try {
      await api.delete(`http://127.0.0.1:8080/todos/${id}`);
      fetchTodos();
      setError(null);
    } catch (err) {
      setError(`Failed to delete todo: ${err.message}`);
      console.error("Failed to delete todo:", err);
    }
  };


  // Belirli bir duruma sahip todo'ları filtreleme
  const filteredTodos = (status) => todos.filter((todo) => todo.status === status);

  // Enter tuşuna basıldığında todo ekleme
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ padding: "20px" }}>
      <MusicControls /> {/* Müzik kontrollerini ekle */}
        <h1><b>ToDo App</b></h1>
        {/* Todo ekleme formu */}
        <div style={{ marginBottom: "10px" }}>
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Add a new task"
            style={{ 
              padding: "8px",
              marginRight: "10px",
              borderRadius: "4px",
              border: "2px solid #ccc"
            }}
          />
          <button 
            onClick={addTodo}
            style={{
              padding: "8px 16px",
              borderRadius: "4px",
              border: "none",
              backgroundColor: "#f3db06",
              color: "white",
              cursor: "pointer",
              hover: "background-color:#f000"
            }}
          >
            Add
          </button>
        </div>

        {/* Hata mesajı gösterimi */}
        {error && (
          <div style={{ color: "red", marginBottom: "10px" }}>
            {error}
          </div>
        )}

        {/* Kanban board görünümü */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-around",
          gap: "20px",
          flexWrap: "wrap",
          opacity: 0.8,
        }}>
          {/* Her durum için bir kolon oluşturma */}
          {["todo", "in_progress", "completed"].map((status) => (
            <DroppableColumn
              key={status}
              status={status}
              todos={filteredTodos(status)}
              updateTodoStatus={updateTodoStatus}
              onDelete={deleteTodo}
            />
          ))}
        </div>
      </div>
    </DndProvider>
  );
};

export default App;