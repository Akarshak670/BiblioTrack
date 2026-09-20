import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Catalog from './pages/Catalog';
import Login from './pages/Login';
import Register from './pages/Register';
import MyBorrows from './pages/MyBorrows';
import AdminBooks from './pages/AdminBooks';
import AdminBorrows from './pages/AdminBorrows';
import AdminUsers from './pages/AdminUsers';

export default function App() {
    return (
        <>
            <Navbar />
            <main>
                <Routes>
                    <Route path="/" element={<Catalog />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/my-borrows"
                        element={<ProtectedRoute><MyBorrows /></ProtectedRoute>}
                    />
                    <Route
                        path="/admin/books"
                        element={<ProtectedRoute roles={['admin', 'librarian']}><AdminBooks /></ProtectedRoute>}
                    />
                    <Route
                        path="/admin/borrows"
                        element={<ProtectedRoute roles={['admin', 'librarian']}><AdminBorrows /></ProtectedRoute>}
                    />
                    <Route
                        path="/admin/users"
                        element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>}
                    />
                </Routes>
            </main>
        </>
    );
}
