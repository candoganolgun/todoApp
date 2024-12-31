import React, { useEffect } from "react";
import { useState } from "react";
import axios from "axios";

const App = () => {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState("");

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    const response = await axios.get("http://127.0.0.1:8080/todos");
    setTodos(response.data);
  };

  const addTodo = async () => {
    if (newTodo.trim()) {
      await axios.post("http://127.0.0.1:8080/todos", { title: newTodo });
      setNewTodo("");
      fetchTodos();
    }
  };

  const toggleTodo = async (id, completed) => {
    await axios.put(`http://127.0.0.1:8080/todos/${id}`, { completed: !completed });
    fetchTodos();
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>TO-DO App</h1>
      <input
        type="text"
        value={newTodo}
        onChange={(e) => setNewTodo(e.target.value)}
        placeholder="Add a new task"
      />
      <button onClick={addTodo}>Add</button>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <span
              onClick={() => toggleTodo(todo.id, todo.completed)}
              style={{
                textDecoration: todo.completed ? "line-through" : "none",
                cursor: "pointer",
              }}
            >
              {todo.title}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default App;