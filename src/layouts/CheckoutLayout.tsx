import { Outlet } from 'react-router-dom';
import { Link } from 'react-router-dom'
import { BRAND, CREAM } from '../lib/theme';

export default function CheckoutLayout() {
    return (
        <>
            <header className={`${CREAM} sticky top-0 z-50 py-4 px-4 flex items-center justify-center`}>
                <Link to='/' className={`flex-1 text-center font-serif text-xl font-bold tracking-tight ${BRAND}`}>
                The Bush.
                </Link>
            </header>
            <Outlet />
        </>
    )
}