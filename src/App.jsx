import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./Home";
import AdminLogin from "./components/admin/AdminLogin";
import ProtectedRoute from "./components/admin/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { PlayerProvider } from "./context/PlayerContext";
import AdminLayout from "./components/admin/AdminLayout";
import UploadSongForm from "./components/admin/UploadSongForm";
import PlaylistManager from "./components/admin/PlaylistManager";
import AdminSongs from "./components/admin/AdminSongs";

function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="upload" replace />} />
            <Route path="upload" element={<UploadSongForm />} />
            <Route path="playlists" element={<PlaylistManager />} />
            <Route path="songs" element={<AdminSongs />} />
          </Route>
        </Routes>
      </PlayerProvider>
    </AuthProvider>
  );
}

export default App;
