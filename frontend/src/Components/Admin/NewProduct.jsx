import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useFormik } from "formik";
import axios from "axios";
import "../../App.css";
import CustomModal from "../Common/CustomModal";
import { newProductValidationSchema } from "../../schemas/formSchemas";
import { showNotification } from "../../utils/notifications";
import AdminSidebarActions from "./AdminSidebarActions";

const API = import.meta.env.VITE_API || "http://localhost:5000/api/v1";
const NewProduct = () => {
  const [error, setError] = useState("");
  const [artists, setArtists] = useState([]);
  const [artistsError, setArtistsError] = useState("");
  const [categories, setCategories] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [popupOpen, setPopupOpen] = useState(false);
  const navigate = useNavigate();
  const formik = useFormik({
    initialValues: { name: "", artist: "", customArtist: "", price: "", description: "", category: "Albums", stock: "", images: [] },
    validationSchema: newProductValidationSchema,
    onSubmit: async (values) => {
      setError("");
      const formData = new FormData();
      formData.append("name", values.name.trim());
      formData.append("artist", (values.artist === "Other" ? values.customArtist : values.artist).trim());
      formData.append("price", values.price);
      formData.append("description", values.description.trim());
      formData.append("category", values.category);
      formData.append("stock", values.stock);
      values.images.forEach((file) => formData.append("images", file));

      try {
        const { data } = await axios.post(`${API}/admin/product/new`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (data.success) setPopupOpen(true);
        else {
          const message = data.message || "Failed to create product.";
          setError(message);
          showNotification({ title: "Product creation failed", text: message, icon: "error" });
        }
      } catch (requestError) {
        const message = requestError.response?.data?.message || requestError.message || "Failed to create product.";
        setError(message);
        showNotification({ title: "Product creation failed", text: message, icon: "error" });
      }
    },
  });
  const files = formik.values.images;
  const loading = formik.isSubmitting;

  useEffect(() => {
    if (categories.length && !categories.some((item) => item.name === formik.values.category)) {
      formik.setFieldValue("category", categories[0].name);
    }
  }, [categories, formik.values.category]);

  useEffect(() => {
    const getArtists = async () => {
      try {
        const { data } = await axios.get(`${API}/admin/artists`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setArtists(data.artists || []);
      } catch (requestError) {
        setArtistsError(requestError.response?.data?.message || "Unable to load artist / group list.");
      }
    };
    getArtists();
  }, []);

  useEffect(() => {
    axios.get(`${API}/categories`)
      .then(({ data }) => setCategories(data.categories || []))
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load categories."));
  }, []);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach(url => URL.revokeObjectURL(url));
  }, [files]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;
    setError("");
    formik.setFieldValue("images", selectedFiles);
    formik.setFieldTouched("images", true, false);
  };

  const removeSelectedImage = (index) => {
    formik.setFieldValue("images", files.filter((_, fileIndex) => fileIndex !== index));
    const input = document.getElementById("product-images");
    if (input) input.value = "";
  };

  const fieldError = (name) => formik.touched[name] && formik.errors[name]
    ? <span className="field-error" role="alert">{formik.errors[name]}</span>
    : null;

  return (
    <>
      <div className="admin-page">
        <aside className="admin-sidebar">
          <h2>J&J K-POP</h2><p>Admin Panel</p>
          <nav>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/admin/charts">Charts</Link>
            <Link to="/dashboard#admin-products">Products</Link>
            <Link to="/admin/categories">Categories</Link>
            <Link to="/admin/orders">Orders</Link>
            <Link to="/admin/reviews">Reviews</Link>
            <Link to="/admin/users">Users</Link>
          </nav>
          <AdminSidebarActions />
        </aside>

        <main className="admin-main">
          <div className="admin-products">
            <h1>New Product</h1><p>Add merchandise to your K-pop store.</p>
            <form className="admin-product-form" onSubmit={formik.handleSubmit} noValidate>
              <h3>Product Information</h3>
              {error && <p className="admin-error" role="alert">{error}</p>}

              <label>Product Name
                <input {...formik.getFieldProps("name")} placeholder="e.g. SEVENTEEN Album" aria-invalid={Boolean(formik.touched.name && formik.errors.name)} />
                {fieldError("name")}
              </label>

              <label>Artist / Group
                <select {...formik.getFieldProps("artist")} aria-invalid={Boolean(formik.touched.artist && formik.errors.artist)}>
                  <option value="">Select an artist / group</option>
                  {artists.map((artist) => <option key={artist._id} value={artist.name}>{artist.name}</option>)}
                  <option value="Other">Other</option>
                </select>
                {fieldError("artist")}
              </label>

              {formik.values.artist === "Other" && (
                <label>Artist / Group Name
                  <input {...formik.getFieldProps("customArtist")} placeholder="e.g. BIGBANG and 2NE1" aria-invalid={Boolean(formik.touched.customArtist && formik.errors.customArtist)} />
                  {fieldError("customArtist")}
                </label>
              )}
              {artistsError && <p className="admin-error admin-full-width" role="alert">{artistsError}</p>}

              <label>Price (₱)
                <input {...formik.getFieldProps("price")} type="number" min="0.01" step="0.01" aria-invalid={Boolean(formik.touched.price && formik.errors.price)} />
                {fieldError("price")}
              </label>

              <label>Category
                <select {...formik.getFieldProps("category")} aria-invalid={Boolean(formik.touched.category && formik.errors.category)}>
                  {categories.map(item => <option key={item._id} value={item.name}>{item.name}</option>)}
                </select>
                {fieldError("category")}
              </label>

              <label>Stock
                <input {...formik.getFieldProps("stock")} type="number" min="0" step="1" aria-invalid={Boolean(formik.touched.stock && formik.errors.stock)} />
                {fieldError("stock")}
              </label>

              <div className="admin-full-width">
                <label htmlFor="product-images">Product Images (up to 5)</label>
                <input id="product-images" type="file" accept=".jpg,.jpeg,.jpe,.png,.webp,image/jpeg,image/png,image/webp" multiple onChange={handleFileChange} onBlur={() => formik.setFieldTouched("images", true)} disabled={loading} />
                {fieldError("images")}
                <p>Select up to 5 JPG, PNG, or WEBP images. Maximum 5 MB per image.</p>

                {previews.length > 0 && (
                  <div className="product-image-previews">
                    {previews.map((src, index) => (
                      <div className="product-image-preview" key={src}>
                        <button
                          type="button"
                          className="image-remove-button"
                          aria-label={`Remove image ${index + 1}`}
                          title="Remove image"
                          onClick={() => removeSelectedImage(index)}
                          disabled={loading}
                        >
                          ×
                        </button>
                        <img src={src} alt={`Product preview ${index + 1}`} />
                        <p>Image {index + 1}</p>
                      </div>
                    ))}
                  </div>
                )}

                {files.length > 0 && (
                  <button type="button" className="admin-cancel-button" onClick={() => {
                    formik.setFieldValue("images", []); setError("");
                    const input = document.getElementById("product-images");
                    if (input) input.value = "";
                  }} disabled={loading}>Remove All Selected Images</button>
                )}
              </div>

              <label className="admin-full-width">Description
                <textarea {...formik.getFieldProps("description")} rows="5" placeholder="Describe the merchandise" aria-invalid={Boolean(formik.touched.description && formik.errors.description)} />
                {fieldError("description")}
              </label>

              <button type="submit" className="admin-add-button" disabled={loading}>
                {loading ? "Uploading Images..." : "CREATE PRODUCT"}
              </button>
              <button type="button" className="admin-cancel-button" onClick={() => navigate("/dashboard")} disabled={loading}>Cancel</button>
            </form>
          </div>
        </main>
      </div>

      <CustomModal isOpen={popupOpen} title="Product Created Successfully!" message="Your new product has been added to the store." type="success" confirmText="Go to Dashboard" onConfirm={() => {
        setPopupOpen(false);
        navigate("/dashboard");
      }} />
    </>
  );
};

export default NewProduct;
