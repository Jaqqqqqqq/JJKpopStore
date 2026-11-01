import { useEffect, useState } from "react";
import { useFormik } from "formik";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import Header from "../Layout/Header";
import Footer from "../Layout/Footer";
import { API } from "../../api";
import { AUTH_SUCCESS } from "../../actions/userActions";
import { profileValidationSchema } from "../../schemas/formSchemas";
import { showNotification } from "../../utils/notifications";

export default function CustomerProfile() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const [message, setMessage] = useState("");
  const [requestError, setRequestError] = useState("");

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: user?.name || "",
      email: user?.email || "",
      address: user?.address || "",
      phoneNumber: user?.phoneNumber || "",
    },
    validationSchema: profileValidationSchema,
    onSubmit: async (values) => {
      setMessage("");
      setRequestError("");
      try {
        const { data } = await axios.put(`${API}/me/update`, values, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const updatedUser = { ...user, ...data.user, role: user.role };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        dispatch({ type: AUTH_SUCCESS, payload: updatedUser });
        const message = data.message || "Profile updated successfully.";
        setMessage(message);
        showNotification({ title: "Profile updated", text: message });
      } catch (error) {
        const message = error.response?.data?.message || "Unable to update your profile.";
        setRequestError(message);
        showNotification({ title: "Profile update failed", text: message, icon: "error" });
      }
    },
  });

  useEffect(() => {
    if (message) {
      const timeout = window.setTimeout(() => setMessage(""), 5000);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [message]);

  const fieldError = (name) =>
    formik.touched[name] && formik.errors[name] ? (
      <span className="field-error" role="alert">{formik.errors[name]}</span>
    ) : null;

  return (
    <>
      <Header user={user} />
      <main className="profile-page">
        <section className="profile-card">
          <p className="eyebrow">ACCOUNT SETTINGS</p>
          <h1>Update Profile</h1>
          <p className="profile-intro">Keep your contact and delivery details up to date.</p>

          {message && <p className="profile-success" role="status">{message}</p>}
          {requestError && <p className="profile-error" role="alert">{requestError}</p>}

          <form onSubmit={formik.handleSubmit} noValidate>
            <label>
              Full name
              <input {...formik.getFieldProps("name")} autoComplete="name" aria-invalid={Boolean(formik.touched.name && formik.errors.name)} />
              {fieldError("name")}
            </label>
            <label>
              Email address
              <input {...formik.getFieldProps("email")} type="email" autoComplete="email" aria-invalid={Boolean(formik.touched.email && formik.errors.email)} />
              {fieldError("email")}
            </label>
            <label>
              Address
              <input {...formik.getFieldProps("address")} autoComplete="street-address" aria-invalid={Boolean(formik.touched.address && formik.errors.address)} />
              {fieldError("address")}
            </label>
            <label>
              Phone number
              <input {...formik.getFieldProps("phoneNumber")} type="tel" autoComplete="tel" aria-invalid={Boolean(formik.touched.phoneNumber && formik.errors.phoneNumber)} />
              {fieldError("phoneNumber")}
            </label>
            <button className="profile-submit" type="submit" disabled={formik.isSubmitting}>
              {formik.isSubmitting ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </section>
      </main>
      <Footer />
    </>
  );
}
