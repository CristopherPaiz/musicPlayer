import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import UploadSongForm from "./UploadSongForm";
import PlaylistManager from "./PlaylistManager";

const AdminPanel = () => {
  const { adminUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="bg-neutral-900 text-white min-h-dvh p-4 sm:p-8">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <div className="flex items-center gap-4">
          <span>Bienvenido, {adminUser?.nombre || adminUser?.username}!</span>
          <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
            Cerrar Sesión
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto space-y-8">
        <UploadSongForm />
        <PlaylistManager />
      </main>
    </div>
  );
};

export default AdminPanel;
