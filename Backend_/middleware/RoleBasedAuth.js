const verifyToken = require("./Auth");

function StudentAuth(req, res, next) {
  const result = verifyToken(req, res);
  if (!result.valid)
    return res.status(result.response.status).json(result.response.json);

  if (result.decode.role !== "student") {
    return res.status(403).json({
      success: false,
      message: "Access denied: Students only",
    });
  }

  req.user = result.decode;
  next();
}

function TeacherAuth(req, res, next) {
  const result = verifyToken(req, res);
  if (!result.valid) return res.status(result.response.status).json(result.response.json);

  if (result.decode.role !== "teacher") {
    return res.status(403).json({
      success: false,
      message: "Access denied: Teachers only",
    });
  }

  req.user = result.decode;
  next();
}

function AdminAuth(req, res, next) {
  const result = verifyToken(req, res);
  if (!result.valid) return res.status(result.response.status).json(result.response.json);

  if (result.decode.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied: Admins only",
    });
  }

  req.user = result.decode;
  next();
}

module.exports = { StudentAuth, TeacherAuth, AdminAuth };
