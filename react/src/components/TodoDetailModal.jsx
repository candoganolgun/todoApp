import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const TodoDetailModal = ({ isOpen, onClose, todoId, todo, onSave }) => {
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    console.log('Modal received todo:', todo);
    if (todo) {
      setDescription(todo.description || '');
      setStartDate(todo.start_date || '');  // backend'deki alan adlarına uygun olarak değiştirdik
      setEndDate(todo.end_date || '');      // backend'deki alan adlarına uygun olarak değiştirdik
    } else {
      setDescription('');
      setStartDate('');
      setEndDate('');
    }
  }, [todo]);

  const handleSave = async () => {
    try {
      const updateData = {
        description,
        startDate: startDate || null,  // Boş string yerine null gönder
        endDate: endDate || null       // Boş string yerine null gönder
      };
      
      console.log('TodoDetailModal - Saving data:', updateData);
      await onSave(todoId, updateData);
      console.log('TodoDetailModal - Save successful');
      onClose();
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
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1001,
      }}
    >
      <div
        style={{
          backgroundColor:'rgb(245, 245, 245)',
          borderRadius: '8px',
          padding: '20px',
          position: 'relative',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '500px',
          overflow: 'auto',
          color: 'rgba(0, 0, 0, 1)',
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
          <div style={{ 
            marginTop: '20px',
            display: 'flex',
            gap: '20px'
          }}>
            {/* Sol taraf - Description */}
            <div style={{ flex: '1' }}>
              <label style={{ display: 'block', marginBottom: '10px'}}>
                <p><strong>Description:</strong></p>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  height: '200px',
                  padding: '10px',
                  borderRadius: '4px',
                  border: '1px solid #ccc',
                  resize: 'vertical'
                }}
                placeholder="Enter todo description..."
              />
            </div>

            {/* Sağ taraf - Tarih seçimleri */}
            <div style={{ 
              width: '300px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              marginLeft: '20px',
              marginTop: '10px'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '10px' }}>
                  <strong>Planlanan Başlangıç Tarihi:</strong>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    width: '80%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    position: 'center'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '10px' }}>
                  <strong>Planlanan Bitiş Tarihi:</strong>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    width: '80%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    position: 'center'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodoDetailModal;
