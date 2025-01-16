import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const TodoDetailModal = ({ isOpen, onClose, todoId, todo, onSave }) => {
  const [description, setDescription] = useState('');

  useEffect(() => {
    console.log('Modal received todo:', todo);
    if (todo) {
      const desc = todo.description || '';
      console.log('Setting description to:', desc);
      setDescription(desc);
    } else {
      setDescription('');
    }
  }, [todo]);

  const handleSave = async () => {
    try {
      console.log('TodoDetailModal - Saving description:', description);
      await onSave(todoId, { description });
      console.log('TodoDetailModal - Save successful');
      onClose(); // Başarılı kaydetme sonrası modal'ı kapat
    } catch (error) {
      console.error('TodoDetailModal - Save failed:', error);
    }
  };

  if (!isOpen) return null;
  

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1001,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          position: 'relative',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '500px',
          overflow: 'auto',
          color: 'rgba(0, 0, 0, 0.7)',
        }}
      >
        <div style={{ 
          position: 'absolute',
          right: '10px',
          top: '10px',
          display: 'flex',
          gap: '10px'
        }}>
          <button
            onClick={handleSave}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '5px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              color: '#666'
            }}
          >
            <Save size={24} />
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '5px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              color: '#666'
            }}
          >
            <X size={24} />
          </button>
        </div>

        <div style={{ marginTop: '10px' }}>
          <h2>Todo Details</h2>
          <p><strong>Title:</strong> {todo?.title}</p>
          <div style={{ marginTop: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px' }}>
              <p><strong>Description:</strong></p>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '50%',
                height: '200px',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                resize: 'vertical'
              }}
              placeholder="Enter todo description..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodoDetailModal;
