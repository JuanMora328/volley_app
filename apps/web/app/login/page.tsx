'use client';
import { useState } from 'react';
import { api } from '../../lib/api';
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  async function submit() {
    const r = await api<{ accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    sessionStorage.setItem('vf_token', r.accessToken);
    location.href = '/';
  }
  return (
    <div className="mx-auto max-w-sm space-y-4 pt-20">
      <h1 className="text-3xl font-bold">Iniciar sesión</h1>
      <input
        className="input"
        placeholder="Correo"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="input"
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className="btn w-full" onClick={submit}>
        Entrar
      </button>
    </div>
  );
}
