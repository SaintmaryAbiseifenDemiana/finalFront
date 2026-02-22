import React, { useState, useEffect } from "react";
import { API_BASE } from "../config";

function AdminSecretaryFollowup() {
  const [month, setMonth] = useState("");
  const [families, setFamilies] = useState([]);

  useEffect(() => {
    if (!month) return;

    async function loadSummary() {
      try {
        const res = await fetch(`${API_BASE}/api/monthly-attendance-summary?month=${month}`);
        const data = await res.json();
        if (data.success) setFamilies(data.families);
      } catch (err) {
        console.error("خطأ في تحميل الملخص:", err);
      }
    }

    loadSummary();
  }, [month]);

  return (
    <div className="admin-container">
      <h2>متابعة السكرتارية</h2>

      <div className="form-group">
        <label>اختر الشهر:</label>
        <select value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="">-- اختار الشهر --</option>
          <option value="1">يناير</option>
          <option value="2">فبراير</option>
          <option value="3">مارس</option>
          <option value="4">أبريل</option>
          <option value="5">مايو</option>
          <option value="6">يونيو</option>
          <option value="7">يوليو</option>
          <option value="8">أغسطس</option>
          <option value="9">سبتمبر</option>
          <option value="10">أكتوبر</option>
          <option value="11">نوفمبر</option>
          <option value="12">ديسمبر</option>
        </select>
      </div>

      {families
        .filter(family => family.family_name !== "غير مسؤول عن أسرة")
        .map((family, idx) => (
            <div key={idx} className="family-table">
              <h3 style={{ color: "white", backgroundColor: "#333", padding: "8px", borderRadius: "4px" }}>
               {family.family_name}
              </h3>
              <table>
                 <thead>
                  <tr>
                     <th>التاريخ</th>
                     <th>تم التسجيل</th>
                  </tr>
                 </thead>
              <tbody>
                {family.records.map((rec, i) => (
            <tr key={i}>
              <td>{rec.date ? rec.date.split("T")[0] : "-"}</td>
              <td>{rec.submitted ? "✔️" : "❌"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
))}

    </div>
  );
}

export default AdminSecretaryFollowup;
