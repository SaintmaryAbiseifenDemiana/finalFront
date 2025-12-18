import React, { useState } from "react";
import { API_BASE } from "../config";
import "./styles.css";

function FollowClassesAbsence() {
  const [month, setMonth] = useState("");
  const [friday, setFriday] = useState("");
  const [fridays, setFridays] = useState([]);
  const [results, setResults] = useState([]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const familyId = user.family_id;

  function getFridaysForMonth(month) {
    const year = ["10", "11", "12"].includes(month) ? 2025 : 2026;
    const fridays = [];
    const start = new Date(`${year}-${month}-01`);

    for (let d = new Date(start); d.getMonth() === start.getMonth(); d.setDate(d.getDate() + 1)) {
      if (d.getDay() === 5) fridays.push(d.toISOString().split("T")[0]);
    }

    return fridays;
  }

  function handleMonthChange(value) {
    setMonth(value);
    setFridays(getFridaysForMonth(value));
    setFriday("");
  }

  async function loadStatus() {
    if (!month || !friday) {
      alert("اختر الشهر والجمعة");
      return;
    }

    const res = await fetch(
      `${API_BASE}/api/serviced/classes-submission-status?family_id=${familyId}&date=${friday}`
    );

    const data = await res.json();
    if (data.success) setResults(data.classes);
  }

  return (
    <div className="container">
      <h1>✅ متابعة غياب الفصول</h1>

      <div className="report-controls">
        <label>اختر الشهر:</label>
        <select value={month} onChange={(e) => handleMonthChange(e.target.value)}>
          <option value="">-- اختر الشهر --</option>
          <option value="10">أكتوبر</option>
          <option value="11">نوفمبر</option>
          <option value="12">ديسمبر</option>
          <option value="1">يناير</option>
          <option value="2">فبراير</option>
          <option value="3">مارس</option>
          <option value="4">أبريل</option>
          <option value="5">مايو</option>
          <option value="6">يونيو</option>
          <option value="7">يوليو</option>
          <option value="8">أغسطس</option>
          <option value="9">سبتمبر</option>
        </select>

        <label>اختر الجمعة:</label>
        <select value={friday} onChange={(e) => setFriday(e.target.value)}>
          <option value="">-- اختر الجمعة --</option>
          {fridays.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        <button onClick={loadStatus}>عرض</button>
      </div>

      <table className="report-table" style={{ marginTop: "20px" }}>
        <thead>
          <tr>
            <th>اسم الفصل</th>
            <th>سجّل الغياب؟</th>
          </tr>
        </thead>
        <tbody>
          {results.length > 0 ? (
            results.map((c) => (
              <tr key={c.class_id}>
                <td>{c.class_name}</td>
                <td>{c.submitted ? "✅" : "❌"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="2">لا توجد بيانات</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default FollowClassesAbsence;
