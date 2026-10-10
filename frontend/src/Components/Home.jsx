import { useEffect, useMemo, useState } from "react";
import Header from "./Layout/Header";
import Footer from "./Layout/Footer";
import { API, categories, sampleProducts } from "./catalogData";

export default function Home({ user, setPage }) {
  const [products, setProducts] = useState(sampleProducts);
  const [category, setCategory] = useState("All");
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    fetch(`${API}/products`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.products?.length) setProducts(data.products);
      })
      .catch(() => {});
  }, []);

  const visibleProducts = useMemo(
    () =>
      category === "All"
        ? products
        : products.filter((product) => product.category === category),
    [category, products]
  );

  return (
    <>
      <div id="top" />
      <Header
        cartCount={cartCount}
        user={user}
        page="home"
        setPage={setPage}
      />

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
              <div>🚚 <span>Nationwide<br />Shipping</span></div>
              <div>♢ <span>100% Original<br />Merchandise</span></div>
              <div>▤ <span>Secure<br />Payment</span></div>
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
            <button aria-label="Previous slide">‹</button>
            <button aria-label="Next slide">›</button>
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
                onClick={() => setCategory(item)}
                className={category === item ? "selected" : ""}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="product-grid">
            {visibleProducts.map((product, index) => (
              <article className="product-card" key={product._id}>
                <div className="product-image">
                  <img
                    src={
                      product.image ||
                      sampleProducts[index % sampleProducts.length].image
                    }
                    alt={product.name}
                  />
                  <button className="favorite" aria-label="Add to favorites">
                    ♡
                  </button>
                </div>
                <div className="product-info">
                  <small>{product.artist || product.category}</small>
                  <h3>{product.name}</h3>
                  <div className="product-bottom">
                    <strong>
                      ₱{Number(product.price).toLocaleString("en-PH")}
                    </strong>
                    <button
                      onClick={() => setCartCount((count) => count + 1)}
                      aria-label={`Add ${product.name} to cart`}
                    >
                      ＋
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <a className="view-all" href="#products">
            View all merchandise →
          </a>
        </section>

        <section id="about" className="about">
          <h2>
            Made for every <em>K-pop fan</em>
          </h2>
          <p>Find your favorite albums, photocards, lightsticks, and more in one place.</p>
        </section>
      </main>

      <Footer />
    </>
  );
}
