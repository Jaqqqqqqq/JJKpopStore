import * as Yup from "yup";

const emailField = Yup.string()
  .trim()
  .email("Enter a valid email address.")
  .required("Email is required.")
  .max(254, "Email must be 254 characters or fewer.");

const passwordField = Yup.string()
  .required("Password is required.")
  .min(6, "Password must be at least 6 characters.")
  .max(128, "Password must be 128 characters or fewer.");

export const loginValidationSchema = Yup.object({
  email: emailField,
  password: passwordField,
});

export const registerValidationSchema = Yup.object({
  firstName: Yup.string().trim().min(2, "First name must be at least 2 characters.").max(50).required("First name is required."),
  lastName: Yup.string().trim().min(2, "Last name must be at least 2 characters.").max(50).required("Last name is required."),
  address: Yup.string().trim().min(5, "Enter a complete address.").max(200).required("Address is required."),
  phoneNumber: Yup.string()
    .trim()
    .matches(/^\+?[\d\s()-]{7,20}$/, "Enter a valid phone number.")
    .required("Phone number is required."),
  email: emailField,
  password: passwordField,
});

export const profileValidationSchema = Yup.object({
  name: Yup.string().trim().min(2, "Name must be at least 2 characters.").max(100).required("Name is required."),
  address: Yup.string().trim().min(5, "Enter a complete address.").max(200).required("Address is required."),
  phoneNumber: Yup.string()
    .trim()
    .matches(/^\+?[\d\s()-]{7,20}$/, "Enter a valid phone number.")
    .required("Phone number is required."),
  email: emailField,
});

const imageField = Yup.mixed()
  .test("image-type", "Choose a JPG, PNG, or WEBP image.", (file) =>
    !file || ["image/jpeg", "image/png", "image/webp"].includes(file.type)
  )
  .test("image-size", "Each image must be 5 MB or smaller.", (file) =>
    !file || file.size <= 5 * 1024 * 1024
  );

const productFields = {
  name: Yup.string().trim().min(2, "Product name must be at least 2 characters.").max(100).required("Product name is required."),
  artist: Yup.string().trim().min(2, "Artist or group must be at least 2 characters.").max(80).required("Artist / group is required."),
  customArtist: Yup.string().when("artist", {
    is: "Other",
    then: (schema) => schema.trim().min(2, "Enter the collaboration artist / group names.").max(80).required("Enter the artist / group name."),
    otherwise: (schema) => schema.notRequired(),
  }),
  price: Yup.number().transform((value, originalValue) => originalValue === "" ? undefined : value).typeError("Enter a valid price.").min(0.01, "Price must be greater than 0.").max(10000000, "Price is too large.").required("Price is required."),
  description: Yup.string().trim().min(10, "Description must be at least 10 characters.").max(2000).required("Description is required."),
  category: Yup.string().trim().min(2, "Category must be at least 2 characters.").max(50).required("Category is required."),
  stock: Yup.number().transform((value, originalValue) => originalValue === "" ? undefined : value).typeError("Enter a valid stock quantity.").integer("Stock must be a whole number.").min(0, "Stock cannot be negative.").max(1000000, "Stock is too large.").required("Stock is required."),
};

export const newProductValidationSchema = Yup.object({
  ...productFields,
  images: Yup.array().of(imageField).min(1, "Select at least one product image.").max(5, "Select no more than 5 images."),
});

export const editProductValidationSchema = Yup.object({
  ...productFields,
  images: Yup.array().of(imageField).max(5, "Select no more than 5 new images."),
});
