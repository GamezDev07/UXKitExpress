'use client'

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';

const PackSlider = ({ images = [], packName = "" }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Si no hay imágenes, mostramos el placeholder actual
    if (!images || images.length === 0) {
        return (
            <div className="absolute inset-0 flex items-center justify-center">
                <Package className="w-16 h-16 text-white/50" />
            </div>
        );
    }

    const nextSlide = (e) => {
        e.preventDefault();
        e.stopPropagation(); // Evita navegar al detalle del pack al hacer click en la flecha
        setCurrentIndex((prev) => (prev + 1) % images.length);
    };

    const prevSlide = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
        <div className="relative w-full h-full group/slider overflow-hidden">
            {/* Contenedor de Imágenes con Transición Suave */}
            <div className="absolute inset-0">
                {images.map((img, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                            }`}
                    >
                        <img
                            src={img}
                            alt={`${packName} vista ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ))}
            </div>

            {/* Controles de Navegación (Solo si hay más de 1 imagen) */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md opacity-0 group-hover/slider:opacity-100 transition-all z-20 border border-white/10"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-md opacity-0 group-hover/slider:opacity-100 transition-all z-20 border border-white/10"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>

                    {/* Indicadores (Dots) */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                        {images.map((_, index) => (
                            <div
                                key={index}
                                className={`h-1.5 rounded-full transition-all duration-300 ${index === currentIndex ? 'bg-white w-4' : 'bg-white/40 w-1.5'
                                    }`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default PackSlider;
