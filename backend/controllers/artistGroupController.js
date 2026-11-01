const ArtistGroup = require("../models/artistGroup");
const Product = require("../models/product");

exports.getArtistGroups = async (_req, res) => {
  try {
    const productArtists = await Product.distinct("artist");
    const savedGroups = await ArtistGroup.find().select("name").lean();
    const savedNames = new Set(savedGroups.map(({ name }) => name.toLocaleLowerCase()));
    const missingNames = new Map();
    productArtists.forEach((name) => {
      const trimmed = String(name || "").trim();
      const key = trimmed.toLocaleLowerCase();
      if (trimmed && !savedNames.has(key)) missingNames.set(key, trimmed);
    });
    const missing = [...missingNames.values()].map((name) => ({ name }));
    if (missing.length) await ArtistGroup.insertMany(missing, { ordered: false });
    const artists = await ArtistGroup.find().sort({ name: 1 }).lean();

    return res.json({
      success: true,
      artists,
    });
  } catch (error) {
    console.error("Get artist groups error:", error);
    return res.status(500).json({ success: false, message: "Unable to load artist / group list." });
  }
};

exports.createArtistGroup = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({
        success: false,
        message: "Artist / group name must be between 2 and 80 characters.",
      });
    }

    const [savedGroups, existingProductArtists] = await Promise.all([
      ArtistGroup.find().select("name").lean(), Product.distinct("artist"),
    ]);
    const normalizedName = name.toLocaleLowerCase();
    const alreadyUsed = [...savedGroups.map((group) => group.name), ...existingProductArtists].some(
      (artist) => artist.trim().toLocaleLowerCase() === normalizedName
    );

    if (alreadyUsed) {
      return res.status(409).json({ success: false, message: "That artist / group is already listed." });
    }

    const artist = await ArtistGroup.create({ name });
    return res.status(201).json({ success: true, artist });
  } catch (error) {
    console.error("Create artist group error:", error);
    return res.status(500).json({ success: false, message: "Unable to add artist / group." });
  }
};

exports.updateArtistGroup = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (name.length < 2 || name.length > 80) {
      return res.status(400).json({ success: false, message: "Artist / group name must be between 2 and 80 characters." });
    }
    const artist = await ArtistGroup.findById(req.params.id);
    if (!artist) return res.status(404).json({ success: false, message: "Artist / group not found." });
    const existing = await ArtistGroup.find({ _id: { $ne: artist._id } }).select("name").lean();
    if (existing.some((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      return res.status(409).json({ success: false, message: "That artist / group already exists." });
    }
    if (artist.name !== name) {
      await Product.updateMany({ artist: artist.name }, { $set: { artist: name } });
      artist.name = name;
      await artist.save();
    }
    return res.json({ success: true, artist });
  } catch (error) {
    console.error("Update artist group error:", error);
    return res.status(500).json({ success: false, message: "Unable to update artist / group." });
  }
};

exports.deleteArtistGroup = async (req, res) => {
  try {
    const artist = await ArtistGroup.findById(req.params.id);
    if (!artist) return res.status(404).json({ success: false, message: "Artist / group not found." });
    const productCount = await Product.countDocuments({ artist: artist.name });
    if (productCount) {
      return res.status(409).json({
        success: false,
        message: `Cannot delete this artist / group while ${productCount} product(s) use it. Edit those products first.`,
      });
    }
    await artist.deleteOne();
    return res.json({ success: true, message: "Artist / group deleted." });
  } catch (error) {
    console.error("Delete artist group error:", error);
    return res.status(500).json({ success: false, message: "Unable to delete artist / group." });
  }
};
