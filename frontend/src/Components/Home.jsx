
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Header from "./Layout/Header";
import Footer from "./Layout/Footer";
import { API, categories, sampleProducts } from "./catalogData";
import { addToCart } from "../actions/cartActions";

export default function Home({ user }) {
  const [products, setProducts] = useState(sampleProducts);
  const [category, setCategory] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [cartMessage, setCartMessage] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const cartItems = useSelector((state) => state.cart?.items || []);
  const cartCount = cartItems.reduce(
    (total, item) => total + (Number(item.quantity) || 0),
    0
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      try {
        const response = await fetch(`${API}/products`);
        if (!response.ok) return;

        const data = await response.json();

        if (!cancelled && data?.products?.length) {
          setProducts(data.products);
        }
      } catch {
        // Keep sample products available if the API is unreachable.
      }
    }

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, []);

  const searchQuery = (searchParams.get("search") || "").trim().toLowerCase();

  const visibleProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesCategory =
          category === "All" || product.category === category;
        const price = Number(product.price);
        const matchesMinPrice =
          minPrice === "" || price >= Number(minPrice);
        const matchesMaxPrice =
          maxPrice === "" || price <= Number(maxPrice);
        const matchesSearch =
          !searchQuery ||
          [product.name, product.artist, product.category]
            .some((value) => value?.toLowerCase().includes(searchQuery));

        return (
          matchesCategory &&
          matchesMinPrice &&
          matchesMaxPrice &&
          matchesSearch
        );
      }),
    [products, category, minPrice, maxPrice, searchQuery]
  );

  function openProduct(product) {
    // Sample IDs such as "a" are not MongoDB product IDs.
    if (!/^[a-f\d]{24}$/i.test(product?._id || "")) {
      setCartMessage("This is a sample product. Select a saved store product to view its details.");
      return;
    }

    navigate(`/product/${product._id}`);
  }

  function handleAddToCart(product) {
    if (!product?._id || !/^[a-f\d]{24}$/i.test(product._id)) {
      setCartMessage("This sample product is for display only. Please add a saved store product to your cart.");
      return;
    }

    if (product.isAvailable === false || Number(product.stock) < 1) {
      setCartMessage(`${product.name} is currently unavailable.`);
      return;
    }

    dispatch(addToCart(product));
    setCartMessage(`${product.name} added to your cart!`);
  }

  return (
    <>
      <div id="top" />

      <Header cartCount={cartCount} user={user} />

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              YOUR K-POP COLLECTION STARTS HERE <span />
            </div>

            <h1>
              Bring Your Favorite
              <br />
              <em>Idols</em> Closer
            </h1>

            <p>
              Discover albums, photocards, lightsticks, posters, and more from
              your favorite K-pop artists. Official merch, best picks, and all
              in one place.
            </p>

            <a className="shop-button" href="#products">
              ♧ &nbsp; Shop Now &nbsp; →
            </a>

            <div className="perks">
              <div>
                🚚 <span>Nationwide<br />Shipping</span>
              </div>
              <div>
                ♢ <span>100% Original<br />Merchandise</span>
              </div>
              <div>
                ▤ <span>Secure<br />Payment</span>
              </div>
            </div>
          </div>

          <div className="hero-art">
            <div className="collage">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=850&q=90"
                alt="K-pop inspired artist portrait"
              />
              <div className="photo-note">K-POP ♡</div>
            </div>

            <div className="photo-small">
              <img
                src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=420&q=85"
                alt="Artist portrait"
              />
            </div>

            <div className="heart-lamp">♡</div>
            <span className="doodle doodle-one">☆</span>
            <span className="doodle doodle-two">♡</span>
          </div>

          <div className="slide-arrows">
            <button type="button" aria-label="Previous slide">‹</button>
            <button type="button" aria-label="Next slide">›</button>
          </div>
        </section>

        <section id="products" className="products-section">
          <p className="eyebrow centered">
            <span /> FIND YOUR FAVORITES <span />
          </p>

          <h2>
            Featured <em>Merchandise</em>
          </h2>

          <div className="categories">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={category === item ? "selected" : ""}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="price-filters">
            <label htmlFor="minPrice">Min Price:</label>
            <input
              type="number"
              id="minPrice"
              min="0"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              placeholder="Enter minimum price"
            />

            <label htmlFor="maxPrice">Max Price:</label>
            <input
              type="number"
              id="maxPrice"
              min="0"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              placeholder="Enter maximum price"
            />

            <button
              type="button"
              onClick={() => {
                setMinPrice("");
                setMaxPrice("");
              }}
            >
              Clear Price
            </button>
          </div>

          <div className="product-grid">
            {visibleProducts.map((product, index) => (
              <article
                className="product-card"
                key={product._id}
                onClick={() => openProduct(product)}
                onKeyDown={(event) => {
                  if (
                    (event.key === "Enter" || event.key === " ") &&
                    event.target === event.currentTarget
                  ) {
                    event.preventDefault();
                    openProduct(product);
                  }
                }}
                role="link"
                tabIndex={0}
                aria-label={`View ${product.name} details`}
              >
                <div className="product-image">
                  <img
                    src={
                      product.image ||
                      product.images?.[0]?.url ||
                      sampleProducts[index % sampleProducts.length].image
                    }
                    alt={product.name}
                    onClick={() => openProduct(product)}
                    style={{ cursor: "pointer" }}
                  />

                  <button
                    className="favorite"
                    type="button"
                    aria-label="Add to favorites"
                  >
                    ♡
                  </button>
                </div>

                <div className="product-info">
                  <small>{product.artist || product.category}</small>

                  <h3
                    onClick={() => openProduct(product)}
                    style={{ cursor: "pointer" }}
                  >
                    {product.name}
                  </h3>

                  <div className="product-bottom">
                    <strong>
                      ₱{Number(product.price).toLocaleString("en-PH")}
                    </strong>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleAddToCart(product);
                      }}
                      aria-label={`Add ${product.name} to cart`}
                    >
                      ＋
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {cartMessage && (
            <p role="status" className="product-cart-message">
              {cartMessage}
            </p>
          )}

          {visibleProducts.length === 0 && (
            <p className="no-products">
              No products match your selected filters.
            </p>
          )}

          <a className="view-all" href="#products">
            View all merchandise →
          </a>
        </section>

        <section id="about" className="about">
          <h2>
            Made for every <em>K-pop fan</em>
          </h2>
          <p>
            Find your favorite albums, photocards, lightsticks, and more in one
            place.
          </p>
        </section>
      </main>

      <Footer />
    </>
  );
}
