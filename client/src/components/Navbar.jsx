import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [scrolled, setScrolled] = useState(false);
    const overlayEligible = location.pathname === '/';

    useEffect(() => {
        if (!overlayEligible) {
            setScrolled(true);
            return;
        }
        function handleScroll() {
            setScrolled(window.scrollY > 60);
        }
        handleScroll();
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [overlayEligible]);

    function handleLogout() {
        logout();
        navigate('/login');
    }

    return (
        <nav className={`navbar ${scrolled ? 'navbar-solid' : 'navbar-transparent'}`}>
            <Link to="/" className="brand">LIBRARY</Link>
            <div className="nav-links">
                <Link to="/">Catalog</Link>
                {user && <Link to="/my-borrows">My Borrows</Link>}
                {user && ['admin', 'librarian'].includes(user.role) && (
                    <>
                        <Link to="/admin/books">Manage Books</Link>
                        <Link to="/admin/borrows">Loans</Link>
                    </>
                )}
                {user && user.role === 'admin' && <Link to="/admin/users">Users</Link>}
                {!user && <Link to="/login">Login</Link>}
                {!user && <Link to="/register">Register</Link>}
                {user && (
                    <button className="link-button" onClick={handleLogout}>
                        Logout ({user.name})
                    </button>
                )}
            </div>
        </nav>
    );
}
