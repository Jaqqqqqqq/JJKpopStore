import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "../App.css";

const API = import.meta.env.VITE_API || "http://localhost:5000/api/v1";

function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${API}/admin/products`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load products.");
        }

        return response.json();
      })
      .then((data) => {
        setProducts(data.products || []);
      })
      .catch((requestError) => {
        setError(
          requestError.message === "Failed to load products."
            ? "Could not load admin products. Your session may be expired or this account may not have the admin role."
            : "Cannot load products. Check if your backend is running."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const deleteProduct = async (id) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this product?"
  );

  if (!confirmDelete) return;

  try {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API}/admin/product/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to delete product.");
    }

    setProducts((currentProducts) =>
      currentProducts.filter((product) => product._id !== id)
    );

    window.alert("Product deleted successfully!");
  } catch (error) {
    window.alert(error.message || "Failed to delete product.");
  }
};

  const totalStock = products.reduce(
    (total, product) => total + Number(product.stock || 0),
    0
  );
  const categoryCount = new Set(products.map((product) => product.category)).size;

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <h2>J&J K-POP</h2>
        <p>Admin Panel</p>

        <nav>
          <a href="#admin">Dashboard</a>
          <a href="#admin-products">Products</a>
          <a href="#admin-orders">Orders</a>
          <Link to="/admin/users">Users</Link>
        </nav>

        <Link to="/" className="admin-logout">
          Back to Store
        </Link>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Manage your K-pop merchandise store.</p>
          </div>
          <span className="admin-badge">Administrator</span>
        </header>

        <section className="admin-stats">
          <div className="admin-stat-card">
            <p>Total Products</p>
            <h2>{products.length}</h2>
          </div>

          <div className="admin-stat-card">
            <p>Total Stock</p>
            <h2>{totalStock}</h2>
          </div>

          <div className="admin-stat-card">
            <p>Product Categories</p>
            <h2>{categoryCount}</h2>
          </div>
        </section>

        <section className="admin-products" id="admin-products">
          <div className="admin-section-header">
            <div>
              <h2>Product Management</h2>
              <p>View and manage your merchandise.</p>
            </div>

            <Link to="/admin/product/new" className="admin-add-button">
  + Add Product
</Link>
          </div>

          {loading && <p>Loading products...</p>}
          {error && <p className="admin-error">{error}</p>}

          {!loading && !error && (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Artist</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan="6">No products found.</td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product._id}>
                        <td>{product.name}</td>
                        <td>{product.artist}</td>
                        <td>{product.category}</td>
                        <td>₱{Number(product.price).toLocaleString()}</td>
                        <td>{product.stock}</td>
                        <td>
                          <button
  type="button"
  onClick={() =>
    navigate(`/admin/product/${product._id}/edit`)
  }
>
  Edit
</button>{" "}
                          <button
  type="button"
  onClick={() => deleteProduct(product._id)}
>
  Delete
</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;
