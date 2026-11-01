
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Header from "./Layout/Header";
import Footer from "./Layout/Footer";
import { categories as defaultCategories, sampleProducts } from "./catalogData";
import { addToCart } from "../actions/cartActions";
import { fetchProducts } from "../actions/productActions";
import { showNotification } from "../utils/notifications";

export default function Home({ user }) {
  const [categoryOptions, setCategoryOptions] = useState(defaultCategories);
  const [currentPage, setCurrentPage] = useState(1);
  const [category, setCategory] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minimumRating, setMinimumRating] = useState("0");
  const [reviewFilter, setReviewFilter] = useState("all");
  const [cartMessage, setCartMessage] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const loadMoreRef = useRef(null);
  const searchQuery = (searchParams.get("search") || "").trim().toLowerCase();
  const API = import.meta.env.VITE_API || "http://localhost:5000/api/v1";

  const cartItems = useSelector((state) => state.cart?.items || []);
  const productState = useSelector((state) => state.products);
  const products = productState.items.length || !productState.error
    ? productState.items
    : sampleProducts;
  const productCount = productState.error
    ? sampleProducts.length
    : productState.filteredProductsCount;
  const hasMore = productState.hasMore;
  const productsLoading = productState.loading;
  const cartCount = cartItems.reduce(
    (total, item) => total + (Number(item.quantity) || 0),
    0
  );

  useEffect(() => {
    fetch(`${API}/categories`)
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data.categories)) {
          setCategoryOptions(["All", ...data.categories.map((item) => item.name)]);
        }
      })
      .catch(() => {});
  }, [API]);

  useEffect(() => {
    const filters = {
      page: String(currentPage),
      limit: "12",
      keyword: searchQuery,
      category,
      rating: minimumRating,
      reviews: reviewFilter,
    };
    if (minPrice !== "") filters.minPrice = minPrice;
    if (maxPrice !== "") filters.maxPrice = maxPrice;
    dispatch(fetchProducts(filters, currentPage > 1)).catch(() => {});
  }, [dispatch, currentPage, category, minPrice, maxPrice, minimumRating, reviewFilter, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [category, minPrice, maxPrice, minimumRating, reviewFilter, searchQuery]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!hasMore || productsLoading || !sentinel) return undefined;
    if (!("IntersectionObserver" in window)) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setCurrentPage((page) => page + 1);
    }, { rootMargin: "250px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, productsLoading, products.length]);

  useEffect(() => {
    if (location.hash !== "#products") return;
    requestAnimationFrame(() => {
      document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
    });
  }, [location.pathname, location.hash, location.search]);

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
        const ratings = Number(product.ratings || 0);
        const reviewCount = Number(
          product.numOfReviews ?? product.reviews?.length ?? 0
        );
        const matchesRating = ratings >= Number(minimumRating);
        const matchesReviews =
          reviewFilter === "all" ||
          (reviewFilter === "has-reviews" && reviewCount > 0) ||
          (reviewFilter === "no-reviews" && reviewCount === 0);
        const matchesSearch =
          !searchQuery ||
          [product.name, product.artist, product.category]
            .some((value) => value?.toLowerCase().includes(searchQuery));

        return (
          matchesCategory &&
          matchesMinPrice &&
          matchesMaxPrice &&
          matchesRating &&
          matchesReviews &&
          matchesSearch
        );
      }),
    [products, category, minPrice, maxPrice, minimumRating, reviewFilter, searchQuery]
  );

  function openProduct(product) {
    // Sample IDs such as "a" are not MongoDB product IDs.
    if (!/^[a-f\d]{24}$/i.test(product?._id || "")) {
      const message = "This is a sample product. Select a saved store product to view its details.";
      setCartMessage(message);
      showNotification({ title: "Sample product", text: message, icon: "info" });
      return;
    }

    navigate(`/product/${product._id}`);
  }

  function handleAddToCart(product) {
    if (!product?._id || !/^[a-f\d]{24}$/i.test(product._id)) {
      const message = "This sample product is for display only. Please add a saved store product to your cart.";
      setCartMessage(message);
      showNotification({ title: "Cannot add sample product", text: message, icon: "warning" });
      return;
    }

    if (product.isAvailable === false || Number(product.stock) < 1) {
      const message = `${product.name} is currently unavailable.`;
      setCartMessage(message);
      showNotification({ title: "Product unavailable", text: message, icon: "warning" });
      return;
    }

    dispatch(addToCart(product));
    setCartMessage(`${product.name} added to your cart!`);
    showNotification({ title: "Added to cart", text: `${product.name} added to your cart!` });
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
            {categoryOptions.map((item) => (
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
            <fieldset className="filter-group price-filter-group">
              <legend>Price range</legend>
              <label htmlFor="minPrice">Min price</label>
              <input
                type="number"
                id="minPrice"
                min="0"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                placeholder="No minimum"
              />
              <label htmlFor="maxPrice">Max price</label>
              <input
                type="number"
                id="maxPrice"
                min="0"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                placeholder="No maximum"
              />
            </fieldset>

            <fieldset className="filter-group">
              <legend>Minimum rating</legend>
              <label htmlFor="minimumRating">Show products rated at least</label>
              <select
                id="minimumRating"
                value={minimumRating}
                onChange={(event) => setMinimumRating(event.target.value)}
              >
                <option value="0">Any rating</option>
                <option value="1">1 star</option>
                <option value="2">2 stars</option>
                <option value="3">3 stars</option>
                <option value="4">4 stars</option>
                <option value="5">5 stars</option>
              </select>
            </fieldset>

            <fieldset className="filter-group">
              <legend>Reviews</legend>
              <label htmlFor="reviewFilter">Customer reviews</label>
              <select
                id="reviewFilter"
                value={reviewFilter}
                onChange={(event) => setReviewFilter(event.target.value)}
              >
                <option value="all">All products</option>
                <option value="has-reviews">Has reviews</option>
                <option value="no-reviews">No reviews yet</option>
              </select>
            </fieldset>

            <button
              className="clear-filters-button"
              type="button"
              onClick={() => {
                setCategory("All");
                setMinPrice("");
                setMaxPrice("");
                setMinimumRating("0");
                setReviewFilter("all");
              }}
            >
              Clear filters
            </button>
          </div>

          <p className="product-result-count">{productCount} product(s)</p>

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
                  <p className="product-card-rating">
                    {Number(product.ratings || 0) > 0
                      ? `★ ${Number(product.ratings).toFixed(1)} · ${Number(product.numOfReviews ?? product.reviews?.length ?? 0)} review(s)`
                      : "No reviews yet"}
                  </p>
                </div>
              </article>
            ))}
          </div>

          {hasMore && (
            <div className="infinite-scroll-status" ref={loadMoreRef}>
              {productsLoading ? "Loading more products..." : "Scroll to load more products"}
              <button type="button" onClick={() => setCurrentPage((page) => page + 1)} disabled={productsLoading}>
                {productsLoading ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
          {productsLoading && currentPage === 1 && <p className="no-products">Loading products...</p>}

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

      </main>

      <Footer />
    </>
  );
}
