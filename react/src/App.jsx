import React, { useState, useEffect, useRef } from "react";
import axios from "axios";  // HTTP istekleri için
import { DndProvider, useDrag, useDrop } from "react-dnd";  // Sürükle-bırak işlevselliği için
import { HTML5Backend } from "react-dnd-html5-backend";
import { Play, Pause } from "lucide-react"; // Müzik kontrol ikonları için

// Müzik kontrolü bileşeni
// Bu bileşen, sürekli çalan bir melodi için play/pause kontrolü sağlar
const MusicControls = () => {
  // Çalma durumunu takip eden state
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicType, setMusicType] = useState('sabit'); // 'sabit' veya 'yaratim'
  // Audio elementi için referans - component yeniden render olsa bile korunur
  const audioRef = useRef(null);

  useEffect(() => {
    // Component mount edildiğinde audio elementi oluştur
    if (!audioRef.current) {
      const audio = new Audio();
      audio.loop = true;  // Ses dosyası bittiğinde otomatik olarak tekrar başlar
      audioRef.current = audio;
      
      // Hata durumlarını yakala ve kullanıcıya bildir
      audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        setIsPlaying(false);  // Hata durumunda çalma durumunu sıfırla
      });
    }
    
    // Component unmount edildiğinde cleanup yap
    return () => {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();  // Sesi durdur
        audio.src = ''; // Kaynağı temizle
      }
    };
  }, []); // Boş dependency array ile sadece mount/unmount'ta çalışır

  // Play/Pause düğmesine tıklandığında çağrılır
  const togglePlay = async () => {
    try {
      const audio = audioRef.current;
      if (!audio) return;

      if (isPlaying) {
        audio.pause(); // Çalıyorsa durdur
      } else {
        // Müzik tipine göre kaynak seç
        audio.src = musicType === 'sabit' 
          ? '/music/background.mp3'
          : `http://localhost:8000/stream?t=${Date.now()}`;
        await audio.play(); // Yeni stream'i başlat
      }
      setIsPlaying(!isPlaying); // Durumu tersine çevir
    } catch (err) {
      console.error('Playback error:', err);
      setIsPlaying(false); // Hata durumunda çalma durumunu sıfırla
    }
  };

  // Müzik tipi değiştiğinde çalan müziği durdur
  useEffect(() => {
    if (isPlaying) {
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        setIsPlaying(false);
      }
    }
  }, [musicType]);

  return (
    <div style={{
      position: "fixed",
      top: "20px",
      right: "20px",
      zIndex: 1000,
      display: "flex",
      gap: "10px",
      alignItems: "center"
    }}>
      <select
        value={musicType}
        onChange={(e) => setMusicType(e.target.value)}
        style={{
          padding: "8px",
          borderRadius: "4px",
          border: "1px solid #ccc",
          backgroundColor: "white",
          cursor: "pointer"
        }}
      >
        <option value="sabit">Sabit Müzik</option>
        <option value="yaratim">Yaratım Müzik</option>
      </select>
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
        background: todo.status === "completed" ? "rgba(44, 122, 61, 0.9)" : 
                   todo.status === "in_progress" ? "rgba(240, 222, 64, 0.9)" : 
                   "rgba(222, 175, 228, 0.8)", // Duruma göre task arkaplan renk değişimi
        opacity: isDragging ? 0.8 : 1,  // Sürükleme sırasında opaklık değişimi
        cursor: "move",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        color: todo.status === "completed" ? "rgba(255, 255, 255)" : "rgba(0, 0, 0, 0.8)", // Task durumuna göre yazı rengi
        fontStyle: todo.status === "completed" ? "italic" : "normal", // Task durumuna göre yazı stili
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

// API endpoint'leri için sabitler
const TODO_API_BASE = 'http://localhost:8080';  // Todo backend URL
const MUSIC_API_BASE = 'http://localhost:8000'; // Müzik streaming backend URL

// Debug için URL'leri logla
console.log('Todo Backend URL:', TODO_API_BASE);
console.log('Music Backend URL:', MUSIC_API_BASE);

// axios instance oluştur
const api = axios.create({
  baseURL: TODO_API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 5000, // 5 saniye timeout
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
  const [todos, setTodos] = useState([]);     // Todo listesi
  const [newTodo, setNewTodo] = useState(""); // Yeni todo input'u
  const [error, setError] = useState(null);   // Hata mesajı

  // Sayfa yüklendiğinde todo'ları getir
  useEffect(() => {
    fetchTodos();
  }, []);

  // Todo'ları backend'den getiren fonksiyon
  const fetchTodos = async () => {
    try {
      console.log('Fetching todos from:', TODO_API_BASE + '/todos'); // Debug log
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
      await api.put(`/todos/${id}`, { status });
      fetchTodos();
      setError(null);
    } catch (err) {
      setError(`Failed to update todo status: ${err.message}`);
      console.error("Failed to update todo status:", err);
    }
  };

  // Todo silme fonksiyonu
  const deleteTodo = async (id) => {
    try {
      await api.delete(`/todos/${id}`);
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
            onKeyPress={handleKeyPress}
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