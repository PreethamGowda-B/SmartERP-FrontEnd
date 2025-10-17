import React, { useEffect, useState } from 'react';
import { apiClient } from '../lib/apiClient';

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');

  async function load() {
    try {
      const res = await apiClient('/api/materials/items');
      setItems(res || []);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => { load(); }, []);

  async function create() {
    try {
      await apiClient('/api/materials/items', { method: 'POST', body: JSON.stringify({ sku, name, quantity: 0, unit: 'pcs' }) });
      setSku(''); setName(''); load();
    } catch (err) { console.error(err); }
  }

  return (
    <div style={{ maxWidth:900, margin:'24px auto', padding:16 }}>
      <h2>Inventory</h2>
      <div style={{ marginBottom:12 }}>
        <input placeholder="SKU" value={sku} onChange={e => setSku(e.target.value)} />
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} style={{marginLeft:8}} />
        <button onClick={create} style={{marginLeft:8}}>Create</button>
      </div>
      <div>
        {items.map(it => (
          <div key={it.id} style={{padding:8, borderBottom:'1px solid #eee'}}>
            <strong>{it.sku}</strong> — {it.name} — {it.quantity} {it.unit}
          </div>
        ))}
      </div>
    </div>
  );
}
