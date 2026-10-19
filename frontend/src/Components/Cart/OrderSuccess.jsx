import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import Header from "../Layout/Header";
import Footer from "../Layout/Footer";
import { API } from "../../api";

export default function OrderSuccess() {
  const { id } = useParams();
  const user = useSelector((state) => state.user.user);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${API}/order/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Unable to load your order.");
        }
        setOrder(data.order);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const formatPrice = (price) =>
    `₱${Number(price || 0).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <>
      <Header cartCount={0} user={user} />
      <main className="cart-page">
        {loading ? (
          <p>Loading your order...</p>
        ) : error ? (
          <section className="cart-empty">
            <h1>Order confirmation unavailable</h1>
            <p role="alert">{error}</p>
            <Link to="/" className="cart-button">Continue Shopping</Link>
          </section>
        ) : (
          <section className="cart-empty">
            <h1>Order placed successfully!</h1>
            <p>Your transaction has been recorded.</p>
            <p>Order ID: <strong>{order._id}</strong></p>
            <p>Status: <strong>{order.orderStatus}</strong></p>
            <h2>Items</h2>
            {(order.orderItems || []).map((item, index) => (
              <p key={`${item.product}-${index}`}>
                {item.name} × {item.quantity} — {formatPrice(item.price * item.quantity)}
              </p>
            ))}
            <p><strong>Total: {formatPrice(order.totalPrice)}</strong></p>
            <Link to="/" className="cart-button">Continue Shopping</Link>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
