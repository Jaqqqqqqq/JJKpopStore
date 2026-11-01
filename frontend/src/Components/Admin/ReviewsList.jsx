import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CustomModal from "../Common/CustomModal";
import "../../App.css";
import { showNotification } from "../../utils/notifications";
import AdminSidebarActions from "./AdminSidebarActions";

const API = import.meta.env.VITE_API || "http://localhost:5000/api/v1";

export default function ReviewsList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API}/admin/products`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load reviews.");
        setProducts(data.products || []);
      })
      .catch((err) => {
        setError(err.message);
        showNotification({ title: "Unable to load reviews", text: err.message, icon: "error" });
      })
      .finally(() => setLoading(false));
  }, []);

  const reviews = products.flatMap((product) =>
    (product.reviews || []).map((review) => ({ ...review, product }))
  );

  const deleteReview = async () => {
    if (!selectedReview) return;
    try {
      const response = await fetch(
        `${API}/admin/product/${selectedReview.product._id}/reviews/${selectedReview._id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to delete review.");
      setProducts((current) => current.map((product) =>
        product._id === data.product._id ? data.product : product
      ));
      showNotification({ title: "Review deleted", text: "The customer review was deleted successfully." });
    } catch (err) {
      setError(err.message);
      showNotification({ title: "Unable to delete review", text: err.message, icon: "error" });
    } finally {
      setPopupOpen(false);
      setSelectedReview(null);
    }
  };

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <h2>J&J K-POP</h2><p>Admin Panel</p>
        <nav>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/admin/charts">Charts</Link>
          <Link to="/dashboard#admin-products">Products</Link>
          <Link to="/admin/categories">Categories</Link>
          <Link to="/admin/orders">Orders</Link>
          <Link to="/admin/reviews" className="active">Reviews</Link>
          <Link to="/admin/users">Users</Link>
        </nav>
        <AdminSidebarActions />
      </aside>
      <main className="admin-main">
        <section className="orders-card">
          <header className="orders-header">
            <div><h1>Product Reviews</h1><p>Review and manage customer feedback.</p></div>
            <span className="admin-badge">Administrator</span>
          </header>
          {loading && <p>Loading reviews...</p>}
          {error && <p className="admin-error" role="alert">{error}</p>}
          {!loading && !error && (
            <div className="admin-table-wrapper">
              <table className="admin-table orders-table">
                <thead><tr><th>Product</th><th>Customer</th><th>Rating</th><th>Review</th><th>Action</th></tr></thead>
                <tbody>
                  {reviews.length ? reviews.map((review) => (
                    <tr key={review._id}>
                      <td>{review.product.name}</td><td>{review.name}</td>
                      <td>{review.rating} / 5</td><td>{review.comment}</td>
                      <td><button type="button" onClick={() => { setSelectedReview(review); setPopupOpen(true); }}>Delete</button></td>
                    </tr>
                  )) : <tr><td colSpan="5">No product reviews yet.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      <CustomModal
        isOpen={popupOpen}
        title="Delete Review?"
        message="Are you sure you want to delete this customer review?"
        type="warning"
        confirmText="Delete Review"
        showCancel
        onConfirm={deleteReview}
        onCancel={() => { setPopupOpen(false); setSelectedReview(null); }}
      />
    </div>
  );
}
