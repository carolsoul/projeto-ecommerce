import { collection, query, orderBy, onSnapshot} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/useAuth'
import type { Order } from '../../types/order';
import { Link } from 'react-router-dom'

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

            <div className="w-full border border-slate-300 shadow-sm rounded-2xl p-4 overflow-x-auto">
               <table className="min-w-full">
                  <thead className="bg-gray-100 whitespace-nowrap text-slate-900 text-left text-sm font-semibold">
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

                  <tbody className="whitespace-nowrap text-sm divide-y divide-slate-200">
                     {orders.map((order) => (
                        <tr key={order.id}>
                           <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                              {order.id}
                           </td>
                           <td className="px-4 py-3 text-sm text-slate-900 font-medium">
                              {order.createdAt?.toDate().toLocaleDateString()}
                           </td>
                           <td className="px-4 py-3 text-sm text-slate-500 font-medium">
                              {order.address.recipient}
                           </td>
                           <td className="px-4 py-3 text-sm text-slate-500 font-medium">
                              {order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                           </td>
                            <td className="px-4 py-3 text-sm text-slate-500 font-medium">{order.status}</td>
                            <td className="px-4 py-3 text-sm text-slate-500 font-medium">{order.fulfillment?.status}</td>
                           <td className="px-4 py-3">
                              <Link to={`/admin/orders/${order.id}`} className="px-2.5 py-1.5 text-slate-900 text-sm font-semibold rounded-md cursor-pointer bg-white hover:bg-gray-100 border border-slate-300 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
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

