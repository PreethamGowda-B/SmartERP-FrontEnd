import React, { useEffect, useState } from 'react';
import { apiClient } from '../lib/apiClient';

export default function ChatPage() {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<any[]>([]);

  async function fetchRecent() {
    try {
      const res = await apiClient('/api/activities');
      setMessages(res || []);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchRecent();
  }, []);

  async function send() {
    if (!text) return;
    try {
      await apiClient('/api/activities', { method: 'POST', body: JSON.stringify({ action: 'chat_message', details: text }) });
      setText('');
      fetchRecent();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div style={{ maxWidth:800, margin:'24px auto', padding:16 }}>
      <h2>Chat / Activities</h2>
      <div style={{marginBottom:12}}>
        <input value={text} onChange={e => setText(e.target.value)} style={{width:'80%'}} />
        <button onClick={send} style={{marginLeft:8}}>Send</button>
      </div>
      <div>
        {messages.map((m: any) => (
          <div key={m.id} style={{padding:8, borderBottom:'1px solid #eee'}}>
            <div><strong>{m.action}</strong> — <small>{new Date(m.timestamp).toLocaleString()}</small></div>
            <div>{m.details}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
