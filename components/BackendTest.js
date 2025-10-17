'use client'; // required for components using hooks in Next.js 13+

import { useEffect, useState } from 'react';

const BackendTest = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBackend = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/auth'); // your backend route
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const jsonData = await response.json();
        setData(jsonData);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchBackend();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Backend Connection Test</h2>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {data ? (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      ) : (
        !error && <p>Loading...</p>
      )}
    </div>
  );
};

export default BackendTest;
