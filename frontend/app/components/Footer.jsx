import Link from 'next/link'

export default function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="backdrop-blur-sm border-t transition-colors duration-300" style={{
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--bg-secondary)'
        }}>
            <div className="container mx-auto px-4 py-12">
                <div className="grid md:grid-cols-4 gap-8 mb-8">
                    {/* Column 1: Brand */}
                    <div>
                        <h3 className="font-bold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
                            UX Kit Express
                        </h3>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            La mejor biblioteca de componentes, templates e iconos para tus proyectos.
                        </p>
                    </div>

                    {/* Column 2: Product */}
                    <div>
                        <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                            Producto
                        </h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/pricing" className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                                    Precios
                                </Link>
                            </li>
                            <li>
                                <Link href="/dashboard" className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                                    Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link href="/components" className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                                    Componentes
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Company */}
                    <div>
                        <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                            Compañía
                        </h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/about" className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                                    Acerca de
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                                    Contacto
                                </Link>
                            </li>
                            <li>
                                <Link href="/blog" className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                                    Blog
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 4: Legal */}
                    <div>
                        <h4 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                            Legal
                        </h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/privacy" className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                                    Privacidad
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                                    Términos
                                </Link>
                            </li>
                            <li>
                                <Link href="/cookies" className="text-sm transition-colors" style={{ color: 'var(--text-secondary)' }}>
                                    Cookies
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar with Copyright */}
                <div className="pt-8 border-t text-center" style={{ borderColor: 'var(--border-color)' }}>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        © {currentYear} UX Kit Express. Todos los derechos reservados.{' '}
                        <span className="font-semibold">By GamezDev07</span>
                    </p>
                </div>
            </div>
        </footer>
    )
}
