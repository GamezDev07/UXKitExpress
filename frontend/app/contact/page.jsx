'use client'

import { useState } from 'react'
import { Send, CheckCircle, Loader2, Mail, User, FileText, MessageSquare } from 'lucide-react'
import Header from '../components/Header'
import Button from '../components/Button'
import { useAuth } from '../context/AuthContext'

export default function ContactPage() {
    const { userPlan } = useAuth()
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [error, setError] = useState(null)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Error al enviar el mensaje')
            }

            setIsSubmitted(true)
            setTimeout(() => {
                setIsSubmitted(false)
                setFormData({ name: '', email: '', subject: '', message: '' })
            }, 3000)
        } catch (err) {
            setError(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <Header userPlan={userPlan} />

            <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20">
                <div className="max-w-2xl w-full">
                    <div className="text-center mb-12">
                        <div className="inline-flex p-3 bg-gradient-to-br from-blue-500/20 to-violet-500/20 rounded-full mb-6">
                            <Mail className="w-8 h-8 text-blue-400" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Hablemos
                        </h1>
                        <p className="text-xl text-slate-400">
                            ¿Tienes preguntas? Estamos aquí para ayudarte.
                        </p>
                    </div>

                    <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-8 backdrop-blur">
                        {isSubmitted ? (
                            <div className="text-center py-12">
                                <div className="inline-flex p-4 bg-green-500/20 rounded-full mb-6">
                                    <CheckCircle className="w-12 h-12 text-green-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">
                                    ¡Mensaje Enviado!
                                </h3>
                                <p className="text-slate-400">
                                    Nos pondremos en contacto contigo pronto.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                                        Nombre Completo
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            placeholder="Tu nombre"
                                            className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                                        Correo Electrónico
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            placeholder="tu@email.com"
                                            className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="subject" className="block text-sm font-medium text-slate-300 mb-2">
                                        Asunto
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="text"
                                            id="subject"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            required
                                            placeholder="¿En qué podemos ayudarte?"
                                            className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">
                                        Mensaje
                                    </label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-4 text-slate-400">
                                            <MessageSquare className="w-5 h-5" />
                                        </div>
                                        <textarea
                                            id="message"
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            required
                                            rows="6"
                                            placeholder="Cuéntanos más sobre tu consulta..."
                                            className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all resize-none"
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    loading={isSubmitting}
                                    icon={Send}
                                    className="w-full py-4"
                                >
                                    {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
                                </Button>
                            </form>
                        )}
                    </div>

                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-6 bg-slate-900/30 border border-white/10 rounded-xl">
                            <Mail className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                            <h3 className="font-semibold text-white mb-1">Email</h3>
                            <p className="text-sm text-slate-400">support@uxkitexpress.com</p>
                        </div>
                        <div className="text-center p-6 bg-slate-900/30 border border-white/10 rounded-xl">
                            <MessageSquare className="w-8 h-8 text-violet-400 mx-auto mb-3" />
                            <h3 className="font-semibold text-white mb-1">Chat</h3>
                            <p className="text-sm text-slate-400">Disponible L-V 9-18h</p>
                        </div>
                        <div className="text-center p-6 bg-slate-900/30 border border-white/10 rounded-xl">
                            <FileText className="w-8 h-8 text-green-400 mx-auto mb-3" />
                            <h3 className="font-semibold text-white mb-1">Docs</h3>
                            <p className="text-sm text-slate-400">docs.uxkitexpress.com</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
