import React, { useState, useEffect, useRef } from "react";
import axios from "axios";  // HTTP istekleri için
import { DndProvider, useDrag, useDrop } from "react-dnd";  // Sürükle-bırak işlevselliği için
import { HTML5Backend } from "react-dnd-html5-backend";
import { Play, Pause } from "lucide-react"; // Müzik kontrol ikonları için
import { memo } from "react"; // Performans için bileşen memoization. Props değişmediğinde yeniden render yapmaz.
import TodoDetailModal from './components/TodoDetailModal';

// Müzik kontrolü bileşeni
// Bu bileşen, sürekli çalan bir melodi için play/pause kontrolü sağlar
 // Kanvasların opacity değerinini değişimini takip eden state
const MusicControls = ({ opacity, setOpacity }) => {
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
        switch(musicType) {
          case 'sabit':
            audio.src = '/music/interseller.mp3';
            break;
          case 'sabit2':
            audio.src = '/music/interseller2.mp3';
            break;
          case 'yaratim':
            audio.src = `http://localhost:8000/stream?t=${Date.now()}`;
            break;
          default:
            audio.src = '/music/interseller.mp3';
        }
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
      flexDirection: "column", // Dikey yerleşim
      gap: "10px",
      alignItems: "center",
      backgroundColor: "rgba(0, 0, 0, 0.1)",
      padding: "10px",
      borderRadius: "8px",
      width: "300px"
    }}>
      <div style={{
        display: "flex",
        gap: "10px",
        alignItems: "center",
        width: "100%"
      }}>
        <select
          value={musicType}
          onChange={(e) => setMusicType(e.target.value)}
          style={{
            padding: "8px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            backgroundColor: "black",
            color: "white",
            cursor: "pointer",
            flex: 1
          }}
        >
          <option value="sabit">Interseller</option>
          <option value="sabit2">Interseller 2</option>
          <option value="yaratim">Black Hole</option>
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

      {/* Opacity kontrol slider'ı */}
      <div style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "5px"
      }}>
        <label style={{
          color: "white",
          fontSize: "12px",
          display: "flex",
          justifyContent: "space-between"
        }}>
          <span>Board Opacity: {opacity}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          onChange={(e) => setOpacity(Number(e.target.value))}
          style={{
            width: "100%",
            height: "4px",
            cursor: "pointer",
          }}
        />
      </div>
    </div>
  );
};
// Müzik kontrolü bileşeni - FINISH

// Sürükle-bırak için sabit tip tanımı
const ItemType = {
  TODO: "TODO",
};

// Sürüklenebilir Todo bileşeni
const DraggableTodo = ({ todo, index, onDelete, onDetail }) => {
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
      <span style={{ flex: 1 }}>{todo.title}</span>
      <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
        <button
          onClick={() => onDetail(todo.id)}
          style={{
            backgroundColor: "rgba(93, 47, 211, 0.8)",
            color: "white",
            border: "none",
            borderRadius: "4px",
            padding: "4px 8px",
            cursor: "pointer",
            fontSize: "12px",
            marginLeft: "10px"
          }}
        >
          Detail
        </button>
        
        <button
          onClick={() => onDelete(todo.id)}
          style={{
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
    </div>
  );
};

// Bırakılabilir kolon bileşeni
const DroppableColumn = ({ status, todos, updateTodoStatus, onDelete, onDetail }) => {
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
          onDetail={onDetail}
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTodoId, setSelectedTodoId] = useState(null);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [boardOpacity, setBoardOpacity] = useState(80);

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

  // updateTodoStatus fonksiyonunu güncelle
const updateTodoStatus = async (id, status) => {
  try {
    const currentTodo = todos.find(t => t.id === id);
    const updateData = {
      status,
      description: currentTodo.description // Mevcut description'ı koru
    };

    const response = await api.put(`/todos/${id}`, updateData);
    
    if (response.status === 200) {
      await fetchTodos();
      setError(null);
    }
  } catch (err) {
    const errorMessage = `Failed to update todo status: ${err.message}`;
    setError(errorMessage);
    console.error("Status update error:", err);
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

  const handleDetailClick = async (todoId) => {
    try {
      // Güncel todo verisini backend'den al
      const response = await api.get(`/todos/${todoId}`);
      const todo = response.data;
      console.log('Fetched todo for modal:', todo);
      
      setSelectedTodo(todo);
      setSelectedTodoId(todoId);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Error fetching todo details:', err);
      // Hata durumunda mevcut todo verisini kullan
      const fallbackTodo = todos.find(t => t.id === todoId);
      setSelectedTodo(fallbackTodo);
      setSelectedTodoId(todoId);
      setIsModalOpen(true);
    }
  };

  // handleSaveDescription fonksiyonunu güncelle
const handleSaveDescription = async (todoId, updates) => {
  try {
    console.log('App - Starting update for todo:', todoId, updates);

    const currentTodo = todos.find(t => t.id === todoId);
    if (!currentTodo) {
      throw new Error('Todo not found');
    }

    const updateData = {
      status: currentTodo.status,
      description: updates.description,
      start_date: updates.startDate,  // Tarih alanlarını ekledik
      end_date: updates.endDate
    };

    console.log('App - Sending update request:', updateData);

    const response = await api.put(`/todos/${todoId}`, updateData);
    
    if (response.status === 200) {
      const updatedTodo = response.data;
      console.log('App - Received updated todo:', updatedTodo);
      
      setTodos(prevTodos => 
        prevTodos.map(todo => 
          todo.id === todoId ? updatedTodo : todo
        )
      );

      setIsModalOpen(false);
      await fetchTodos();
      setError(null);
    }
  } catch (err) {
    console.error('App - Update error:', err);
    setError(`Failed to update todo: ${err.message}`);
  }
};

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTodoId(null);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div style={{ padding: "20px" }}>
        <MusicControls 
          opacity={boardOpacity} 
          setOpacity={setBoardOpacity}
        />
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
          opacity: boardOpacity / 100, // opacity değerini 0-1 aralığına dönüştür
        }}>
          {/* Her durum için bir kolon oluşturma */}
          {["todo", "in_progress", "completed"].map((status) => (
            <DroppableColumn
              key={status}
              status={status}
              todos={filteredTodos(status)}
              updateTodoStatus={updateTodoStatus}
              onDelete={deleteTodo}
              onDetail={handleDetailClick}
            />
          ))}
        </div>
        <TodoDetailModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          todoId={selectedTodoId}
          todo={selectedTodo}
          onSave={handleSaveDescription}
        />
      </div>
    </DndProvider>
  );
};

export default memo(App);