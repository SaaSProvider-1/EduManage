import crypto from 'crypto';

// Generate OTP
export const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  
  return otp;
};

// Generate secure OTP using crypto
export const generateSecureOTP = (length = 6) => {
  const max = Math.pow(10, length) - 1;
  const min = Math.pow(10, length - 1);
  
  const randomBytes = crypto.randomBytes(4);
  const randomNumber = randomBytes.readUInt32BE(0);
  const otp = (randomNumber % (max - min + 1)) + min;
  
  return otp.toString().padStart(length, '0');
};

// Verify OTP with timing-safe comparison
export const verifyOTP = (inputOTP, hashedOTP) => {
  const inputHash = crypto.createHash('sha256').update(inputOTP).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(hashedOTP));
};

// Generate OTP with expiry
export const generateOTPWithExpiry = (length = 6, expiryMinutes = 5) => {
  const otp = generateSecureOTP(length);
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
  
  return {
    otp,
    expiresAt,
    hash: crypto.createHash('sha256').update(otp).digest('hex')
  };
};

// Check if OTP is expired
export const isOTPExpired = (expiresAt) => {
  return new Date() > new Date(expiresAt);
};