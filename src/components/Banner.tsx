import React from 'react';
import { Link } from 'react-router-dom';
import { BRAND, BRAND_BG, ON_BRAND, PINK, PINK_HOVER } from '../lib/theme';

interface BannerProps {
    title?: string;
    subtitle?: string;
    imageUrl?: string;
    alt?: string;
    buttonText?: string;
    buttonLink?: string;
}

export const Banner: React.FC<BannerProps> = ({
    title,
    subtitle,
    imageUrl,
    alt = '',
    buttonText,
    buttonLink,
}) => {
    const hasOverlay = Boolean(title || subtitle || buttonText);

    return (
        <section className={`relative w-full h-[500px] ${BRAND_BG} overflow-hidden rounded-lg my-6`}>
            {imageUrl && (
                <img
                    src={imageUrl}
                    alt={alt}
                    width={1600}
                    height={500}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover"
                />
            )}

            {hasOverlay && (
                <div className={`absolute inset-0 flex flex-col justify-center items-start p-8 ${ON_BRAND}`}>
                    {title && <h2 className="text-4xl font-bold mb-2">{title}</h2>}
                    {subtitle && <p className="text-lg mb-4">{subtitle}</p>}

                    {/* `Link`, não `<a href>`: âncora faz recarga completa da
                        página e joga fora o estado da SPA (sessão, carrinho em
                        memória, posição de rolagem). */}
                    {buttonText && buttonLink && (
                        <Link
                            to={buttonLink}
                            className={`${PINK} ${BRAND} font-semibold px-6 py-2 rounded-4xl ${PINK_HOVER} transition-colors`}
                        >
                            {buttonText}
                        </Link>
                    )}
                </div>
            )}
        </section>
    );
};
