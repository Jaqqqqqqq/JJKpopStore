
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import Header from "../Layout/Header";
import Footer from "../Layout/Footer";
import { API } from "../../api";
import "../../App.css";

const ORDER_TABS = [
  { label: "Pending", statuses: ["Pending"] },
  { label: "To Ship", statuses: ["Processing"] },
  { label: "To Receive", statuses: ["Shipped"] },
  { label: "To Rate", statuses: ["Completed"] },
];

export default function CustomerOrders() {
  const user = useSelector((state) => state.user.user);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("Pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      try {
        const token = localStorage.getItem("token");

        const response = await fetch(`${API}/myorders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load your orders.");
        }

        if (!cancelled) {
          setOrders(data.orders || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load your orders.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  const formatPrice = (price) =>
    `₱${Number(price || 0).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const selectedTab = ORDER_TABS.find(
    (tab) => tab.label === activeTab
  );

  const filteredOrders = orders.filter((order) =>
    selectedTab.statuses.includes(order.orderStatus)
  );

  return (
    <>
      <Header
        cartCount={0}
        user={user}
      />

      <main className="cart-page customer-orders-page">
        <h1>My Orders</h1>
        <p>Track your J&J K-POP merchandise purchases.</p>

        <div className="customer-order-tabs" role="tablist">
          {ORDER_TABS.map((tab) => {
            const count = orders.filter((order) =>
              tab.statuses.includes(order.orderStatus)
            ).length;

            return (
              <button
                key={tab.label}
                type="button"
                role="tab"
                id={`customer-order-tab-${tab.label.toLowerCase().replaceAll(" ", "-")}`}
                aria-controls="customer-order-results"
                aria-selected={activeTab === tab.label}
                className={
                  activeTab === tab.label
                    ? "customer-order-tab active"
                    : "customer-order-tab"
                }
                onClick={() => setActiveTab(tab.label)}
              >
                {tab.label} ({count})
              </button>
            );
          })}
        </div>

        {loading && <p>Loading your orders...</p>}

        {!loading && error && (
          <section className="cart-empty">
            <h2>Couldn't load your orders</h2>
            <p role="alert">{error}</p>
          </section>
        )}

        {!loading && !error && filteredOrders.length === 0 && (
          <section className="cart-empty">
            <h2>No orders here yet</h2>
            <p>
              Orders will appear here when their status matches
              the selected tab.
            </p>
            <Link to="/" className="cart-button">
              Continue Shopping
            </Link>
          </section>
        )}

        {!loading && !error && filteredOrders.length > 0 && (
          <div className="customer-order-list" id="customer-order-results" role="tabpanel" aria-labelledby={`customer-order-tab-${activeTab.toLowerCase().replaceAll(" ", "-")}`}>
            {filteredOrders.map((order) => (
              <article className="customer-order-card" key={order._id}>
                <div className="customer-order-header">
                  <div>
                    <strong>Order #{order._id.slice(-8).toUpperCase()}</strong>
                    <p>
                      Ordered on{" "}
                      {new Date(order.createdAt).toLocaleDateString("en-PH")}
                    </p>
                  </div>

                  <span className="order-status">
                    {order.orderStatus}
                  </span>
                </div>

                <div className="customer-order-items">
                  {(order.orderItems || []).map((item, index) => (
                    <div
                      className="customer-order-item"
                      key={`${item.product || item.name}-${index}`}
                    >
                      {item.image && (
                        <img className="customer-order-item-image" src={item.image} alt={item.name} />
                      )}

                      <div>
                        {item.product && /^[a-f\d]{24}$/i.test(String(item.product)) ? (
                          <Link className="customer-order-product-link" to={`/product/${item.product}`}>
                            {item.name}
                          </Link>
                        ) : (
                          <strong>{item.name}</strong>
                        )}
                        <p>Quantity: {item.quantity}</p>
                        {order.orderStatus === "Completed" &&
                          item.product &&
                          /^[a-f\d]{24}$/i.test(String(item.product)) && (
                            <Link
                              to={`/product/${item.product}#reviews-heading`}
                              className="customer-order-review"
                            >
                              Rate / Update Review
                            </Link>
                          )}
                      </div>

                      <strong>
                        {formatPrice(item.price * item.quantity)}
                      </strong>
                    </div>
                  ))}
                </div>

                <div className="customer-order-footer">
                  <span>
                    Total: <strong>{formatPrice(order.totalPrice)}</strong>
                  </span>

                  <div className="customer-order-actions">
                    <Link
                      to={`/order/success/${order._id}`}
                      className="customer-order-details"
                    >
                      View Order
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
