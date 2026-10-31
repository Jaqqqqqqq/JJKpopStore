import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import DataTable from "datatables.net-react";
import DT from "datatables.net-dt";
import "../App.css";
import CustomModal from "../Components/Common/CustomModal";
import { fetchAdminProducts, removeAdminProduct, removeAdminProducts } from "../actions/productActions";

import "datatables.net-dt/css";

DataTable.use(DT);

const API = import.meta.env.VITE_API || "http://localhost:5000/api/v1";

function AdminDashboard() {
  const dispatch = useDispatch();
  const productState = useSelector((state) => state.products);
  const products = productState.adminItems;
  const loading = productState.adminLoading;
  const error = productState.adminError;
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
    dispatch(fetchAdminProducts()).catch(() => {});
  }, [dispatch]);

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

          dispatch(removeAdminProduct(id));
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

          dispatch(removeAdminProducts(idsToDelete));
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
          <Link to="/admin/charts">Charts</Link>
          <Link to="/dashboard#admin-products">Products</Link>
          <Link to="/admin/orders">Orders</Link>
          <Link to="/admin/reviews">Reviews</Link>
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
  <DataTable
    className="admin-table display"
    data={products}
    columns={[
      { title: "Select", data: "_id", orderable: false, searchable: false },
      { title: "Product", data: "name" },
      { title: "Artist", data: "artist" },
      { title: "Category", data: "category" },
      { title: "Price", data: "price" },
      { title: "Stock", data: "stock" },
      { title: "Actions", data: "_id", orderable: false, searchable: false },
    ]}
    slots={{
      0: (_id, product) => (
        <input
          type="checkbox"
          aria-label={`Select ${product.name}`}
          checked={selectedIds.includes(product._id)}
          onChange={() => toggleProductSelection(product._id)}
        />
      ),

      1: (name, product) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {product.images?.[0]?.url || product.image ? (
            <img
              src={product.images?.[0]?.url || product.image}
              alt={name}
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
          <span>{name}</span>
        </div>
      ),

      4: (price) => `₱${Number(price).toLocaleString()}`,

      6: (_id, product) => (
        <>
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
        </>
      ),
    }}
    options={{
      pageLength: 10,
      lengthMenu: [5, 10, 25, 50],
      order: [[1, "asc"]],
      language: {
        emptyTable: "No products found.",
        search: "Search products:",
        lengthMenu: "Show _MENU_ products",
      },
    }}
  >
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
  </DataTable>
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
