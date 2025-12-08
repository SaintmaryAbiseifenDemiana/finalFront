import React, { useEffect } from "react";
import "./styles.css";

function AdminDashboard() {
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    // ✅ لو مش Admin → يرجّعه للّوجن
    if (!user.role || user.role.trim().toLowerCase() !== "admin") {
      window.location.href = "/login";
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <>
      {/* ✅ فيديو الخلفية */}
      <video autoPlay muted loop playsInline id="loginVideo">
        <source src="/login-bg.mp4" type="video/mp4" />
      </video>

      <div className="admin-container">
        <h1>لوحة تحكم سكرتارية مارمينا وابي سيفين (Admin)</h1>
        <p>مرحباً بك يا مشرف النظام. يمكنك من هنا إدارة البيانات الرئيسية للنظام.</p>

        <h2>الميزات الرئيسية:</h2>

        <div className="admin-apps">
          <a href="/ManageFamilies" className="app-icon">
            <div>📁</div>
            <span>الأسر</span>
          </a>

          <a href="/ManageUsers" className="app-icon">
            <div>👤</div>
            <span>الخدام</span>
          </a>

          <a href="/ManageServiced" className="app-icon">
            <div>🧒</div>
            <span>المخدومين</span>
          </a>

          <a href="/ViewReports" className="app-icon">
            <div>📊</div>
            <span>تقارير</span>
          </a>

          <a href="/MonthlyReports" className="app-icon">
            <div>📅</div>
            <span>نسبة الخدام</span>
          </a>

          <a href="/MonthlyServiced" className="app-icon">
            <div>📈</div>
            <span>نسبة المخدومين</span>
          </a>
        </div>

        <ul className="dashboard-list">
          <li>
            <a href="/ImportServants">📥 استيراد بيانات الخدام دفعة واحدة</a>
          </li>
        </ul>

        <button onClick={handleLogout}>تسجيل الخروج</button>
      </div>
    </>
  );
}

export default AdminDashboard;
