
import { useDispatch, useSelector } from "react-redux";
import Header from "../Layout/Header";
import Footer from "../Layout/Footer";
import {
  removeFromCart,
  updateCartQuantity,
} from "../../actions/cartActions";
import { Link, useNavigate } from "react-router-dom";

export default function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.user);
  const items = useSelector((state) => state.cart.items);

  const itemCount = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const formatPrice = (price) =>
    `₱${Number(price).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <>
      <Header cartCount={itemCount} user={user} />

      <main className="cart-page">
        <h1>Your Shopping Cart</h1>
        <p>{itemCount} item(s) in your cart</p>

        {items.length === 0 ? (
          <section className="cart-empty">
            <h2>Your cart is empty</h2>
            <p>Discover your favorite K-pop merchandise.</p>
            <Link to="/" className="cart-button">
              Continue Shopping
            </Link>
          </section>
        ) : (
          <div className="cart-layout">
            <section className="cart-items">
              {items.map((item) => (
                <article className="cart-item" key={item.product}>
                  <img
                    className="cart-item-image"
                    src={item.image || ""}
                    alt={item.name}
                  />

                  <div className="cart-item-details">
                    <h2>{item.name}</h2>
                    <p>{formatPrice(item.price)} each</p>

                    <div className="cart-quantity">
                      <button
                        type="button"
                        aria-label={`Decrease ${item.name} quantity`}
                        disabled={item.quantity <= 1}
                        onClick={() =>
                          dispatch(
                            updateCartQuantity(
                              item.product,
                              item.quantity - 1
                            )
                          )
                        }
                      >
                        −
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        type="button"
                        aria-label={`Increase ${item.name} quantity`}
                        onClick={() =>
                          dispatch(
                            updateCartQuantity(
                              item.product,
                              item.quantity + 1
                            )
                          )
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="cart-item-total">
                    <strong>
                      {formatPrice(item.price * item.quantity)}
                    </strong>

                    <button
                      type="button"
                      className="cart-remove"
                      onClick={() =>
                        dispatch(removeFromCart(item.product))
                      }
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </section>

            <aside className="cart-summary">
              <h2>Order Summary</h2>

              <div className="cart-summary-row">
                <span>Items ({itemCount})</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <div className="cart-summary-row cart-total">
                <strong>Subtotal</strong>
                <strong>{formatPrice(subtotal)}</strong>
              </div>

              <p className="cart-note">
                Shipping and final charges will be confirmed at checkout.
              </p>

              <button
                type="button"
                className="cart-button"
                disabled={items.length === 0}
                onClick={() =>
                  navigate("/checkout")
                }
              >
                Proceed to Checkout
              </button>

              <Link to="/" className="cart-continue">
                Continue Shopping
              </Link>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}
