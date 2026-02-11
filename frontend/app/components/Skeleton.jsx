'use client'

/**
 * Skeleton Component
 * Reusable skeleton loader for improving perceived performance
 * Replaces traditional spinners with content-aware placeholders
 */
export default function Skeleton({
    variant = 'card',
    lines = 3,
    className = '',
    width,
    height
}) {
    // Card variant - full component card skeleton
    if (variant === 'card') {
        return (
            <div className={`bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden ${className}`}>
                {/* Image placeholder */}
                <div className="aspect-[4/3] bg-gray-200 dark:bg-slate-800 animate-pulse" />

                {/* Content placeholder */}
                <div className="p-4 space-y-3">
                    {/* Title */}
                    <div className="h-5 bg-gray-200 dark:bg-slate-800 rounded animate-pulse w-3/4" />

                    {/* Stats row */}
                    <div className="flex gap-4">
                        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse w-16" />
                        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse w-16" />
                    </div>

                    {/* Tags */}
                    <div className="flex gap-2">
                        <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded animate-pulse w-12" />
                        <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded animate-pulse w-16" />
                    </div>

                    {/* Button */}
                    <div className="h-10 bg-gray-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                </div>
            </div>
        )
    }

    // Pack card variant - for packs page
    if (variant === 'pack') {
        return (
            <div className={`bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden ${className}`}>
                {/* Thumbnail placeholder */}
                <div className="aspect-video bg-gray-200 dark:bg-slate-800 animate-pulse" />

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Title */}
                    <div className="h-6 bg-gray-200 dark:bg-slate-800 rounded animate-pulse w-2/3" />

                    {/* Description */}
                    <div className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse" />
                        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse w-5/6" />
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4">
                        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse w-20" />
                        <div className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse w-24" />
                    </div>

                    {/* Price/Button area */}
                    <div className="h-12 bg-gray-200 dark:bg-slate-800 rounded-lg animate-pulse" />
                </div>
            </div>
        )
    }

    // Text variant - for text lines
    if (variant === 'text') {
        return (
            <div className={`space-y-2 ${className}`}>
                {Array.from({ length: lines }).map((_, i) => (
                    <div
                        key={i}
                        className="h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse"
                        style={{
                            width: i === lines - 1 ? '80%' : '100%'
                        }}
                    />
                ))}
            </div>
        )
    }

    // Avatar variant - circular
    if (variant === 'avatar') {
        const size = width || height || 'w-12 h-12'
        return (
            <div
                className={`${size} bg-gray-200 dark:bg-slate-800 rounded-full animate-pulse ${className}`}
            />
        )
    }

    // Rectangle variant - custom dimensions
    if (variant === 'rectangle') {
        const style = {}
        if (width) style.width = width
        if (height) style.height = height

        return (
            <div
                className={`bg-gray-200 dark:bg-slate-800 rounded animate-pulse ${className}`}
                style={style}
            />
        )
    }

    // Default fallback
    return (
        <div className={`h-4 bg-gray-200 dark:bg-slate-800 rounded animate-pulse ${className}`} />
    )
}
