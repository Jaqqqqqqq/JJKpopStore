
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "../App.css";
import CustomModal from "../Components/Common/CustomModal";

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

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

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
    images: [],
  });

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const getProduct = async () => {
      try {
        setLoadingProduct(true);

        const response = await axios.get(`${API}/product/${id}`);
        const item = response.data.product;

        if (cancelled) return;

        setProduct({
          name: item.name || "",
          artist: item.artist || "",
          price: item.price ?? "",
          description: item.description || "",
          category: item.category || "Albums",
          stock: item.stock ?? "",
          image: item.image || "",
          images: Array.isArray(item.images) ? item.images : [],
        });
      } catch (error) {
        if (!cancelled) {
          setError(
            error.response?.data?.message ||
              "Failed to load product."
          );
        }
      } finally {
        if (!cancelled) setLoadingProduct(false);
      }
    };

    getProduct();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  const changeHandler = (e) => {
    const { name, value } = e.target;

    setProduct((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const fileChangeHandler = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (selectedFiles.length === 0) return;

    if (selectedFiles.length > MAX_IMAGES) {
      setError(`Select no more than ${MAX_IMAGES} new images at a time.`);
      e.target.value = "";
      return;
    }

    const invalidFile = selectedFiles.find(
      (file) =>
        !ALLOWED_TYPES.includes(file.type) ||
        file.size > MAX_FILE_SIZE
    );

    if (invalidFile) {
      setError(
        "Use JPG, JPEG, JPE, PNG, or WEBP images no larger than 5 MB each."
      );
      e.target.value = "";
      return;
    }

    setError("");
    setFiles(selectedFiles);
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");

    const formData = new FormData();

    formData.append("name", product.name.trim());
    formData.append("artist", product.artist.trim());
    formData.append("price", product.price);
    formData.append("description", product.description.trim());
    formData.append("category", product.category);
    formData.append("stock", product.stock);

    files.forEach((file) => {
      formData.append("images", file);
    });

    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const { data } = await axios.put(
        `${API}/admin/product/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (data.success) {
        setPopupOpen(true);
      } else {
        setError(data.message || "Failed to update product.");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to update product."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="admin-page">
        <main className="admin-main">
          <p>Loading product...</p>
        </main>
      </div>
    );
  }

  
  return (
    <>
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

            {error && (
              <p className="admin-error" role="alert">
                {error}
              </p>
            )}

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

              <div className="admin-full-width">
                <p>Current Product Images</p>

                {product.images.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "12px",
                    }}
                  >
                    {product.images.map((img, index) => (
                      <div key={img.publicId || img.url || index}>
                        <img
                          src={img.url}
                          alt={`${product.name} ${index + 1}`}
                          style={{
                            width: "100px",
                            height: "100px",
                            objectFit: "contain",
                            border: "1px solid #ead5df",
                            borderRadius: "6px",
                          }}
                        />
                        <p>Image {index + 1}</p>
                      </div>
                    ))}
                  </div>
                ) : product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "contain",
                      border: "1px solid #ead5df",
                      borderRadius: "6px",
                    }}
                  />
                ) : (
                  <p>No existing image.</p>
                )}
              </div>

              <div className="admin-full-width">
                <label htmlFor="edit-product-images">
                  Add New Images (up to 5 per save)
                </label>

                <input
                  id="edit-product-images"
                  type="file"
                  accept=".jpg,.jpeg,.jpe,.png,.webp,image/jpeg,image/png,image/webp"
                  multiple
                  onChange={fileChangeHandler}
                  disabled={loading}
                />

                <p>
                  New images will be added to the existing images.
                  JPG, JPEG, JPE, PNG, or WEBP; maximum 5 MB each.
                </p>

                {previews.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "12px",
                    }}
                  >
                    {previews.map((src, index) => (
                      <div key={src}>
                        <img
                          src={src}
                          alt={`New image preview ${index + 1}`}
                          style={{
                            width: "100px",
                            height: "100px",
                            objectFit: "contain",
                            border: "1px solid #ead5df",
                            borderRadius: "6px",
                          }}
                        />
                        <p>New image {index + 1}</p>
                      </div>
                    ))}
                  </div>
                )}

                {files.length > 0 && (
                  <button
                    type="button"
                    className="admin-cancel-button"
                    onClick={() => {
                      setFiles([]);
                      setError("");

                      const input = document.getElementById(
                        "edit-product-images"
                      );

                      if (input) input.value = "";
                    }}
                    disabled={loading}
                  >
                    Clear New Images
                  </button>
                )}
              </div>

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
                disabled={loading || loadingProduct}
              >
                {loading ? "Saving..." : "SAVE CHANGES"}
              </button>

              <button
                type="button"
                className="admin-cancel-button"
                onClick={() => navigate("/dashboard")}
                disabled={loading}
              >
                Cancel
              </button>
            </form>
          </div>
        </main>
      </div>

      <CustomModal
        isOpen={popupOpen}
        title="Product Updated Successfully!"
        message="Your product information has been updated."
        type="success"
        confirmText="Go to Dashboard"
        onConfirm={() => {
          setPopupOpen(false);
          navigate("/dashboard");
        }}
      />
    </>
  );
};

export default EditProduct;
