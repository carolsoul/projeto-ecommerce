import React from 'react';
import { Banner } from '../components/Banner';
import Header from '../components/Header';
import ProductCategory from '../components/ProductCategory';
import ProductList from '../components/ProductList';

const Home: React.FC = () => {
    return (
        <main className='container mx-auto px-4'>
            <Header />
            <Banner 
                title="Bem-vindo à nossa loja!"
                subtitle="Encontre os melhores produtos com descontos incríveis."
                imageUrl="https://plus.unsplash.com/premium_photo-1742833661693-d54d72a51b1a?q=80&w=997&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                buttonText="Confira Agora"
                buttonLink="/products"
            />

            <ProductCategory />
            <ProductList />
        </main>
    )
}

export default Home;