const Cloudinary = require("cloudinary").v2;

Cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API,
  api_secret: process.env.CLOUD_SECRET_KEY,
});

module.exports = Cloudinary;