import { Loader2 } from 'lucide-react'

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    icon: Icon,
    iconPosition = 'right',
    onClick,
    type = 'button',
    className = '',
    ...props
}) {
    const baseStyles = 'font-semibold rounded-lg transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
        primary: 'bg-gradient-to-r from-blue-500 to-violet-500 text-white hover:shadow-lg hover:shadow-blue-500/50',
        secondary: 'bg-white/10 text-white hover:bg-white/20',
        outline: 'border border-white/10 text-white hover:border-white/20 hover:bg-white/5',
        ghost: 'text-slate-300 hover:text-white hover:bg-white/5',
        danger: 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
    }

    const sizes = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg'
    }

    return (
        <button
            type={type}
            disabled={disabled || loading}
            onClick={onClick}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {!loading && Icon && iconPosition === 'left' && <Icon className="w-4 h-4" />}
            {children}
            {!loading && Icon && iconPosition === 'right' && <Icon className="w-4 h-4" />}
        </button>
    )
}
