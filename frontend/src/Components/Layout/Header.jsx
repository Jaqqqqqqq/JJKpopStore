import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../actions/userActions";

export default function Header({ cartCount = 0, user }) {
  const [search, setSearch] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  function handleLogout() {
    dispatch(logout());
    navigate("/register", { replace: true });
  }

  function handleSearch(event) {
    if (event.key === "Enter") {
      navigate(`/?search=${encodeURIComponent(search)}#products`);
    }
  }

  return (
    <header className="navbar">
      <Link to="/" className="logo">
        J&J <span>K-POP</span>
        <b>♡</b>
      </Link>

      <nav>
        <NavLink to="/" end>
          Home
        </NavLink>
        <a href="/#products">Products</a>
        <a href="/#about">About</a>
      </nav>

      <label className="search">
        <span>⌕</span>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={handleSearch}
          placeholder="Search merchandise..."
        />
      </label>

      <Link className="header-icon cart-icon" to="/cart" aria-label="Shopping cart">
        🛒<i>{cartCount}</i>
      </Link>

      {user ? (
        <button className="account-action" onClick={handleLogout}>
          Logout
        </button>
      ) : (
        <div className="account-links">
          <Link to="/login">Login</Link>
          <span>/</span>
          <Link to="/register">Register</Link>
        </div>
      )}
    </header>
  );
}
