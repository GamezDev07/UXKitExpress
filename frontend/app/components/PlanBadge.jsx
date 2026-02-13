'use client'

import { Crown, Zap, Shield, User, Sparkles } from 'lucide-react'

export default function PlanBadge({
    plan = 'free',
    size = 'md',
    showIcon = true,
    className = ''
}) {
    // Normalize plan name
    const normalizedPlan = (plan || 'free').toLowerCase()

    const planConfigs = {
        free: {
            label: 'Free',
            baseColor: 'bg-gray-100 dark:bg-gray-800',
            textColor: 'text-gray-700 dark:text-gray-300',
            borderColor: 'border-gray-200 dark:border-gray-700',
            icon: <User className="w-3 h-3" />,
            hasLavaLamp: false
        },
        basic: {
            label: 'Basic',
            baseColor: 'bg-blue-500/10 dark:bg-blue-500/20',
            textColor: 'text-blue-700 dark:text-blue-300',
            borderColor: 'border-blue-200 dark:border-blue-800',
            icon: <Zap className="w-3 h-3" />,
            hasLavaLamp: true,
            lavaColors: `
        before:bg-gradient-to-r before:from-blue-400 before:via-cyan-400 before:to-blue-500
        dark:before:from-blue-500 dark:before:via-cyan-500 dark:before:to-blue-600
      `
        },
        advance: {
            label: 'Advance',
            baseColor: 'bg-purple-500/10 dark:bg-purple-500/20',
            textColor: 'text-purple-700 dark:text-purple-300',
            borderColor: 'border-purple-200 dark:border-purple-800',
            icon: <Shield className="w-3 h-3" />,
            hasLavaLamp: true,
            lavaColors: `
        before:bg-gradient-to-r before:from-purple-400 before:via-pink-400 before:to-purple-500
        dark:before:from-purple-500 dark:before:via-pink-500 dark:before:to-purple-600
      `
        },
        pro: {
            label: 'Pro',
            baseColor: 'bg-amber-500/10 dark:bg-amber-500/20',
            textColor: 'text-amber-700 dark:text-amber-300',
            borderColor: 'border-amber-200 dark:border-amber-800',
            icon: <Crown className="w-3 h-3" />,
            hasLavaLamp: true,
            lavaColors: `
        before:bg-gradient-to-r before:from-amber-400 before:via-orange-400 before:to-amber-500
        dark:before:from-amber-500 dark:before:via-orange-500 dark:before:to-amber-600
      `
        },
        professional: {
            label: 'Pro',
            baseColor: 'bg-amber-500/10 dark:bg-amber-500/20',
            textColor: 'text-amber-700 dark:text-amber-300',
            borderColor: 'border-amber-200 dark:border-amber-800',
            icon: <Crown className="w-3 h-3" />,
            hasLavaLamp: true,
            lavaColors: `
        before:bg-gradient-to-r before:from-amber-400 before:via-orange-400 before:to-amber-500
        dark:before:from-amber-500 dark:before:via-orange-500 dark:before:to-amber-600
      `
        },
        enterprise: {
            label: 'Enterprise',
            baseColor: 'bg-red-500/10 dark:bg-red-500/20',
            textColor: 'text-red-700 dark:text-red-300',
            borderColor: 'border-red-200 dark:border-red-800',
            icon: <Sparkles className="w-3 h-3" />,
            hasLavaLamp: true,
            lavaColors: `
        before:bg-gradient-to-r before:from-red-400 before:via-rose-400 before:to-red-500
        dark:before:from-red-500 dark:before:via-rose-500 dark:before:to-red-600
      `
        }
    }

    const config = planConfigs[normalizedPlan] || planConfigs.free

    const sizeClasses = {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-xs',
        lg: 'px-4 py-1.5 text-sm'
    }

    return (
        <div
            className={`
        inline-flex items-center gap-1.5 rounded-full font-semibold
        border relative overflow-hidden
        ${config.baseColor} 
        ${config.textColor} 
        ${config.borderColor}
        ${sizeClasses[size]}
        ${config.hasLavaLamp ? 'lava-lamp-badge' : ''}
        ${className}
      `}
        >
            {/* Lava Lamp Effect (only for paid plans) */}
            {config.hasLavaLamp && (
                <div
                    className={`
            lava-lamp-bg
            ${config.lavaColors}
          `}
                />
            )}

            {/* Content */}
            <span className="relative z-10 flex items-center gap-1.5">
                {showIcon && config.icon}
                <span>{config.label}</span>
            </span>
        </div>
    )
}
