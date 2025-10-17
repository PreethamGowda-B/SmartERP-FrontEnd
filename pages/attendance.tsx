import React, { useEffect, useState } from 'react';
import { apiClient } from '../lib/apiClient';

export default function AttendancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [location, setLocation] = useState('Site A');
  const [notes, setNotes] = useState('');

  async function load() {
    try {
      const res = await apiClient('/api/attendance');
      setRecords(res || []);
    } catch (err) { console.error(err); }
  }

  useEffect(() => { load(); }, []);

  async function clockIn() {
    try {
      await apiClient('/api/attendance/clock-in', { method: 'POST', body: JSON.stringify({ jobId: null, location, notes }) });
      setNotes(''); load();
    } catch (err) { console.error(err); }
  }

  async function clockOut(recordId: number) {
    try {
      await apiClient('/api/attendance/clock-out', { method: 'POST', body: JSON.stringify({ recordId }) });
      load();
    } catch (err) { console.error(err); }
  }

  return (
    <div style={{ maxWidth:900, margin:'24px auto', padding:16 }}>
      <h2>Attendance</h2>
      <div style={{ marginBottom:12 }}>
        <input value={location} onChange={e => setLocation(e.target.value)} />
        <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="notes" style={{marginLeft:8}} />
        <button onClick={clockIn} style={{marginLeft:8}}>Clock In</button>
      </div>
      <div>
        {records.map(r => (
          <div key={r.id} style={{padding:8, borderBottom:'1px solid #eee'}}>
            <div>{new Date(r.clock_in).toLocaleString()} — {r.location}</div>
            <div>Notes: {r.notes}</div>
            <div>
              {r.clock_out ? <small>Clocked out: {new Date(r.clock_out).toLocaleString()}</small> : <button onClick={() => clockOut(r.id)}>Clock Out</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
