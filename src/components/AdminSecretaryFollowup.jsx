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
      <h2 style={{ color: "white", backgroundColor: "#333", padding: "8px", borderRadius: "4px" }}>
        متابعة السكرتارية
      </h2>

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

      <table>
        <thead>
          <tr>
            <th>اليوم</th>
            {families
              .filter(family => family.family_name !== "غير مسؤول عن اسره")
              .map((family, idx) => (
                <th key={idx}>{family.family_name}</th>
              ))}
          </tr>
        </thead>
        <tbody>
          {(() => {
            const allDates = new Set();
            families.forEach(family => {
              family.records.forEach(rec => {
                if (rec.date) {
                  allDates.add(new Date(rec.date).getDate());
                }
              });
            });

            return Array.from(allDates).sort((a, b) => a - b).map(day => (
              <tr key={day}>
                <td>يوم {day}</td>
                {families
                  .filter(family => family.family_name !== "غير مسؤول عن اسره")
                  .map((family, idx) => {
                    const rec = family.records.find(r => r.date && new Date(r.date).getDate() === day);
                    return (
                      <td key={idx}>{rec ? (rec.submitted ? "✔️" : "❌") : "-"}</td>
                    );
                  })}
              </tr>
            ));
          })()}
        </tbody>
      </table>
    </div>
  );
}

export default AdminSecretaryFollowup;
