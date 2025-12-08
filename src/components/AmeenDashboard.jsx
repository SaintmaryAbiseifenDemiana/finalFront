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
  <>
    {/* ✅ فيديو الخلفية */}
    <video autoPlay muted loop playsInline id="loginVideo">
      <source src="/login-bg.mp4" type="video/mp4" />
    </video>

    <div className="admin-container">
      <h1>لوحة أمين الخدمة و السكرتارية</h1>

      {role === "ameensekra" && (
        <p style={{ fontWeight: "bold", fontSize: "18px", color: "#fff" }}>
          ✅ أسرتك: <span style={{ color: "#d0e1ff" }}>{familyName}</span>
        </p>
      )}

      <div className="admin-apps">

        {/* ✅ تسجيل حضور أسبوعي */}
        {role === "ameensekra" ? (
          <a href={`/RecordAttendance?family_id=${familyId}`} className="app-icon">
            <div>📝</div>
            <span>الحضور الأسبوعي</span>
          </a>
        ) : (
          <a href="/RecordAttendance" className="app-icon">
            <div>📝</div>
            <span>الحضور الأسبوعي</span>
          </a>
        )}

        {/* ✅ الغياب الشهري */}
        {role === "ameensekra" ? (
          <a href={`/MonthlyAttendance?family_id=${familyId}`} className="app-icon">
            <div>📅</div>
            <span>الغياب الشهري</span>
          </a>
        ) : (
          <a href="/MonthlyAttendance" className="app-icon">
            <div>📅</div>
            <span>الغياب الشهري</span>
          </a>
        )}

      </div>

      <button onClick={handleLogout} className="logout-btn">
        تسجيل الخروج
      </button>
    </div>
  </>
);

}

export default AmeenDashboard;
