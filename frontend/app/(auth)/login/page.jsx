'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { Mail, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const redirect = searchParams.get('redirect') || '/dashboard';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    if (formData.password.length < 1) {
      newErrors.password = 'La contraseña es requerida';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      console.log('🔐 Intentando login...');

      // Llamar a signIn (ahora usa backend custom)
      const result = await signIn(formData.email, formData.password);

      console.log('✅ Login exitoso:', result);

      // VERIFICAR que el token se guardó
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('userData');

      console.log('🔍 Token guardado:', token ? '✅ SÍ' : '❌ NO');
      console.log('🔍 UserData guardado:', userData ? '✅ SÍ' : '❌ NO');

      if (!token) {
        throw new Error('Token no se guardó en localStorage');
      }

      // Redirigir con parámetro de bienvenida
      window.location.href = `${redirect}?loggedin=true`;

    } catch (error) {
      console.error('❌ Login error:', error);
      setErrors({
        submit: error.message || 'Error al iniciar sesión. Verifica tus credenciales.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-red-500 to-orange-500 dark:from-blue-500 dark:to-violet-500 bg-clip-text text-transparent mb-2">
              UX Kit Express
            </h1>
          </Link>
          <p className="text-gray-600 dark:text-gray-400">
            Inicia sesión en tu cuenta
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl p-8 shadow-glow">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-white/10'
                    } rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="tu@email.com"
                  required
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border ${errors.password ? 'border-red-500' : 'border-gray-300 dark:border-white/10'
                    } rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="••••••••"
                  required
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
              )}
            </div>

            {/* Olvidé contraseña */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Recordarme</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-blue-600 dark:text-blue-500 hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Error general */}
            {errors.submit && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{errors.submit}</p>
              </div>
            )}

            {/* Botón submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  Iniciar sesión
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-900 text-gray-500 dark:text-gray-400">o</span>
            </div>
          </div>

          {/* Crear cuenta */}
          <p className="text-center text-gray-600 dark:text-gray-400">
            ¿No tienes una cuenta?{' '}
            <Link href="/signup" className="text-blue-600 dark:text-blue-500 font-semibold hover:underline">
              Regístrate gratis
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
          Al iniciar sesión, aceptas nuestros{' '}
          <Link href="/terms" className="text-blue-600 dark:text-blue-500 hover:underline">
            Términos de Servicio
          </Link>{' '}
          y{' '}
          <Link href="/privacy" className="text-blue-600 dark:text-blue-500 hover:underline">
            Política de Privacidad
          </Link>
        </p>
      </div>
    </div>
  );
}
