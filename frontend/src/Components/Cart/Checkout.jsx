
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../Layout/Header";
import Footer from "../Layout/Footer";
import { clearCart } from "../../actions/cartActions";
import { API } from "../../api";

const initialShippingInfo = {
  address: "",
  city: "",
  phoneNo: "",
  postalCode: "",
  country: "Philippines",
};

export default function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.user);
  const items = useSelector((state) => state.cart.items);

  const [shippingInfo, setShippingInfo] = useState(initialShippingInfo);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const formatPrice = (price) =>
    `₱${Number(price).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const handleChange = (event) => {
    setShippingInfo({
      ...shippingInfo,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!items.length) {
      setError("Your cart is empty.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please log in again before checking out.");
      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.post(
        `${API}/order/new`,
        {
          shippingInfo,
          items: items.map((item) => ({
            productId: item.product,
            quantity: item.quantity,
          })),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!data.success || !data.order?._id) {
        throw new Error("The server did not confirm the order.");
      }

      dispatch(clearCart());
      navigate("/", {
        replace: true,
        state: {
          orderSuccess: true,
          orderId: data.order._id,
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to place your order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header cartCount={itemCount} user={user} />

      <main className="cart-page">
        <h1>Checkout</h1>
        <p>Enter your shipping details to place your order.</p>

        {items.length === 0 ? (
          <section className="cart-empty">
            <h2>Your cart is empty</h2>
            <Link to="/" className="cart-button">
              Continue Shopping
            </Link>
          </section>
        ) : (
          <div className="cart-layout">
            <form className="cart-items" onSubmit={handleSubmit}>
              <h2>Shipping Information</h2>

              {[
                ["address", "Street address"],
                ["city", "City"],
                ["phoneNo", "Phone number"],
                ["postalCode", "Postal code"],
                ["country", "Country"],
              ].map(([name, label]) => (
                <label
                  key={name}
                  style={{ display: "block", marginBottom: "16px" }}
                >
                  {label}
                  <input
                    name={name}
                    value={shippingInfo[name]}
                    onChange={handleChange}
                    required
                    maxLength={name === "address" ? 200 : 100}
                    autoComplete={
                      name === "address"
                        ? "street-address"
                        : name === "city"
                          ? "address-level2"
                          : name === "postalCode"
                            ? "postal-code"
                            : name === "country"
                              ? "country-name"
                              : "tel"
                    }
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "10px",
                      marginTop: "6px",
                      boxSizing: "border-box",
                    }}
                  />
                </label>
              ))}

              {error && (
                <p role="alert" style={{ color: "red" }}>
                  {error}
                </p>
              )}

              <button
                className="cart-button"
                type="submit"
                disabled={loading || items.length === 0}
              >
                {loading ? "Placing Order..." : "Place Order"}
              </button>

              <p>
                <Link to="/cart">Return to Cart</Link>
              </p>
            </form>

            <aside className="cart-summary">
              <h2>Order Summary</h2>

              {items.map((item) => (
                <div
                  className="cart-summary-row"
                  key={item.product}
                >
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}

              <div className="cart-summary-row">
                <span>Items ({itemCount})</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <div className="cart-summary-row cart-total">
                <strong>Total estimate</strong>
                <strong>{formatPrice(subtotal)}</strong>
              </div>

              <p className="cart-note">
                The backend verifies product prices and availability.
                Tax and shipping are currently set to ₱0.
              </p>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
