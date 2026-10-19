
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Header from "./Layout/Header";
import Footer from "./Layout/Footer";
import { API, sampleProducts } from "./catalogData";
import { addToCart } from "../actions/cartActions";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.user?.user);
  const cartItems = useSelector((state) => state.cart?.items || []);

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const cartCount = cartItems.reduce(
    (total, item) => total + (Number(item.quantity) || 0),
    0
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchProduct() {
      setLoading(true);
      setError("");
      setProduct(null);
      setMessage("");
      setQuantity(1);

      if (!/^[a-f\d]{24}$/i.test(id || "")) {
        setError("Invalid product ID. Please select a product from the store.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API}/product/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load this product.");
        }

        const fetchedProduct = data.product || data;

        if (!fetchedProduct?._id) {
          throw new Error("Product not found.");
        }

        if (!cancelled) {
          setProduct(fetchedProduct);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load this product.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProduct();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const images = product
    ? [
        ...new Set(
          [
            product.image,
            ...(product.images || []).map((image) => image.url),
          ].filter(Boolean)
        ),
      ]
    : [];

  useEffect(() => {
    setSelectedImage(images[0] || "");
  }, [product]);

  const stock = Number(product?.stock ?? 0);
  const unavailable =
    !product || product.isAvailable === false || stock < 1;

  function handleAddToCart() {
    setMessage("");

    if (unavailable) {
      setMessage("Sorry, this product is currently unavailable.");
      return;
    }

    if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1 ||
        Number(quantity) > stock) {
      setMessage(`Please select a quantity between 1 and ${stock}.`);
      return;
    }

    dispatch(addToCart(product, Number(quantity)));
    setMessage(`${product.name} added to your cart!`);
  }

  return (
    <>
      <Header cartCount={cartCount} user={user} />

      <main className="product-details-page">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        {loading ? (
          <p>Loading product...</p>
        ) : error ? (
          <section className="product-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => navigate("/")}>
              Return to Store
            </button>
          </section>
        ) : product ? (
          <section className="product-details">
            <div className="product-details-images">
              <img
                className="product-details-main-image"
                src={selectedImage || sampleProducts[0].image}
                alt={product.name}
              />

              {images.length > 1 && (
                <div className="product-image-thumbnails">
                  {images.map((image, index) => (
                    <button
                      type="button"
                      key={image}
                      className={
                        selectedImage === image
                          ? "product-thumbnail active"
                          : "product-thumbnail"
                      }
                      onClick={() => setSelectedImage(image)}
                      aria-label={`View product image ${index + 1}`}
                    >
                      <img src={image} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="product-details-info">
              <p className="product-details-category">{product.category}</p>
              <h1>{product.name}</h1>
              <p className="product-details-artist">
                Artist / Group: {product.artist}
              </p>

              <p className="product-details-price">
                ₱
                {Number(product.price).toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>

              <p>
                {stock > 0 ? `${stock} item(s) in stock` : "Out of stock"}
              </p>

              <p className="product-details-description">
                {product.description || "No description available."}
              </p>

              {!unavailable && (
                <div className="product-quantity">
                  <label htmlFor="product-quantity">Quantity:</label>

                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((q) => Math.max(1, Number(q) - 1))
                    }
                    disabled={Number(quantity) <= 1}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>

                  <input
                    id="product-quantity"
                    type="number"
                    min="1"
                    max={stock}
                    value={quantity}
                    onChange={(event) => {
                      const value = event.target.value;

                      if (value === "") {
                        setQuantity("");
                      } else if (/^\d+$/.test(value)) {
                        setQuantity(Math.min(stock, Math.max(1, Number(value))));
                      }
                    }}
                    onBlur={() => {
                      setQuantity((q) =>
                        Number.isInteger(Number(q)) && Number(q) >= 1
                          ? Math.min(stock, Number(q))
                          : 1
                      );
                    }}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((q) => Math.min(stock, Number(q) + 1))
                    }
                    disabled={Number(quantity) >= stock}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              )}

              <button
                type="button"
                className="add-to-cart-button"
                onClick={handleAddToCart}
                disabled={unavailable}
              >
                {unavailable ? "Unavailable" : "Add to Cart"}
              </button>

              {message && (
                <p role="status" className="product-cart-message">
                  {message}
                </p>
              )}
            </div>
          </section>
        ) : null}
      </main>

      <Footer />
    </>
  );
}
