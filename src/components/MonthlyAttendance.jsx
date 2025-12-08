import React, { useEffect } from "react";
import "../styles.css";
import { API_BASE } from "../config";

function MonthlyAttendance() {
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = user.role?.trim().toLowerCase();
    const forcedFamilyId = new URLSearchParams(window.location.search).get("family_id");
    const familyIdToUse = forcedFamilyId || user.family_id;

    const familySelect = document.getElementById("family_select");
    const familyLabel = document.getElementById("family_label");

    // ✅ لو الأمين داخل → نخفي dropdown ونكتب اسم أسرته
    if (role === "ameensekra") {
      if (familySelect) familySelect.style.display = "none";
      if (familyLabel) familyLabel.textContent = `أسرتك: ${user.family_name}`;
    }

    loadFamilies();

    const monthSelect = document.getElementById("month_select");
    const fridaySelect = document.getElementById("friday_select");
    const form = document.getElementById("monthlyAttendanceForm");

    let currentServants = [];
    let isLoading = false;

    function resetForm() {
      document.getElementById("servantsTableBody").innerHTML = "";
      const msg = document.getElementById("resultMessage");
      msg.textContent = "";
      msg.style.color = "";
      currentServants = [];
    }

    async function loadFamilies() {
      if (role === "ameensekra") return;

      try {
        const response = await fetch(`${API_BASE}/api/families`);
        const data = await response.json();
        const select = document.getElementById("family_select");

        if (data.success) {
          select.innerHTML = '<option value="">-- اختار الأسرة --</option>';
          data.families.forEach((family) => {
            const option = document.createElement("option");
            option.value = family.family_id;
            option.textContent = family.family_name;
            select.appendChild(option);
          });
        }
      } catch (err) {
        console.error("خطأ في تحميل الأسر:", err);
      }
    }

    function pad(n) {
      return n < 10 ? "0" + n : "" + n;
    }

    function formatDateLocal(date) {
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    function loadFridaysForMonth() {
      const monthValue = document.getElementById("month_select").value;
      const fridaySelect = document.getElementById("friday_select");
      fridaySelect.innerHTML = '<option value="">-- اختار جمعة --</option>';

      if (!monthValue) return;

      const monthIndex = parseInt(monthValue) - 1;
      let year = ["10", "11", "12"].includes(monthValue) ? 2025 : 2026;
      let date = new Date(year, monthIndex, 1);

      while (date.getDay() !== 5) date.setDate(date.getDate() + 1);

      while (date.getMonth() === monthIndex) {
        const localStr = formatDateLocal(date);
        fridaySelect.innerHTML += `<option value="${localStr}">${localStr}</option>`;
        date.setDate(date.getDate() + 7);
      }
    }

    async function loadServants() {
      if (isLoading) return;
      isLoading = true;

      const fridayDate = document.getElementById("friday_select").value;
      const tableBody = document.getElementById("servantsTableBody");

      tableBody.innerHTML = "";
      currentServants = [];

      if (!familyIdToUse || !fridayDate) {
        isLoading = false;
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/users?family_id=${familyIdToUse}`);
        const data = await response.json();

        if (data.success && data.users.length > 0) {
          currentServants = data.users;

          data.users.forEach((user, index) => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = index + 1;
            row.insertCell().textContent = user.username;

            row.insertCell().innerHTML = `<input type="checkbox" id="meeting-${user.user_id}">`;
            row.insertCell().innerHTML = `<input type="checkbox" id="lesson-${user.user_id}">`;
            row.insertCell().innerHTML = `<input type="checkbox" id="communion-${user.user_id}">`;
            row.insertCell().innerHTML = `<input type="checkbox" id="confession-${user.user_id}">`;

            row.insertCell().innerHTML = `<input type="number" id="total-${user.user_id}" value="${user.serviced_count}" readonly>`;
            row.insertCell().innerHTML = `<input type="number" id="visited-${user.user_id}" value="0">`;
          });

          // ✅ GET الجديد
          const oldRes = await fetch(
            `${API_BASE}/api/monthly-attendance-get?date=${fridayDate}&family_id=${familyIdToUse}`
          );
          const oldData = await oldRes.json();

          if (oldData.success && Array.isArray(oldData.records)) {
            oldData.records.forEach((r) => {
              document.getElementById(`meeting-${r.user_id}`).checked = !!r.meeting;
              document.getElementById(`lesson-${r.user_id}`).checked = !!r.lesson;
              document.getElementById(`communion-${r.user_id}`).checked = !!r.communion;
              document.getElementById(`confession-${r.user_id}`).checked = !!r.confession;
              document.getElementById(`visited-${r.user_id}`).value = r.visited_serviced || 0;
            });
          }
        }
      } catch (err) {
        console.error("خطأ في تحميل الخدام:", err);
      }

      isLoading = false;
    }

    async function saveMonthlyAttendance(e) {
      e.preventDefault();

      const date = document.getElementById("friday_select").value;
      const resultMessage = document.getElementById("resultMessage");

      if (!date) {
        resultMessage.textContent = "❌ لازم تختار الشهر والجمعة";
        resultMessage.style.color = "red";
        return;
      }

      if (currentServants.length === 0) {
        resultMessage.textContent = "❌ لا يوجد خدام لهذه الأسرة";
        resultMessage.style.color = "red";
        return;
      }

      const records = currentServants.map((s) => ({
        user_id: s.user_id,
        meeting: document.getElementById(`meeting-${s.user_id}`).checked,
        lesson: document.getElementById(`lesson-${s.user_id}`).checked,
        communion: document.getElementById(`communion-${s.user_id}`).checked,
        confession: document.getElementById(`confession-${s.user_id}`).checked,
        total_serviced: parseInt(document.getElementById(`total-${s.user_id}`).value),
        visited_serviced: parseInt(document.getElementById(`visited-${s.user_id}`).value),
      }));

      try {
        const response = await fetch(`${API_BASE}/api/monthly-attendance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, family_id: familyIdToUse, records }),
        });

        const data = await response.json();

        resultMessage.textContent = data.success
          ? "✅ تم حفظ السجل الشهري بنجاح"
          : "❌ فشل الحفظ: " + data.message;

        resultMessage.style.color = data.success ? "green" : "red";
      } catch {
        resultMessage.textContent = "❌ خطأ في الاتصال بالخادم";
        resultMessage.style.color = "red";
      }
    }

    monthSelect.addEventListener("change", () => {
      resetForm();
      loadFridaysForMonth();
    });

    fridaySelect.addEventListener("change", () => {
      resetForm();
      loadServants();
    });

    form.addEventListener("submit", saveMonthlyAttendance);

    return () => {
      monthSelect.removeEventListener("change", loadFridaysForMonth);
      fridaySelect.removeEventListener("change", loadServants);
      form.removeEventListener("submit", saveMonthlyAttendance);
    };
  }, []);

  return (
    <div className="container">
      <h1>تسجيل الغياب الشهري للخدام</h1>
      <a href="/AmeenDashboard" className="btn btn-secondary">العودة للوحة الأمين</a>
      <hr />

      <p id="family_label" style={{ fontWeight: "bold", color: "darkblue" }}></p>

      <div className="report-controls">
        <label>اختر الشهر:</label>
        <select id="month_select">
          <option value="">-- اختار الشهر --</option>
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
        <select id="friday_select">
          <option value="">-- اختار جمعة --</option>
        </select>

        <label id="family_label_title">اختر الأسرة:</label>
        <select id="family_select">
          <option value="">-- اختار الأسرة --</option>
        </select>
      </div>

      <form id="monthlyAttendanceForm">
        <table className="family-table">
          <thead>
            <tr>
              <th>م</th>
              <th>اسم الخادم</th>
              <th>حضور</th>
              <th>تحضير</th>
              <th>قداس</th>
              <th>اعتراف</th>
              <th>عدد المخدومين</th>
              <th>افتقاد (بيت فقط)</th>
            </tr>
          </thead>
          <tbody id="servantsTableBody"></tbody>
        </table>

        <button type="submit" style={{ marginTop: "15px" }}>
          حفظ السجل الشهري
        </button>
      </form>

      <p id="resultMessage" style={{ marginTop: "15px", fontWeight: "bold" }}></p>
    </div>
  );
}

export default MonthlyAttendance;
