import { collection, query, orderBy, onSnapshot} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/useAuth'
import type { Order } from '../../types/order';
import { Link } from 'react-router-dom'
import { BORDER, BRAND, CARD, DIVIDE, FOCUS, PINK_HOVER, SUBTLE } from '../../lib/theme';

export default function AdmOrders() {

    const { user, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    
    useEffect(() => {

        const ordersQuery = query(
            collection(db, 'orders'),
            orderBy('createdAt', 'desc'),
           
        );

        const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id,
            })) as Order[];

            setOrders(data);
        });

        return () => unsubscribe();
    }, [user, authLoading]);

    return (
        <main className="max-w-5xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Fila de Despachos</h1>

            <div className={`w-full border ${BORDER} shadow-sm rounded-2xl p-4 overflow-x-auto`}>
               <table className="min-w-full">
                  <thead className={`${CARD} whitespace-nowrap ${BRAND} text-left text-sm font-semibold`}>
                     <tr>
                        <th scope="col" className="px-4 py-3">Pedido</th>
                        <th scope="col" className="px-4 py-3">Data</th>
                        <th scope="col" className="px-4 py-3">Cliente</th>
                        <th scope="col" className="px-4 py-3">Total</th>
                        <th scope="col" className="px-4 py-3">Pagamento</th>
                        <th scope="col" className="px-4 py-3">Entrega</th>
                        <th scope="col" className="px-4 py-3">Ações</th>
                     </tr>
                  </thead>

                  <tbody className={`whitespace-nowrap text-sm divide-y ${DIVIDE}`}>
                     {orders.map((order) => (
                        <tr key={order.id}>
                           <td className={`px-4 py-3 text-sm ${BRAND} font-medium`}>
                              {order.id}
                           </td>
                           <td className={`px-4 py-3 text-sm ${BRAND} font-medium`}>
                              {order.createdAt?.toDate().toLocaleDateString()}
                           </td>
                           <td className={`px-4 py-3 text-sm ${SUBTLE} font-medium`}>
                              {order.address.recipient}
                           </td>
                           <td className={`px-4 py-3 text-sm ${SUBTLE} font-medium`}>
                              {order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                           </td>
                            <td className={`px-4 py-3 text-sm ${SUBTLE} font-medium`}>{order.status}</td>
                            <td className={`px-4 py-3 text-sm ${SUBTLE} font-medium`}>{order.fulfillment?.status ?? 'Não iniciado'}</td>
                           <td className="px-4 py-3">
                              <Link to={`/admin/orders/${order.id}`} className={`px-2.5 py-1.5 ${BRAND} text-sm font-semibold rounded-md cursor-pointer ${CARD} ${PINK_HOVER} border ${BORDER} transition-colors ${FOCUS}`}>
                                 Detalhes
                              </Link>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>

        </main>
    )
}

