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
      <ul>
        <li><a href="/ManageFamilies">إدارة الأسر (إضافة/تعديل/حذف)</a></li>
        <li><a href="/ManageUsers">إدارة الخدام والأمناء</a></li>
        <li><a href="/ManageServiced">إدارة المخدومين</a></li>
        <li><a href="/ViewReports">عرض تقارير الحضور والغياب (اسبوعيا)</a></li>
        <li><a href="/MonthlyReports">النسبة الشهرية للخدام</a></li>
        <li><a href="/MonthlyServiced">النسبة الشهرية للمخدومين</a></li>
      </ul>

      <ul className="dashboard-list">
        <li><a href="/ImportServants">📥 استيراد بيانات الخدام دفعة واحدة</a></li>
      </ul>

      <button onClick={handleLogout}>تسجيل الخروج</button>
    </div>
  );
}

export default AdminDashboard;
