
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState({
    name: "",
    artist: "",
    price: "",
    description: "",
    category: "Albums",
    stock: "",
    image: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getProduct = async () => {
      try {
        const response = await axios.get(`${API}/product/${id}`);

        setProduct({
          name: response.data.product.name || "",
          artist: response.data.product.artist || "",
          price: response.data.product.price ?? "",
          description: response.data.product.description || "",
          category: response.data.product.category || "Albums",
          stock: response.data.product.stock ?? "",
          image: response.data.product.image || "",
        });
      } catch (error) {
        window.alert(
          error.response?.data?.message || "Failed to load product."
        );
      }
    };

    getProduct();
  }, [id]);

  const changeHandler = (e) => {
    setProduct({
      ...product,
      [e.target.name]: e.target.value,
    });
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      await axios.put(
        `${API}/admin/product/${id}`,
        {
          ...product,
          price: Number(product.price),
          stock: Number(product.stock),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      window.alert("Product updated successfully!");
      navigate("/dashboard");
    } catch (error) {
      window.alert(
        error.response?.data?.message || "Failed to update product."
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
          <h1>Edit Product</h1>
          <p>Update your merchandise information.</p>

          <form
            className="admin-product-form"
            onSubmit={submitHandler}
          >
            <label>
              Product Name
              <input
                name="name"
                value={product.name}
                onChange={changeHandler}
                required
              />
            </label>

            <label>
              Artist / Group
              <input
                name="artist"
                value={product.artist}
                onChange={changeHandler}
                required
              />
            </label>

            <label>
              Price (₱)
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={product.price}
                onChange={changeHandler}
                required
              />
            </label>

            <label>
              Category
              <select
                name="category"
                value={product.category}
                onChange={changeHandler}
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
                name="stock"
                type="number"
                min="0"
                step="1"
                value={product.stock}
                onChange={changeHandler}
                required
              />
            </label>

            <label>
              Image URL
              <input
                name="image"
                type="url"
                value={product.image}
                onChange={changeHandler}
              />
            </label>

            <label className="admin-full-width">
              Description
              <textarea
                name="description"
                rows="5"
                value={product.description}
                onChange={changeHandler}
                required
              />
            </label>

            <button
              type="submit"
              className="admin-add-button"
              disabled={loading}
            >
              {loading ? "Saving..." : "SAVE CHANGES"}
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

export default EditProduct;
