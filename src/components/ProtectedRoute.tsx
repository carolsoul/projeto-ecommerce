import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <p className="text-center mt-20">Carregando...</p>;

  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />;

  return <Outlet />;
}