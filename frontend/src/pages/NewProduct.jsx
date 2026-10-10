
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../App.css";

const API =
  import.meta.env.VITE_API || "http://localhost:5000/api/v1";

const categories = [
  "Albums",
  "Photocards",
  "Lightsticks",
  "Posters",
  "Accessories",
  "Other",
];

const NewProduct = () => {
  const [name, setName] = useState("");
  const [artist, setArtist] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Albums");
  const [stock, setStock] = useState("");
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const submitHandler = (e) => {
    e.preventDefault();

    const productData = {
      name,
      artist,
      price: Number(price),
      description,
      category,
      stock: Number(stock),
      image,
    };

    newProduct(productData);
  };

  const newProduct = async (productData) => {
    try {
      setLoading(true);
      setError("");

      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      };

      const { data } = await axios.post(
        `${API}/admin/product/new`,
        productData,
        config
      );

      if (data.success) {
        window.alert("Product created successfully!");
        navigate("/dashboard");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to create product. Please check your connection."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <h2>J&J K-POP</h2>
        <p>Admin Panel</p>

        <nav>
          <a href="/dashboard">Dashboard</a>
          <a href="/dashboard#admin-products">Products</a>
        </nav>

        <a href="/" className="admin-logout">
          Back to Store
        </a>
      </aside>

      <main className="admin-main">
        <div className="admin-products">
          <h1>New Product</h1>
          <p>Add merchandise to your K-pop store.</p>

          <form
            className="admin-product-form"
            onSubmit={submitHandler}
          >
            <h3>Product Information</h3>

            {error && <p className="admin-error" role="alert">{error}</p>}

            <label>
              Product Name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. SEVENTEEN Album"
              />
            </label>

            <label>
              Artist / Group
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                required
                placeholder="e.g. SEVENTEEN"
              />
            </label>

            <label>
              Price (₱)
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </label>

            <label>
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Stock
              <input
                type="number"
                min="0"
                step="1"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
              />
            </label>

            <label>
              Image URL
              <input
                type="url"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </label>

            <label className="admin-full-width">
              Description
              <textarea
                rows="5"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="Describe the merchandise"
              />
            </label>

            <button
              type="submit"
              className="admin-add-button"
              disabled={loading}
            >
              {loading ? "Creating Product..." : "CREATE PRODUCT"}
            </button>

            <button
              type="button"
              className="admin-cancel-button"
              onClick={() => navigate("/dashboard")}
            >
              Cancel
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default NewProduct;
