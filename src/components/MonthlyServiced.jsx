import React, { useEffect } from "react";
import "../styles.css";
import { API_BASE } from "../config";

function MonthlyServiced() {

  // ✅ دالة لتوحيد صيغة التاريخ
  function normalizeDate(value) {
    if (!value) return null;
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split("T")[0]; // YYYY-MM-DD
  }

  useEffect(() => {
    loadFamilies();

    document.getElementById("loadMonthlyBtn")?.addEventListener("click", loadMonthlyReport);
    document.getElementById("loadYearlyBtn")?.addEventListener("click", loadYearlyReport);
  }, []);

  function countFridaysInMonth(monthStr, yearNum) {
    const month = parseInt(monthStr, 10) - 1;
    const date = new Date(yearNum, month, 1);
    let fridays = 0;

    while (date.getMonth() === month) {
      if (date.getDay() === 5) fridays++;
      date.setDate(date.getDate() + 1);
    }
    return fridays;
  }

  // ✅ تحميل الأسر
  async function loadFamilies() {
    const select = document.getElementById("familySelect");
    select.innerHTML = "<option value=''>-- جاري تحميل الأسر... --</option>";
    select.disabled = true;

    try {
      const response = await fetch(`${API_BASE}/api/families`);
      const data = await response.json();

      select.innerHTML = "<option value=''>-- اختر الأسرة --</option>";

      if (data.success && data.families.length > 0) {
        data.families.forEach((f) => {
          const option = new Option(f.family_name, f.family_id);
          select.add(option);
        });
      } else {
        select.innerHTML = "<option value=''>⚠️ لا توجد أسر مسجلة</option>";
      }

      select.disabled = false;
    } catch (error) {
      console.error("Error loading families:", error);
      select.innerHTML = "<option value=''>⚠️ فشل تحميل الأسر</option>";
      select.disabled = false;
    }
  }

  // ✅ التقرير الشهري
  async function loadMonthlyReport() {
    const month = document.getElementById("monthSelect").value;
    const familyId = document.getElementById("familySelect").value;
    const blocksDiv = document.getElementById("servantsBlocks");
    const summaryBody = document.getElementById("familySummaryBody");
    const summaryTable = document.querySelector(".summary-table");

    if (!month || !familyId) {
      alert("اختر الشهر والأسرة أولاً.");
      return;
    }

    const response = await fetch(`${API_BASE}/api/admin/monthly-serviced/${month}/${familyId}`);
    const data = await response.json();

    summaryTable.style.display = "table";
    document.getElementById("monthlySummaryTitle").style.display = "block";

    blocksDiv.innerHTML = "";
    summaryBody.innerHTML = "";

    if (data.success && Array.isArray(data.serviced) && data.serviced.length > 0) {
      const firstDate = data.serviced.find((s) => s.sessions.length > 0)?.sessions[0]?.date;
      const year = firstDate ? parseInt(firstDate.slice(0, 4), 10) : new Date().getFullYear();

      const totalFridaysInMonth = countFridaysInMonth(month, year);

      const allDates = [...new Set(
        data.serviced.flatMap((s) =>
          Array.isArray(s.sessions) ? s.sessions.map((x) => normalizeDate(x.date)) : []
        )
      )].sort();

      let totalSessions = 0,
        totalPresent = 0,
        totalServiced = 0;

      const groupedByServant = {};
      data.serviced.forEach((s) => {
        if (!groupedByServant[s.servant_name]) groupedByServant[s.servant_name] = [];
        groupedByServant[s.servant_name].push(s);
      });

      const table = document.createElement("table");
      table.className = "table table-bordered";

      table.innerHTML = `
        <thead>
          <tr>
            <th class="servant-name">اسم الخادم</th>
            <th class="serviced-name">المخدوم</th>
            ${allDates.map((d, i) => {
              const shortDate = new Date(d).toLocaleDateString("ar-EG", {
                day: "2-digit",
                month: "2-digit"
              });
              return `<th class="month-col-${i}">${shortDate}</th>`;
            }).join("")}
            <th>النسبة الشهرية</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(groupedByServant)
            .map(([servantName, records]) =>
              records
                .map((s, index) => {
                  const presentCount = s.sessions.filter((x) => x.status === "Present").length;
                  const percentage =
                    totalFridaysInMonth > 0
                      ? Math.round((presentCount / totalFridaysInMonth) * 100)
                      : 0;

                  totalServiced++;
                  totalSessions += totalFridaysInMonth;
                  totalPresent += presentCount;

                  return `
                    <tr class="${index === 0 ? "servant-separator" : ""}">
                      ${index === 0 ? `<td class="servant-name" rowspan="${records.length}">${servantName}</td>` : ""}
                      <td class="serviced-name">${s.serviced_name}</td>

                      ${allDates
                        .map((d, i) => {
                          const session = s.sessions.find((x) => normalizeDate(x.date) === d);
                          return `<td class="month-col-${i}">${session ? (session.status === "Present" ? "1" : "0") : "-"}</td>`;
                        })
                        .join("")}
                      <td>${percentage}%</td>
                    </tr>
                  `;
                })
                .join("")
            )
            .join("")}
        </tbody>
      `;

      blocksDiv.appendChild(table);

      const familyPercentage =
        totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0;

      summaryBody.innerHTML = `
        <tr>
          <td>${totalServiced}</td>
          <td>${totalPresent}</td>
          <td>${totalSessions}</td>
          <td>${familyPercentage}%</td>
        </tr>
      `;
    } else {
      blocksDiv.innerHTML = "<p>⚠️ لا توجد بيانات لهذا الشهر.</p>";
    }
  }

  // ✅ التقرير السنوي (بدون تغيير)
  async function loadYearlyReport() {
    const familyId = document.getElementById("familySelect").value;
    const blocksDiv = document.getElementById("servantsBlocks");
    const summaryTable = document.querySelector(".summary-table");

    if (!familyId) {
      alert("اختر الأسرة أولاً.");
      return;
    }

    summaryTable.style.display = "none";
    document.getElementById("monthlySummaryTitle").style.display = "none";
    blocksDiv.innerHTML = "";

    const months = [
      { value: "10", label: "أكتوبر 2025", year: 2025 },
      { value: "11", label: "نوفمبر 2025", year: 2025 },
      { value: "12", label: "ديسمبر 2025", year: 2025 },
      { value: "01", label: "يناير 2026", year: 2026 },
      { value: "02", label: "فبراير 2026", year: 2026 },
      { value: "03", label: "مارس 2026", year: 2026 },
      { value: "04", label: "أبريل 2026", year: 2026 },
      { value: "05", label: "مايو 2026", year: 2026 },
      { value: "06", label: "يونيو 2026", year: 2026 },
      { value: "07", label: "يوليو 2026", year: 2026 },
      { value: "08", label: "أغسطس 2026", year: 2026 },
      { value: "09", label: "سبتمبر 2026", year: 2026 },
    ];

    const yearlyServiced = {};

    for (const m of months) {
      const fridaysInThisMonth = countFridaysInMonth(m.value, m.year);

      const response = await fetch(`${API_BASE}/api/admin/monthly-serviced/${m.value}/${familyId}`);
      const data = await response.json();

      if (data.success && Array.isArray(data.serviced)) {
        data.serviced.forEach((s) => {
          const presentCount = s.sessions.filter((x) => x.status === "Present").length;

          if (!yearlyServiced[s.servant_name]) yearlyServiced[s.servant_name] = [];

          let existing = yearlyServiced[s.servant_name].find(
            (x) => x.serviced_name === s.serviced_name
          );

          if (!existing) {
            existing = {
              serviced_name: s.serviced_name,
              monthly: {},
              totalPresent: 0,
            };
            yearlyServiced[s.servant_name].push(existing);
          }

          existing.monthly[m.label] = {
            present: presentCount,
            fridays: fridaysInThisMonth,
            percentage:
              fridaysInThisMonth > 0
                ? Math.round((presentCount / fridaysInThisMonth) * 100)
                : 0,
          };

          existing.totalPresent += presentCount;
        });
      }
    }

    const totalFridaysYear = months.reduce(
      (sum, m) => sum + countFridaysInMonth(m.value, m.year),
      0
    );

    const table = document.createElement("table");
    table.className = "table table-bordered";

    table.innerHTML = `
      <thead>
        <tr>
          <th class="servant-name">اسم الخادم</th>
          <th class="serviced-name">المخدوم</th>
          ${months.map((m) => `<th>${m.label}</th>`).join("")}
          <th>النسبة السنوية</th>
        </tr>
      </thead>
      <tbody>
        ${Object.entries(yearlyServiced)
          .map(([servantName, records]) =>
            records
              .map((s, index) => {
                const yearlyPercentage =
                  totalFridaysYear > 0
                    ? Math.round((s.totalPresent / totalFridaysYear) * 100)
                    : 0;

                return `
                  <tr class="${index === 0 ? "servant-separator" : ""}">
                    ${index === 0 ? `<td class="servant-name" rowspan="${records.length}">${servantName}</td>` : ""}
                    <td class="serviced-name">${s.serviced_name}</td>

                    ${months
                      .map((m, i) => {
                        const cell = s.monthly[m.label];
                        return `<td>${cell ? cell.percentage + "%" : "0%"}</td>`;
                      })
                      .join("")}
                    <td>${yearlyPercentage}%</td>
                  </tr>
                `;
              })
              .join("")
          )
          .join("")}
      </tbody>
    `;

    blocksDiv.appendChild(table);
  }

  return (
    <div className="container">
      <h1>📊 نسب حضور المخدومين</h1>
      <a href="/AdminDashboard" className="btn btn-secondary">العودة للوحة الإدارة</a>

      <div className="filters">
        <label>اختر الشهر:</label>
        <select id="monthSelect">
          <option value="">-- اختر الشهر --</option>
          <option value="01">يناير</option>
          <option value="02">فبراير</option>
          <option value="03">مارس</option>
          <option value="04">أبريل</option>
          <option value="05">مايو</option>
          <option value="06">يونيو</option>
          <option value="07">يوليو</option>
          <option value="08">أغسطس</option>
          <option value="09">سبتمبر</option>
          <option value="10">أكتوبر</option>
          <option value="11">نوفمبر</option>
          <option value="12">ديسمبر</option>
        </select>

        <label>اختر الأسرة:</label>
        <select id="familySelect">
          <option value="">-- جاري تحميل الأسر... --</option>
        </select>

        <button id="loadMonthlyBtn">عرض النسبة الشهرية</button>
        <button id="loadYearlyBtn">عرض النسبة السنوية</button>
      </div>

      <div id="servantsBlocks"></div>

      <h3 id="monthlySummaryTitle" style={{ display: "none" }}>
        📌 نسبة حضور الأسرة في الشهر
      </h3>

      <table className="table summary-table" style={{ display: "none" }}>
        <thead>
          <tr>
            <th>عدد المخدومين</th>
            <th>عدد مرات الحضور</th>
            <th>عدد الجمع</th>
            <th>النسبة الكلية</th>
          </tr>
        </thead>
        <tbody id="familySummaryBody"></tbody>
      </table>
    </div>
  );
}

export default MonthlyServiced;
