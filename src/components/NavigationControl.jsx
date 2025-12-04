import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function NavigationControl() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handlePopState = () => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      // ✅ لو مفيش مستخدم → رجّعيه للّوجن
      if (!user.role) {
        navigate("/login", { replace: true });
        return;
      }

      // ✅ لو المستخدم حاول يرجع لصفحة قبل تسجيل الدخول
      if (location.pathname !== "/login") {
        navigate(location.pathname, { replace: true });
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [location.pathname, navigate]);

  return null;
}

export default NavigationControl;
