import React, { useEffect } from "react";
import "./styles.css";

function AmeenDashboard() {
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = user.role ? user.role.trim().toLowerCase() : "";

    // ✅ السماح فقط للأمين أو السكرتارية
    if (!["ameensekra", "amin"].includes(role)) {
      window.location.href = "/login";
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user.role ? user.role.trim().toLowerCase() : "";
  const familyId = user.family_id;
  const familyName = user.family_name;

  return (
    <div className="container">
      <h1>لوحة أمين الخدمة و السكرتارية</h1>

      {role === "ameensekra" && (
        <p style={{ fontWeight: "bold", fontSize: "18px", color: "#444" }}>
          ✅ أسرتك: <span style={{ color: "darkblue" }}>{familyName}</span>
        </p>
      )}

      <p>مرحباً بك أيها الأمين. يمكنك من هنا تسجيل حضور وغياب الأسر التابعة لك.</p>

      <h2>الميزات الرئيسية:</h2>
      <ul>
        <li>
          {role === "ameensekra" ? (
            <a href={`/RecordAttendance?family_id=${familyId}`}>
              تسجيل حضور وغياب الأسر (أسبوعيا)
            </a>
          ) : (
            <a href="/RecordAttendance">تسجيل حضور وغياب الأسر (أسبوعيا)</a>
          )}
        </li>

        <li>
          {role === "ameensekra" ? (
            <a href={`/MonthlyAttendance?family_id=${familyId}`}>
              تسجيل الغياب الشهري للخدام
            </a>
          ) : (
            <a href="/MonthlyAttendance">تسجيل الغياب الشهري للخدام</a>
          )}
        </li>
      </ul>

      <button id="logoutBtn" className="btn btn-danger" onClick={handleLogout}>
        تسجيل الخروج
      </button>
    </div>
  );
}

export default AmeenDashboard;
