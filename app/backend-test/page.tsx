'use client'; // Required for React hooks in Next.js 13+

import { useEffect, useState } from 'react';

interface BackendResponse {
  message?: string;
  ok?: boolean;
  user?: { id: number; email: string; role: string };
  [key: string]: any;
}

export default function BackendTestPage() {
  const [data, setData] = useState<BackendResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Function to fetch backend
  const fetchBackend = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:4000/api/auth', {
        method: 'GET', // temporary GET route
        credentials: 'include', // needed if cookies are used
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const jsonData: BackendResponse = await response.json();
      setData(jsonData);

    } catch (err: any) {
      setError(err.message || 'Unknown error');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch once on page load
  useEffect(() => {
    fetchBackend();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Backend Connection Test</h1>

      <button
        onClick={fetchBackend}
        style={{ marginBottom: '20px', padding: '8px 16px', cursor: 'pointer' }}
      >
        Test Backend Again
      </button>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {data && (
        <pre style={{ background: '#f4f4f4', padding: '10px', borderRadius: '6px' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}

      {!loading && !data && !error && <p>No data yet.</p>}
    </div>
  );
}
