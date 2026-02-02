'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extraer parámetros de URL (incluido session_id de Stripe)
  const sessionId = searchParams.get('session_id');
  const selectedPlan = searchParams.get('plan');
  const selectedInterval = searchParams.get('interval');

  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Determinar texto del botón según si viene de pago
  const hasPaidPlan = selectedPlan && selectedPlan !== 'free';
  const buttonText = sessionId
    ? 'Completar Registro'
    : (hasPaidPlan ? 'Continuar al Pago' : 'Crear cuenta gratis');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
  };

  const validateForm = () => {
    const newErrors = {};
    if (formData.fullName.length < 2) newErrors.fullName = 'El nombre debe tener al menos 2 caracteres';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Email inválido';
    if (formData.password.length < 8) newErrors.password = 'Mínimo 8 caracteres';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Las contraseñas no coinciden';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      // ✅ LLAMAR AL BACKEND (NO a Supabase Auth directamente)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          sessionId: sessionId || null // Enviar session_id si existe
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al registrar');
      }

      const data = await response.json();
      console.log('Registration successful:', data);

      // Guardar token en localStorage
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }

      // Redirigir según el resultado
      if (sessionId) {
        // Usuario viene de pago - ir a dashboard
        router.push('/dashboard?registered=true');
      } else if (hasPaidPlan) {
        // Usuario seleccionó plan pero aún no pagó - redirect a pricing
        router.push('/pricing?registered=true');
      } else {
        // Plan gratuito - ir a dashboard
        router.push('/dashboard?registered=true');
      }

    } catch (error) {
      console.error('Signup Error:', error);
      let msg = error.message || 'Error desconocido';

      // Traducción de errores comunes
      if (msg.includes('rate_limit') || msg.includes('429')) {
        msg = 'Demasiados intentos. Por favor espera 30 segundos.';
      } else if (msg.includes('already') || msg.includes('existe')) {
        msg = 'Este correo ya está registrado. Inicia sesión.';
      } else if (msg.includes('Pago no completado')) {
        msg = 'El pago no se pudo verificar. Por favor contacta soporte.';
      }

      setErrors({ submit: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block"><h1 className="text-3xl font-bold text-primary-600 mb-2">UX-Kit Express</h1></Link>
          <p className="text-gray-600">Crea tu cuenta y comienza gratis</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Mensaje de confirmación de pago */}
            {sessionId && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-green-800">✓ Pago completado exitosamente</p>
                  <p className="text-sm text-green-700 mt-1">
                    Plan: <strong className="capitalize">{selectedPlan}</strong> ({selectedInterval})
                  </p>
                  <p className="text-xs text-green-600 mt-1">Completa tu registro para activar tu suscripción</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo</label>
              <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input name="fullName" type="text" value={formData.fullName} onChange={handleChange} className={`input-field pl-10 ${errors.fullName ? 'border-red-500' : ''}`} placeholder="Juan Pérez" required /></div>
              {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input name="email" type="email" value={formData.email} onChange={handleChange} className={`input-field pl-10 ${errors.email ? 'border-red-500' : ''}`} placeholder="tu@email.com" required /></div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input name="password" type="password" value={formData.password} onChange={handleChange} className={`input-field pl-10 ${errors.password ? 'border-red-500' : ''}`} placeholder="Mínimo 8 caracteres" required /></div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirmar contraseña</label>
              <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} className={`input-field pl-10 ${errors.confirmPassword ? 'border-red-500' : ''}`} placeholder="Confirma tu contraseña" required /></div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>

            <div className="flex items-start">
              <input id="terms" type="checkbox" className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-1" required />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-600">Acepto los <Link href="/terms" className="text-primary-600 hover:underline">Términos</Link> y la <Link href="/privacy" className="text-primary-600 hover:underline">Política de Privacidad</Link></label>
            </div>

            {errors.submit && <div className="p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm text-red-600">{errors.submit}</p></div>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Procesando...' : <><span className="mr-2">{buttonText}</span><ArrowRight className="w-5 h-5" /></>}
            </button>
          </form>

          <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">o</span></div></div>
          <p className="text-center text-gray-600">¿Ya tienes una cuenta? <Link href="/login" className="text-primary-600 font-semibold hover:text-primary-700">Inicia sesión</Link></p>
        </div>
      </div>
    </div>
  );
}
