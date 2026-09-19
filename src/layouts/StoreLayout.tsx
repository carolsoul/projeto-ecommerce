import { Outlet } from 'react-router-dom';
import Header from '../components/Header';

export default function StoreLayout() {
    return(
        <>
            <Header />
            <Outlet />
        </>
    )
}