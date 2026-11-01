const Category = require("../models/category");
const Product = require("../models/product");

const cleanName = (value) => String(value || "").trim();

async function syncProductCategories() {
  const productCategories = await Product.distinct("category");
  const savedCategories = await Category.find().select("name").lean();
  const existingNames = new Set(savedCategories.map(({ name }) => name.toLocaleLowerCase()));
  const missingNames = new Map();
  productCategories.forEach((name) => {
    const trimmed = String(name || "").trim();
    const key = trimmed.toLocaleLowerCase();
    if (trimmed && !existingNames.has(key)) missingNames.set(key, trimmed);
  });
  const missing = [...missingNames.values()].map((name) => ({ name }));
  if (missing.length) await Category.insertMany(missing, { ordered: false });
}

exports.getCategories = async (_req, res) => {
  try {
    await syncProductCategories();
    const categories = await Category.find().sort({ name: 1 }).lean();
    return res.json({ success: true, categories });
  } catch (error) {
    console.error("Get categories error:", error);
    return res.status(500).json({ success: false, message: "Unable to load categories." });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const name = cleanName(req.body.name);
    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({ success: false, message: "Category name must be between 2 and 50 characters." });
    }
    const existing = await Category.find();
    if (existing.some((category) => category.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      return res.status(409).json({ success: false, message: "That category already exists." });
    }
    const category = await Category.create({ name });
    return res.status(201).json({ success: true, category });
  } catch (error) {
    console.error("Create category error:", error);
    return res.status(500).json({ success: false, message: "Unable to create category." });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const name = cleanName(req.body.name);
    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({ success: false, message: "Category name must be between 2 and 50 characters." });
    }
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found." });

    const existing = await Category.find({ _id: { $ne: category._id } });
    if (existing.some((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      return res.status(409).json({ success: false, message: "That category already exists." });
    }

    const oldName = category.name;
    if (oldName !== name) {
      await Product.updateMany({ category: oldName }, { $set: { category: name } });
      category.name = name;
      await category.save();
    }
    return res.json({ success: true, category });
  } catch (error) {
    console.error("Update category error:", error);
    return res.status(500).json({ success: false, message: "Unable to update category." });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found." });
    const productCount = await Product.countDocuments({ category: category.name });
    if (productCount) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete this category while ${productCount} product(s) use it. Edit those products first.`,
      });
    }
    await category.deleteOne();
    return res.json({ success: true, message: "Category deleted." });
  } catch (error) {
    console.error("Delete category error:", error);
    return res.status(500).json({ success: false, message: "Unable to delete category." });
  }
};

exports.syncProductCategories = syncProductCategories;
