
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../App.css";

const API = import.meta.env.VITE_API || "http://localhost:5000/api/v1";
const STATUSES = [
  "Pending",
  "Processing",
  "Shipped",
  "Completed",
  "Cancelled",
];
const STATUS_TRANSITIONS = {
  Pending: ["Processing", "Cancelled"],
  Processing: ["Shipped"],
  Shipped: ["Completed"],
  Completed: [],
  Cancelled: [],
};

export default function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState("");

  const loadOrders = async () => {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API}/admin/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load orders.");
    }

    const loadedOrders = data.orders || [];
    setOrders(loadedOrders);
    setStatuses(
      Object.fromEntries(
        loadedOrders.map((order) => [order._id, order.orderStatus])
      )
    );
  };

  useEffect(() => {
    loadOrders()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = (orderId, status) => {
    setStatuses((current) => ({ ...current, [orderId]: status }));
    setMessage("");
    setError("");
  };

  const updateStatus = async (orderId) => {
    const token = localStorage.getItem("token");
    const status = statuses[orderId];

    setSavingId(orderId);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API}/admin/order/${orderId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update order status.");
      }

      setOrders((current) =>
        current.map((order) =>
          order._id === orderId ? data.order : order
        )
      );

      setStatuses((current) => ({
        ...current,
        [orderId]: data.order.orderStatus,
      }));

      setMessage(
        `Order ${orderId.slice(-8)} status saved as ${data.order.orderStatus}.`
      );
    } catch (err) {
      setError(err.message);
      await loadOrders().catch(() => {});
    } finally {
      setSavingId("");
    }
  };

  const formatPrice = (price) =>
    `₱${Number(price || 0).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <h2>J&J K-POP</h2>
        <p>Admin Panel</p>

        <nav>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/dashboard#admin-products">Products</Link>
          <Link to="/admin/orders" className="active">Orders</Link>
          <Link to="/admin/users">Users</Link>
        </nav>

        <Link to="/" className="admin-logout">Back to Store</Link>
      </aside>

      <main className="admin-main">
        <section className="orders-card">
          <header className="orders-header">
            <div>
              <h1>Orders Management</h1>
              <p>View and manage customer transactions.</p>
            </div>
            <span className="admin-badge">Administrator</span>
          </header>

          {loading && <p>Loading orders...</p>}
          {error && <p className="admin-error" role="alert">{error}</p>}
          {message && <p role="status">{message}</p>}

          {!loading && !error && (
            <div className="admin-table-wrapper">
              <table className="admin-table orders-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Grand Total</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan="7">No orders found.</td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order._id}>
                        <td title={order._id}>
                          {order._id.slice(-8).toUpperCase()}
                        </td>
                        <td>
                          {order.user?.name ||
                            order.user?.email ||
                            "Unknown"}
                        </td>
                        <td>
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString("en-PH")
                            : "—"}
                        </td>
                        <td>
                          {(order.orderItems || []).reduce(
                            (total, item) => total + item.quantity,
                            0
                          )}
                        </td>
                        <td>{formatPrice(order.totalPrice)}</td>
                        <td>
                          <select
                            aria-label={`Status for order ${order._id}`}
                            value={statuses[order._id] || order.orderStatus}
                            onChange={(event) =>
                              handleStatusChange(order._id, event.target.value)
                            }
                            disabled={
                              savingId === order._id ||
                              STATUS_TRANSITIONS[order.orderStatus]?.length === 0
                            }
                          >
                            {[
                              order.orderStatus,
                              ...(STATUS_TRANSITIONS[order.orderStatus] || []),
                            ]
                              .filter((status) => STATUSES.includes(status))
                              .map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                              ))}
                          </select>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => updateStatus(order._id)}
                            disabled={
                              savingId === order._id ||
                              statuses[order._id] === order.orderStatus
                            }
                          >
                            {savingId === order._id ? "Saving..." : "Save"}
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
