const jwt = require("jsonwebtoken");

function verifyToken(req, res) {
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return {
      valid: false,
      response: {
        status: 401,
        json: { success: false, message: "No token, Auth denied" },
      },
    };
  }

  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    return { valid: true, decode };
  } catch (error) {
    return {
      valid: false,
      response: {
        status: 401,
        json: { success: false, message: "Invalid Token" },
      },
    };
  }
}

module.exports = verifyToken;
