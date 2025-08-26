import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const AdminLayout = () => {
  const { adminUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const navLinkClass = ({ isActive }) =>
    isActive ? "block py-2.5 px-4 rounded bg-green-600 text-white" : "block py-2.5 px-4 rounded hover:bg-neutral-700 transition-colors";

  return (
    <div className="flex min-h-dvh bg-neutral-900 text-white font-sans">
      <aside className="w-64 bg-neutral-800 p-4 flex flex-col flex-shrink-0">
        <h1 className="text-2xl font-bold mb-8 text-center">Admin Panel</h1>
        <nav className="flex flex-col gap-2">
          <NavLink to="/admin/upload" className={navLinkClass}>
            Subir Canción
          </NavLink>
          <NavLink to="/admin/playlists" className={navLinkClass}>
            Gestionar Playlists
          </NavLink>
        </nav>
        <div className="mt-auto text-center">
          <p className="text-sm text-gray-400 mb-2">Logueado como: {adminUser?.nombre || adminUser?.username}</p>
          <button onClick={handleLogout} className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors">
            Cerrar Sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
