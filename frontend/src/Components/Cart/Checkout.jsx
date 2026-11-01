
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../Layout/Header";
import Footer from "../Layout/Footer";
import { removeFromCart } from "../../actions/cartActions";
import { API } from "../../api";
import { showNotification } from "../../utils/notifications";

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
  const location = useLocation();
    const user = useSelector((state) => state.user.user);
  const items = useSelector((state) => state.cart.items);
  const [checkoutProductIds] = useState(() => {
    const selectedIds = location.state?.productIds;
    if (Array.isArray(selectedIds) && selectedIds.length) {
      sessionStorage.setItem("checkoutProductIds", JSON.stringify(selectedIds));
      return selectedIds.map(String);
    }

    try {
      const savedIds = JSON.parse(sessionStorage.getItem("checkoutProductIds"));
      return Array.isArray(savedIds) && savedIds.length ? savedIds.map(String) : null;
    } catch {
      return null;
    }
  });
  const checkoutItems = checkoutProductIds
    ? items.filter((item) => checkoutProductIds.includes(String(item.product)))
    : items;

  // Stores the customer's shipping details.
  const [shippingInfo, setShippingInfo] = useState(initialShippingInfo);

  // Stores the selected payment method.
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [cardInfo, setCardInfo] = useState({ cardNumber: "", expiry: "", cvc: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const itemCount = checkoutItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = checkoutItems.reduce(
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

    if (!checkoutItems.length) {
      setError("Your cart is empty.");
      showNotification({ title: "Cart is empty", text: "Add a product before checking out.", icon: "warning" });
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Please log in again before checking out.");
      showNotification({ title: "Please log in", text: "Log in again before checking out.", icon: "warning" });
      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.post(
        `${API}/order/new`,
                {
          shippingInfo,
          paymentMethod,
          paymentAmount: paymentMethod === "E-payment" ? Number(paymentAmount) : undefined,
          items: checkoutItems.map((item) => ({
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

      checkoutItems.forEach((item) => dispatch(removeFromCart(item.product)));
      sessionStorage.removeItem("checkoutProductIds");
      navigate(`/order/success/${data.order._id}`, { replace: true });
    } catch (err) {
      const message = err.response?.data?.message ||
          err.message ||
          "Unable to place your order. Please try again.";
      setError(message);
      showNotification({ title: "Unable to place order", text: message, icon: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header cartCount={cartItemCount} user={user} />

      <main className="cart-page">
        <h1>Checkout</h1>
        <p>Enter your shipping details to place your order.</p>

        {checkoutItems.length === 0 ? (
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

              
              <h2>Payment Method</h2>

              <div className="payment-method-options">
                <label>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Card"
                    checked={paymentMethod === "Card"}
                    onChange={(event) =>
                      setPaymentMethod(event.target.value)
                    }
                  />
                  Card Payment
                </label>

                <label>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="E-payment"
                    checked={paymentMethod === "E-payment"}
                    onChange={(event) =>
                      setPaymentMethod(event.target.value)
                    }
                  />
                  E-payment (e-wallet)
                </label>

                <label>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={paymentMethod === "COD"}
                    onChange={(event) =>
                      setPaymentMethod(event.target.value)
                    }
                  />
                  Cash on Delivery (COD)
                </label>
              </div>

              {paymentMethod === "Card" && (
                <fieldset className="checkout-payment-fields">
                  <legend>Card Info</legend>
                  <label htmlFor="card-number">Card Number</label>
                  <input
                    id="card-number"
                    type="text"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    maxLength={19}
                    value={cardInfo.cardNumber}
                    onChange={(event) => setCardInfo({ ...cardInfo, cardNumber: event.target.value })}
                    placeholder="Card number"
                    required
                  />
                  <label htmlFor="card-expiry">Card Expiry</label>
                  <input
                    id="card-expiry"
                    type="text"
                    autoComplete="cc-exp"
                    maxLength={5}
                    value={cardInfo.expiry}
                    onChange={(event) => setCardInfo({ ...cardInfo, expiry: event.target.value })}
                    placeholder="MM/YY"
                    required
                  />
                  <label htmlFor="card-cvc">Card CVC</label>
                  <input
                    id="card-cvc"
                    type="password"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    maxLength={4}
                    value={cardInfo.cvc}
                    onChange={(event) => setCardInfo({ ...cardInfo, cvc: event.target.value })}
                    placeholder="CVC"
                    required
                  />
                  <p className="cart-note">Demo checkout only. Card details are not saved or charged.</p>
                </fieldset>
              )}

              {paymentMethod === "E-payment" && (
                <div className="checkout-payment-fields">
                  <label htmlFor="payment-amount">E-wallet amount (₱)</label>
                  <input
                    id="payment-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(event) => setPaymentAmount(event.target.value)}
                    placeholder="Enter the amount paid"
                    required
                  />
                  <p className="cart-note">Enter the exact total shown in your order summary: {formatPrice(subtotal)}.</p>
                </div>
              )}

              {paymentMethod === "COD" && (
                <p className="cart-note">Pay the order total when it is delivered.</p>
              )}


              {error && (
                <p role="alert" style={{ color: "red" }}>
                  {error}
                </p>
              )}

              <button
                className="cart-button"
                type="submit"
                disabled={loading || checkoutItems.length === 0}
              >
                {loading ? "Placing Order..." : "Place Order"}
              </button>

              <p>
                <Link to="/cart">Return to Cart</Link>
              </p>
            </form>

            <aside className="cart-summary">
              <h2>Order Summary</h2>

              {checkoutItems.map((item) => (
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
