import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectRoute({ allowedRoles }) {
  const location = useLocation();
  const token = localStorage.getItem("Token");
  const user = JSON.parse(localStorage.getItem("User"));
  const userType = localStorage.getItem("UserType");

  if (!token || !user) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location,
          showToast: "You must be logged in to access this page.",
        }}
        replace
      />
    );
  }

  if (allowedRoles && !allowedRoles.includes(userType)) {
    return (
      <Navigate
        to="/login"
        state={{ from: location, showToast: "Unauthorized: Access denied." }}
        replace
      />
    );
  }

  return <Outlet />;
}
