'use client';
import { Eye, EyeOff, Loader2, Volleyball } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { api, getToken, LoginResponse, setToken } from '../../lib/api';
import { loginSchema, LoginForm } from '../../lib/auth-validation';

export default function Login() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>();

  useEffect(() => {
    if (getToken()) router.replace('/');
  }, [router]);

  async function onSubmit(values: LoginForm) {
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues)
        setError(issue.path[0] as keyof LoginForm, { message: issue.message });
      return;
    }
    try {
      const response = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(parsed.data),
      });
      setToken(response.accessToken);
      toast.success(`Bienvenido, ${response.user.name}`);
      router.replace('/');
    } catch {
      setError('password', { message: 'Correo o contraseña inválidos.' });
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f9fb] p-4 text-[#191c1e]">
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-lime-400/20 blur-3xl" />
      <section className="relative w-full max-w-[440px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#091426] text-white shadow-xl">
            <Volleyball size={40} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#091426]">VolleyFlow</h1>
          <p className="mt-2 text-base text-[#45474c]">Organiza tus partidos sin perder el ritmo</p>
        </div>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-2xl border border-[#c5c6cd]/40 bg-white p-8 shadow-xl shadow-slate-200/60"
        >
          <div className="space-y-5">
            <label className="block text-sm font-semibold text-[#091426]">
              Correo electrónico
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="ejemplo@correo.com"
                aria-invalid={Boolean(errors.email)}
                className="mt-2 h-[52px] w-full rounded-2xl border border-[#c5c6cd] bg-[#f7f9fb] px-4 outline-none ring-[#0051d5]/20 focus:border-[#0051d5] focus:ring-4"
              />
            </label>
            {errors.email && (
              <p className="text-sm font-medium text-red-700">{errors.email.message}</p>
            )}
            <label className="block text-sm font-semibold text-[#091426]">
              Contraseña
              <span className="relative mt-2 block">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  aria-invalid={Boolean(errors.password)}
                  className="h-[52px] w-full rounded-2xl border border-[#c5c6cd] bg-[#f7f9fb] px-4 pr-12 outline-none ring-[#0051d5]/20 focus:border-[#0051d5] focus:ring-4"
                />
                <button
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-4 text-[#45474c]"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </span>
            </label>
            {errors.password && (
              <p className="text-sm font-medium text-red-700">{errors.password.message}</p>
            )}
            <button
              disabled={isSubmitting}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#0051d5] text-lg font-semibold text-white shadow-lg shadow-blue-500/20 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting && <Loader2 className="animate-spin" />}Iniciar sesión
            </button>
          </div>
        </form>
        <p className="mt-8 text-center text-xs text-[#45474c]/70">
          © 2026 VolleyFlow Professional Sports Management
        </p>
      </section>
    </main>
  );
}
