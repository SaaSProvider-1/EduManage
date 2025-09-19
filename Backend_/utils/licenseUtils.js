const crypto = require('crypto');

/**
 * Generate a secure 64-bit license key
 * @returns {string} A 64-character hexadecimal license key
 */
const generateLicenseKey = () => {
    // Generate 32 bytes (256 bits) of random data, then take first 32 chars (64 bits in hex)
    const randomBytes = crypto.randomBytes(32);
    const licenseKey = randomBytes.toString('hex').substring(0, 64).toUpperCase();
    
    // Format as: XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX for better readability
    const formattedKey = licenseKey.match(/.{1,8}/g).join('-');
    
    return formattedKey;
};

/**
 * Validate license key format
 * @param {string} licenseKey 
 * @returns {boolean}
 */
const validateLicenseKeyFormat = (licenseKey) => {
    // Check if it matches the format: 8 groups of 8 characters separated by hyphens
    const licenseKeyRegex = /^[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}-[A-F0-9]{8}$/;
    return licenseKeyRegex.test(licenseKey);
};

/**
 * Generate a simple license key without hyphens (for database storage)
 * @returns {string} A 64-character hexadecimal license key without hyphens
 */
const generateSimpleLicenseKey = () => {
    const randomBytes = crypto.randomBytes(32);
    return randomBytes.toString('hex').substring(0, 64).toUpperCase();
};

module.exports = {
    generateLicenseKey,
    generateSimpleLicenseKey,
    validateLicenseKeyFormat
};