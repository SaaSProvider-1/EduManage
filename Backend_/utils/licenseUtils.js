const crypto = require("crypto");

function generateLicenseKey() {
  return crypto.randomBytes(16).toString("hex"); // 32 chars hex
}

module.exports = generateLicenseKey;