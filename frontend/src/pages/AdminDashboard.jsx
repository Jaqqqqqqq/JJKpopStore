import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../App.css";
import CustomModal from "../Components/Common/CustomModal";

const API = import.meta.env.VITE_API || "http://localhost:5000/api/v1";

function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("info");
  const [popupConfirmText, setPopupConfirmText] = useState("OK");
  const [popupShowCancel, setPopupShowCancel] = useState(false);
  const [popupAction, setPopupAction] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${API}/admin/products`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load products.");
        return response.json();
      })
      .then((data) => setProducts(data.products || []))
      .catch((requestError) => {
        setError(
          requestError.message === "Failed to load products."
            ? "Could not load admin products. Your session may be expired or this account may not have the admin role."
            : "Cannot load products. Check if your backend is running."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const showPopup = ({
    title,
    message,
    type = "info",
    confirmText = "OK",
    showCancel = false,
    onConfirm = null,
  }) => {
    setPopupTitle(title);
    setPopupMessage(message);
    setPopupType(type);
    setPopupConfirmText(confirmText);
    setPopupShowCancel(showCancel);
    setPopupAction(() => onConfirm);
    setPopupOpen(true);
  };

  const closePopup = () => {
    setPopupOpen(false);
    setPopupAction(null);
  };

  const handlePopupConfirm = () => {
    const action = popupAction;
    closePopup();
    if (action) action();
  };

  const deleteProduct = (id) => {
    showPopup({
      title: "Delete Product?",
      message: "Are you sure you want to delete this product? This action cannot be undone.",
      type: "warning",
      confirmText: "Delete Product",
      showCancel: true,
      onConfirm: async () => {
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(`${API}/admin/product/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || "Failed to delete product.");
          }

          setProducts((current) =>
            current.filter((product) => product._id !== id)
          );
          setSelectedIds((current) =>
            current.filter((selectedId) => selectedId !== id)
          );

          showPopup({
            title: "Product Deleted!",
            message: "The product was successfully deleted.",
            type: "success",
          });
        } catch (error) {
          showPopup({
            title: "Deletion Failed",
            message: error.message || "Failed to delete product.",
            type: "error",
          });
        }
      },
    });
  };

  const toggleProductSelection = (id) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const toggleSelectAll = () => {
    const allSelected =
      products.length > 0 &&
      products.every((product) => selectedIds.includes(product._id));

    setSelectedIds(allSelected ? [] : products.map((product) => product._id));
  };

  const deleteSelectedProducts = () => {
    if (selectedIds.length === 0) {
      showPopup({
        title: "No Products Selected",
        message: "Please select at least one product to delete.",
        type: "warning",
      });
      return;
    }

    const idsToDelete = [...selectedIds];

    showPopup({
      title: "Delete Selected Products?",
      message: `Are you sure you want to delete ${idsToDelete.length} selected product(s)? This action cannot be undone.`,
      type: "warning",
      confirmText: "Delete Selected",
      showCancel: true,
      onConfirm: async () => {
        setBulkDeleting(true);

        try {
          const token = localStorage.getItem("token");
          const response = await fetch(`${API}/admin/products/bulk-delete`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ ids: idsToDelete }),
          });
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || "Bulk deletion failed.");
          }

          setProducts((current) =>
            current.filter((product) => !idsToDelete.includes(product._id))
          );
          setSelectedIds([]);

          showPopup({
            title: "Products Deleted!",
            message:
              data.message ||
              `${data.deletedCount ?? idsToDelete.length} product(s) deleted successfully.`,
            type: "success",
          });
        } catch (error) {
          showPopup({
            title: "Bulk Deletion Failed",
            message: error.message || "Failed to delete selected products.",
            type: "error",
          });
        } finally {
          setBulkDeleting(false);
        }
      },
    });
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
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/dashboard#admin-products">Products</Link>
          <Link to="/admin/orders">Orders</Link>
          <Link to="/admin/users">Users</Link>
        </nav>
        <Link to="/" className="admin-logout">Back to Store</Link>
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

        <section className="admin-products-section" id="admin-products">
          <div className="admin-section-header">
            <div>
              <h2>Product Management</h2>
              <p>View and manage your merchandise.</p>
            </div>
            <div>
              <button
                type="button"
                onClick={deleteSelectedProducts}
                disabled={selectedIds.length === 0 || bulkDeleting}
              >
                {bulkDeleting ? "Deleting..." : `Delete Selected (${selectedIds.length})`}
              </button>{" "}
              <Link to="/admin/product/new" className="admin-add-button">
                + Add Product
              </Link>
            </div>
          </div>

          {loading && <p>Loading products...</p>}
          {error && <p className="admin-error">{error}</p>}

          {!loading && !error && (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        aria-label="Select all products"
                        checked={
                          products.length > 0 &&
                          products.every((product) =>
                            selectedIds.includes(product._id)
                          )
                        }
                        onChange={toggleSelectAll}
                      />
                    </th>
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
                      <td colSpan="7">No products found.</td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product._id}>
                        <td>
                          <input
                            type="checkbox"
                            aria-label={`Select ${product.name}`}
                            checked={selectedIds.includes(product._id)}
                            onChange={() => toggleProductSelection(product._id)}
                          />
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                          >
                            {(product.images?.[0]?.url || product.image) ? (
                              <img
                                src={product.images?.[0]?.url || product.image}
                                alt={product.name}
                                loading="lazy"
                                style={{
                                  width: "55px",
                                  height: "55px",
                                  objectFit: "contain",
                                  borderRadius: "6px",
                                  border: "1px solid #ead5df",
                                  background: "#fff",
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: "55px",
                                  height: "55px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  border: "1px dashed #d8b8c5",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  color: "#888",
                                }}
                              >
                                No image
                              </div>
                            )}
                            <span>{product.name}</span>
                          </div>
                        </td>
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

      <CustomModal
        isOpen={popupOpen}
        title={popupTitle}
        message={popupMessage}
        type={popupType}
        confirmText={popupConfirmText}
        showCancel={popupShowCancel}
        onConfirm={handlePopupConfirm}
        onCancel={closePopup}
      />
    </div>
  );
}

export default AdminDashboard;
