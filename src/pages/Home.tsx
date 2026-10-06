import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Banner } from '../components/Banner';
import ProductCategory from '../components/ProductCategory';
import ProductList from '../components/ProductList';
import SearchResults from '../components/SearchResults';
import { CREAM, PINK } from '../lib/theme';

const Home: React.FC = () => {
    const [searchParams] = useSearchParams();
    const searchTerm = (searchParams.get('q') ?? '').trim();
    const categoryParam = (searchParams.get('categoria') ?? '').trim();
    const category = categoryParam === '' ? null : categoryParam;

    if (searchTerm !== '') {
        return (
            <main className={`container mx-auto px-4 ${PINK}`}>
                <SearchResults searchTerm={searchTerm} />
            </main>
        );
    }

    return (
        <main className={`mx-auto py-4 w-full ${CREAM}`}>
            <div className="grid gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 px-8">
                <Banner
                title="The Bush."
                subtitle="Escolha itens de uma coleção retrô estilosa com modelos únicos e diferentes cores e formas."
                buttonText="Confira Agora"
                buttonLink="#"
                />

                <Banner 
                imageUrl="https://plus.unsplash.com/premium_photo-1742833661693-d54d72a51b1a?q=80&w=997&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                />
            </div>

            <ProductCategory activeCategory={category} />
            <ProductList key={category ?? 'todas'} category={category} />
        </main>
    )
}

export default Home;
