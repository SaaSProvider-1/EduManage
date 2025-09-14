const Multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./Cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "My-uploads",
    allowed_formats: ["jpg", "jpeg", "png", "pdf"],
  },
});

const upload = Multer({ storage });
module.exports = upload;