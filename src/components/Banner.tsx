import React from 'react';

interface BannerProps {
    title: string;
    subtitle?: string;
    imageUrl?: string;
    buttonText?: string;
    buttonLink?: string;
}

export const Banner: React.FC<BannerProps> = ({
     title,
    subtitle, 
    imageUrl, 
    buttonText = 'Confira Agora', 
    buttonLink = '#',
}) => {
    return (
        <section className='relative w-full h-[500px] overflow-hidden rounded-lg my-6'>
            {/* Hero da Home: é o elemento LCP, então carrega com prioridade
                alta em vez de lazy — adiar isto atrasaria a métrica. */}
            <img
                src={imageUrl}
                alt={title}
                width={1600}
                height={500}
                loading='eager'
                fetchPriority='high'
                decoding='async'
                className='absolute inset-0 w-full h-full object-cover'
            />
            <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-start p-8 text-white">
                <h2 className='text-4xl font-bold mb-2'>{title}</h2>
                {subtitle && <p className='text-lg mb-4'>{subtitle}</p>}
                <a href={buttonLink} className='bg-white text-black font-semibold px-6 py-2 rounded-md hover:bg-gray-200 transition-colors'>
                    {buttonText}
                </a>
            </div>
        </section>
    )
}