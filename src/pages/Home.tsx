import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Banner } from '../components/Banner';
import ProductCategory from '../components/ProductCategory';
import ProductList from '../components/ProductList';
import SearchResults from '../components/SearchResults';

const Home: React.FC = () => {
    // Busca e categoria vivem na URL (`/?q=camiseta`, `/?categoria=roupas`) em
    // vez de num estado do Header: assim o resultado é compartilhável, o botão
    // voltar funciona e o Header não precisa conhecer quem exibe os produtos.
    const [searchParams] = useSearchParams();
    const searchTerm = (searchParams.get('q') ?? '').trim();
    const categoryParam = (searchParams.get('categoria') ?? '').trim();
    const category = categoryParam === '' ? null : categoryParam;

    // Busca é uma tela de resultados: o banner promocional dá lugar aos
    // produtos e o filtro avançado de categorias entra em cena. Fora da busca,
    // a Home segue sendo vitrine.
    if (searchTerm !== '') {
        return (
            <main className='container mx-auto px-4'>
                <SearchResults searchTerm={searchTerm} />
            </main>
        );
    }

    return (
        <main className='container mx-auto px-4'>
            <Banner
                title="Bem-vindo à nossa loja!"
                subtitle="Encontre os melhores produtos com descontos incríveis."
                imageUrl="https://plus.unsplash.com/premium_photo-1742833661693-d54d72a51b1a?q=80&w=997&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                buttonText="Confira Agora"
                buttonLink="/products"
            />

            <ProductCategory activeCategory={category} />

            {/* A `key` remonta a lista quando a categoria muda, reiniciando a
                paginação sem precisar de um efeito limpando estado. */}
            <ProductList key={category ?? 'todas'} category={category} />
        </main>
    )
}

export default Home;
