
const mongoose = require("mongoose");
const Product = require("../models/product");
const Category = require("../models/category");
const Order = require("../models/order");
const { cleanReviewText } = require("../utils/reviewWordFilter");
const {
  uploadProductImage,
} = require("../utils/uploadProductImages");

const cloudinaryPublicIdFromUrl = (imageUrl) => {
  try {
    const segments = new URL(imageUrl).pathname.split("/").filter(Boolean);
    const uploadIndex = segments.indexOf("upload");
    if (uploadIndex < 0) return null;
    const assetPath = segments.slice(uploadIndex + 1);
    const versionIndex = assetPath.findIndex((segment) => /^v\d+$/.test(segment));
    if (versionIndex >= 0) assetPath.splice(0, versionIndex + 1);
    if (!assetPath.length) return null;
    assetPath[assetPath.length - 1] = assetPath.at(-1).replace(/\.[^.]+$/, "");
    return assetPath.join("/");
  } catch {
    return null;
  }
};

// Get all K-pop merchandise
exports.getProducts = async (req, res) => {
  try {
    const {
      page: pageValue,
      limit: limitValue,
      keyword,
      category,
      minPrice,
      maxPrice,
      rating,
      reviews: reviewFilter,
    } = req.query;
    const page = Math.max(1, Number.parseInt(pageValue, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(limitValue, 10) || 12));
    const filter = {};
    if (keyword?.trim()) {
      const safeKeyword = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: safeKeyword, $options: "i" } },
        { artist: { $regex: safeKeyword, $options: "i" } },
        { category: { $regex: safeKeyword, $options: "i" } },
      ];
    }
    if (category && category !== "All") filter.category = category;
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined && Number.isFinite(Number(minPrice))) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined && Number.isFinite(Number(maxPrice))) filter.price.$lte = Number(maxPrice);
    }
    if (rating && Number.isFinite(Number(rating)) && Number(rating) > 0) filter.ratings = { $gte: Number(rating) };
    if (reviewFilter === "has-reviews") filter.numOfReviews = { $gt: 0 };
    if (reviewFilter === "no-reviews") filter.numOfReviews = 0;

    const filteredProductsCount = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort({ createdAt: -1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: filteredProductsCount,
      productsCount: await Product.countDocuments(),
      filteredProductsCount,
      resPerPage: limit,
      currentPage: page,
      hasMore: page * limit < filteredProductsCount,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve products"
    });
  }
};

exports.getSingleProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid product ID"
    });
  }
};

// Create or update a review for a product purchased by the logged-in user.
exports.createProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const numericRating = Number(rating);
    const submittedComment = typeof comment === "string" ? comment.trim() : "";
    const reviewComment = submittedComment ? cleanReviewText(submittedComment) : "";

    if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Please select a rating from 1 to 5.",
      });
    }

    if (!reviewComment || reviewComment.length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Please enter a review of 1 to 1000 characters.",
      });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const purchase = await Order.exists({
      user: req.user._id,
      orderStatus: "Completed",
      "orderItems.product": product._id,
    });

    if (!purchase) {
      return res.status(403).json({
        success: false,
        message: "You can review this product after a completed order containing it.",
      });
    }

    const existingReview = product.reviews.find(
      (review) => String(review.user) === String(req.user._id)
    );

    if (existingReview) {
      existingReview.rating = numericRating;
      existingReview.comment = reviewComment;
    } else {
      const User = require("../models/user");
      const user = await User.findById(req.user._id).select("name");
      product.reviews.push({
        user: req.user._id,
        name: user?.name || "Customer",
        rating: numericRating,
        comment: reviewComment,
      });
    }

    product.numOfReviews = product.reviews.length;
    product.ratings = product.numOfReviews
      ? product.reviews.reduce((total, review) => total + review.rating, 0) / product.numOfReviews
      : 0;

    await product.save();

    return res.status(existingReview ? 200 : 201).json({
      success: true,
      message: existingReview ? "Review updated successfully." : "Review submitted successfully.",
      product,
    });
  } catch (error) {
    console.error("Save product review error:", error);
    return res.status(500).json({ success: false, message: "Unable to save review." });
  }
};

// Delete a review. The route is restricted to admins.
exports.deleteProductReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    if (!mongoose.isValidObjectId(reviewId)) {
      return res.status(400).json({ success: false, message: "Invalid review ID" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const review = product.reviews.id(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    review.deleteOne();
    product.numOfReviews = product.reviews.length;
    product.ratings = product.numOfReviews
      ? product.reviews.reduce((total, item) => total + item.rating, 0) / product.numOfReviews
      : 0;
    await product.save();

    return res.status(200).json({ success: true, message: "Review deleted successfully.", product });
  } catch (error) {
    console.error("Delete product review error:", error);
    return res.status(500).json({ success: false, message: "Unable to delete review." });
  }
};

// Add new K-pop merchandise

exports.newProduct = async (req, res) => {
  const uploadedImages = [];

  try {
    const category = await Category.findOne({ name: String(req.body.category || "").trim() });
    if (!category) {
      return res.status(400).json({ success: false, message: "Choose a category from the category list." });
    }
    const files = req.files || [];

    // Upload each selected image to Cloudinary.
    for (const file of files) {
      const uploadedImage = await uploadProductImage(file);
      uploadedImages.push(uploadedImage);
    }

    const productData = {
      ...req.body,
      price: Number(req.body.price),
      stock: Number(req.body.stock),
      images: uploadedImages,
    };

    // Keep the existing single-image field compatible.
    if (uploadedImages.length > 0) {
      productData.image = uploadedImages[0].url;
    }

    const product = await Product.create(productData);

    return res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    // Clean up uploaded images if product creation fails.
    if (uploadedImages.length > 0) {
      await Promise.allSettled(
        uploadedImages.map((image) =>
          require("../config/cloudinary").uploader.destroy(
            image.publicId
          )
        )
      );
    }

    console.error("Create product error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create product.",
    });
  }
};


// Update existing merchandise
exports.updateProduct = async (req, res) => {
  const uploadedImages = [];

  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const category = await Category.findOne({ name: String(req.body.category || "").trim() });
    if (!category) {
      return res.status(400).json({ success: false, message: "Choose a category from the category list." });
    }

    const files = req.files || [];

    let deleteImageKeys = [];
    try {
      deleteImageKeys = req.body.deleteImageKeys
        ? JSON.parse(req.body.deleteImageKeys)
        : [];
    } catch {
      return res.status(400).json({ success: false, message: "Invalid image deletion request." });
    }
    if (!Array.isArray(deleteImageKeys) || deleteImageKeys.some((key) => typeof key !== "string")) {
      return res.status(400).json({ success: false, message: "Invalid image deletion request." });
    }
    const deleteKeys = new Set(deleteImageKeys);
    const removedImages = product.images.filter((image) =>
      deleteKeys.has(image.publicId || image.url)
    );
    const deleteLegacyImage = req.body.deleteLegacyImage === "true";
    const legacyImagePublicId = deleteLegacyImage
      ? cloudinaryPublicIdFromUrl(product.image)
      : null;
    if (removedImages.length) {
      product.images = product.images.filter((image) =>
        !deleteKeys.has(image.publicId || image.url)
      );
    }
    if (removedImages.length || deleteLegacyImage) {
      product.image = product.images[0]?.url || "";
    }

    // Upload newly selected images.
    for (const file of files) {
      const uploadedImage = await uploadProductImage(file);
      uploadedImages.push(uploadedImage);
    }

    // Update ordinary product fields without overwriting images.
    const fields = [
      "name",
      "artist",
      "category",
      "description",
      "price",
      "stock",
      "isAvailable",
    ];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        if (field === "price" || field === "stock") {
          product[field] = Number(req.body[field]);
        } else if (field === "isAvailable") {
          product[field] = req.body[field] === "true";
        } else {
          product[field] = req.body[field];
        }
      }
    }

    // Append new images, preserving the existing ones.
    if (uploadedImages.length > 0) {
      product.images.push(...uploadedImages);

      // Maintain compatibility with existing single-image displays.
      if (!product.image) {
        product.image = uploadedImages[0].url;
      }
    }

    await product.save();

    const cloudinaryIdsToDelete = new Set(
      removedImages
        .map((image) => image.publicId || cloudinaryPublicIdFromUrl(image.url))
        .filter(Boolean)
    );
    if (legacyImagePublicId) cloudinaryIdsToDelete.add(legacyImagePublicId);

    if (cloudinaryIdsToDelete.size > 0) {
      const cloudinary = require("../config/cloudinary");
      const deleteResults = await Promise.allSettled(
        [...cloudinaryIdsToDelete].map((publicId) => cloudinary.uploader.destroy(publicId))
      );
      deleteResults.forEach((result) => {
        if (result.status === "rejected") {
          console.error("Cloudinary image removal failed:", result.reason?.message);
        }
      });
    }

    return res.status(200).json({
      success: true,
      product,
      deletedImages: removedImages.length + (deleteLegacyImage ? 1 : 0),
    });
  } catch (error) {
    // Clean up newly uploaded images if the update fails.
    if (uploadedImages.length > 0) {
      await Promise.allSettled(
        uploadedImages.map((image) =>
          require("../config/cloudinary").uploader.destroy(
            image.publicId
          )
        )
      );
    }

    console.error("Update product error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update product.",
    });
  }
};

exports.deleteProductImages = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    const imageKeys = req.body.imageKeys;
    if (!Array.isArray(imageKeys) || imageKeys.some((key) => typeof key !== "string")) {
      return res.status(400).json({ success: false, message: "Invalid image removal request." });
    }

    const keysToDelete = new Set(imageKeys);
    const removedImages = product.images.filter((image) =>
      keysToDelete.has(image.publicId || image.url)
    );
    const deleteLegacyImage = Boolean(
      req.body.deleteLegacyImage &&
      product.image &&
      !product.images.some((image) => image.url === product.image)
    );
    const legacyImagePublicId = deleteLegacyImage
      ? cloudinaryPublicIdFromUrl(product.image)
      : null;

    if (!removedImages.length && !deleteLegacyImage) {
      return res.status(404).json({ success: false, message: "The selected image was not found on this product." });
    }

    const primaryImageRemoved = removedImages.some((image) => image.url === product.image);
    product.images = product.images.filter((image) =>
      !keysToDelete.has(image.publicId || image.url)
    );
    if (primaryImageRemoved || deleteLegacyImage) {
      product.image = product.images[0]?.url || "";
    }

    await product.save();

    const cloudinaryIds = new Set(
      removedImages
        .map((image) => image.publicId || cloudinaryPublicIdFromUrl(image.url))
        .filter(Boolean)
    );
    if (deleteLegacyImage) {
      if (legacyImagePublicId) cloudinaryIds.add(legacyImagePublicId);
    }
    if (cloudinaryIds.size) {
      const cloudinary = require("../config/cloudinary");
      const results = await Promise.allSettled(
        [...cloudinaryIds].map((publicId) => cloudinary.uploader.destroy(publicId))
      );
      results.forEach((result) => {
        if (result.status === "rejected") {
          console.error("Cloudinary image removal failed:", result.reason?.message);
        }
      });
    }

    return res.json({ success: true, product, deletedImages: removedImages.length + Number(deleteLegacyImage) });
  } catch (error) {
    console.error("Delete product image error:", error);
    return res.status(500).json({ success: false, message: "Unable to remove product image." });
  }
};

// Delete merchandise
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: "Product deleted successfully"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Unable to delete product"
    });
  }
};

// Get products for the admin
exports.getAdminProducts = async (req, res) => {
  try {
    const products = await Product.find();

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve admin products"
    });
  }
};

//bulk deletion of producs
exports.bulkDeleteProducts = async (req, res) => {
  try {
    const { ids } = req.body;

    // Validate the submitted IDs.
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one product.",
      });
    }

    if (
      !ids.every(
        (id) =>
          typeof id === "string" &&
          mongoose.isValidObjectId(id)
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "One or more product IDs are invalid.",
      });
    }

    // Remove duplicate IDs before deleting.
    const uniqueIds = [...new Set(ids)];

    const result = await Product.deleteMany({
      _id: { $in: uniqueIds },
    });

    return res.status(200).json({
      success: true,
      message: `${result.deletedCount} product(s) deleted successfully.`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Bulk delete products error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete selected products.",
    });
  }
};
