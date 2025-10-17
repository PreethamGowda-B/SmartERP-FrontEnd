import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { login } from '../lib/authService';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      router.push('/');
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    }
  }

  return (
    <div style={{ maxWidth:480, margin:'48px auto', padding:20 }}>
      <h2>Sign in</h2>
      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input value={email} onChange={e => setEmail(e.target.value)} style={{width:'100%'}} />
        <label style={{marginTop:8}}>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{width:'100%'}} />
        <div style={{marginTop:12}}>
          <button type="submit">Sign in</button>
        </div>
        {error && <p style={{color:'red'}}>{error}</p>}
      </form>
    </div>
  );
}
