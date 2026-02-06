'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Download, CheckCircle, FileArchive, ExternalLink } from 'lucide-react'
import Header from '../../components/Header'
import { useAuth } from '../../context/AuthContext'

export default function DownloadPage() {
    const { packId } = useParams()
    const searchParams = useSearchParams()
    const router = useRouter()
    const { user } = useAuth()

    const [downloadUrl, setDownloadUrl] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const sessionId = searchParams.get('session_id')

    useEffect(() => {
        if (!user) {
            router.push('/login')
            return
        }

        async function generateDownloadLink() {
            try {
                const token = localStorage.getItem('token')
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/packs/download/${packId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                )

                const data = await res.json()

                if (data.downloadUrl) {
                    setDownloadUrl(data.downloadUrl)
                } else if (data.error) {
                    setError(data.error)
                }
            } catch (error) {
                console.error('Error generating download link:', error)
                setError('Error al generar el link de descarga')
            } finally {
                setLoading(false)
            }
        }

        generateDownloadLink()
    }, [packId, user, router])

    function handleDownload() {
        if (downloadUrl) {
            window.open(downloadUrl, '_blank')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
                <Header />
                <div className="container mx-auto px-4 py-20">
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">
                            Preparando tu descarga...
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
            <Header />

            <div className="container mx-auto px-4 py-20">
                <div className="max-w-2xl mx-auto">
                    {error ? (
                        // Error State
                        <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900 rounded-xl p-8 text-center">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ExternalLink className="w-8 h-8 text-red-600 dark:text-red-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                No pudimos generar el link
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {error}
                            </p>
                            <button
                                onClick={() => router.push('/packs')}
                                className="btn-primary"
                            >
                                Volver a Packs
                            </button>
                        </div>
                    ) : (
                        // Success State
                        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl p-8">
                            {/* Success Icon */}
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-500" />
                                </div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                    ¡Compra exitosa!
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Gracias por tu compra. Tu pack está listo para descargar.
                                </p>
                            </div>

                            {/* Download Button */}
                            <button
                                onClick={handleDownload}
                                className="w-full btn-primary mb-6 text-lg py-4"
                            >
                                <Download className="w-6 h-6" />
                                Descargar Pack
                            </button>

                            {/* Info */}
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                                <div className="flex gap-3">
                                    <FileArchive className="w-5 h-5 text-blue-600 dark:text-blue-500 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-blue-900 dark:text-blue-300">
                                        <p className="font-semibold mb-1">Link válido por 1 hora</p>
                                        <p>Puedes volver a generar el link desde tu perfil en cualquier momento.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Instructions */}
                            <div className="border-t border-gray-200 dark:border-white/10 pt-6">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                                    Próximos pasos:
                                </h3>
                                <ol className="space-y-3 text-gray-600 dark:text-gray-400">
                                    <li className="flex gap-3">
                                        <span className="font-semibold text-gray-900 dark:text-white">1.</span>
                                        <span>Descarga el archivo .zip</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="font-semibold text-gray-900 dark:text-white">2.</span>
                                        <span>Descomprime el archivo en tu proyecto</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="font-semibold text-gray-900 dark:text-white">3.</span>
                                        <span>Lee el README.md para instrucciones de instalación</span>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="font-semibold text-gray-900 dark:text-white">4.</span>
                                        <span>¡Empieza a usar los componentes!</span>
                                    </li>
                                </ol>
                            </div>

                            {/* Support */}
                            <div className="border-t border-gray-200 dark:border-white/10 pt-6 mt-6 text-center">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    ¿Necesitas ayuda?
                                </p>
                                <a
                                    href="mailto:support@uxkitexpress.com"
                                    className="text-blue-600 dark:text-blue-500 hover:underline text-sm"
                                >
                                    Contacta a soporte
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
