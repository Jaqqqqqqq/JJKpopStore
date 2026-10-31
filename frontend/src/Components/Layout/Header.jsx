import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../actions/userActions";

export default function Header({ cartCount = 0, user }) {
  const [search, setSearch] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  function goToProducts(event) {
    event.preventDefault();
    if (location.pathname === "/") {
      document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    navigate("/#products");
  }

  function handleLogout() {
    dispatch(logout());
    navigate("/login", { replace: true });
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
  <Link to="/#products" onClick={goToProducts}>Products</Link>
  {user && user.role !== "admin" && (
    <NavLink to="/orders">Orders</NavLink>
  )}
  {user && <NavLink to="/profile">Profile</NavLink>}
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
          <Link to="/login">Log in</Link>
          <Link to="/register">Sign up</Link>
        </div>
      )}
    </header>
  );
}
