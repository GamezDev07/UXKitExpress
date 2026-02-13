'use client'

import Link from 'next/link'
import FavoriteButton from './FavoriteButton'
import PlanBadge from './PlanBadge'

export default function ComponentCard({ component }) {
    return (
        <div className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all">
            {/* Thumbnail */}
            <div className="relative aspect-video bg-gray-100 dark:bg-gray-900 overflow-hidden">
                {component.thumbnail_url ? (
                    <img
                        src={component.thumbnail_url}
                        alt={component.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}

                {/* Favorite Button - Top Right */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full shadow-lg">
                        <FavoriteButton
                            itemId={component.id}
                            itemType="component"
                        />
                    </div>
                </div>

                {/* Plan Badge - Top Left */}
                {component.tier && component.tier !== 'free' && (
                    <div className="absolute top-3 left-3">
                        <PlanBadge plan={component.tier} size="sm" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1">
                    {component.name}
                </h3>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {component.description}
                </p>

                {/* Tags */}
                {component.tags && component.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {component.tags.slice(0, 3).map((tag, index) => (
                            <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-md"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>{component.views || 0}</span>
                    </div>

                    <Link
                        href={`/components/${component.slug || component.id}`}
                        className="text-sm font-semibold text-red-600 dark:text-blue-500 hover:underline"
                    >
                        View Details →
                    </Link>
                </div>
            </div>
        </div>
    )
}
