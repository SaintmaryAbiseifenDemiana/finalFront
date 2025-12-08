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
    <div className="container">
      <h1>لوحة تحكم سكرتارية مارمينا وابي سيفين (Admin)</h1>
      <p>مرحباً بك يا مشرف النظام. يمكنك من هنا إدارة البيانات الرئيسية للنظام.</p>

      <h2>الميزات الرئيسية:</h2>
     <div class="admin-grid">
  <a href="/ManageFamilies" class="admin-card">
    <div class="admin-icon">📁</div>
    <div class="admin-label">إدارة الأسر</div>
  </a>

  <a href="/ManageUsers" class="admin-card">
    <div class="admin-icon">👤</div>
    <div class="admin-label">الخدام والأمناء</div>
  </a>

  <a href="/ManageServiced" class="admin-card">
    <div class="admin-icon">🧒</div>
    <div class="admin-label">المخدومين</div>
  </a>

  <a href="/ViewReports" class="admin-card">
    <div class="admin-icon">📊</div>
    <div class="admin-label">تقارير الحضور</div>
  </a>

  <a href="/MonthlyReports" class="admin-card">
    <div class="admin-icon">📅</div>
    <div class="admin-label">نسبة الخدام</div>
  </a>

  <a href="/MonthlyServiced" class="admin-card">
    <div class="admin-icon">📈</div>
    <div class="admin-label">نسبة المخدومين</div>
  </a>
</div>



      <ul className="dashboard-list">
        <li><a href="/ImportServants">📥 استيراد بيانات الخدام دفعة واحدة</a></li>
      </ul>

      <button onClick={handleLogout}>تسجيل الخروج</button>
    </div>
  );
}

export default AdminDashboard;
