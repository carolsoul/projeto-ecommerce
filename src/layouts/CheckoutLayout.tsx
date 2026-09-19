import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom'

export default function CheckoutLayout() {
    return (
        <>
            <header className='bg-white shadow-sm py-4 px-4 flex items-center justify-center'> 
                <Link to='/' className='text-lg font-bold text-gray-800'>
                Minha Loja
                </Link>
            </header>
            <Outlet />
        </>
    )
}