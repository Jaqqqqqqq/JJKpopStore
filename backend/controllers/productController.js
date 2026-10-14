
const mongoose = require("mongoose");
const Product = require("../models/product");
const {
  uploadProductImage,
} = require("../utils/uploadProductImages");

// Get all K-pop merchandise
exports.getProducts = async (req, res) => {
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

// Add new K-pop merchandise

exports.newProduct = async (req, res) => {
  const uploadedImages = [];

  try {
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

    const files = req.files || [];

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

    return res.status(200).json({
      success: true,
      product,
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