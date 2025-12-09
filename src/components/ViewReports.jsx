import React, { useEffect } from "react";
import "../styles.css";
import { API_BASE } from "../config";

function ViewReports() {
  useEffect(() => {
    loadFamiliesDropdown();

    const filterBtn = document.getElementById("filter-btn");
    if (filterBtn) filterBtn.addEventListener("click", loadReport);

    return () => {
      if (filterBtn) filterBtn.removeEventListener("click", loadReport);
    };
  }, []);

  // ✅ تحميل الأسر
  async function loadFamiliesDropdown() {
    try {
      const response = await fetch(`${API_BASE}/api/families`);
      const data = await response.json();

      if (data.success && Array.isArray(data.families)) {
        const select = document.getElementById("report_family");
        select.innerHTML = '<option value="">-- كل الأسر --</option>';

        data.families.forEach((family) => {
          const option = document.createElement("option");
          option.value = family.family_id;
          option.textContent = family.family_name;
          select.appendChild(option);
        });
      }
    } catch (error) {
      console.error("❌ فشل تحميل قائمة الأسر:", error);
    }
  }

  // ✅ تحميل التقرير
  async function loadReport() {
    const monthFilter = document.getElementById("report_month").value;
    const familyFilter = document.getElementById("report_family").value;

    const loadingStatus = document.getElementById("loading-status");
    const errorMessage = document.getElementById("error-message");
    const thead = document.getElementById("reportTableHead");
    const tbody = document.getElementById("reportTableBody");

    thead.innerHTML = "";
    tbody.innerHTML = "";
    errorMessage.style.display = "none";
    loadingStatus.textContent = "جاري تحميل التقرير...";
    loadingStatus.style.display = "block";

    if (!monthFilter) {
      errorMessage.textContent = "❌ لازم تختاري الشهر";
      errorMessage.style.display = "block";
      loadingStatus.style.display = "none";
      return;
    }

    let apiUrl = `${API_BASE}/api/reports/attendance?month=${monthFilter}`;
    if (familyFilter) apiUrl += `&family_id=${familyFilter}`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      loadingStatus.style.display = "none";

      if (data.success) {
        if (data.report.length === 0) {
          loadingStatus.textContent = "لا توجد سجلات مطابقة.";
          loadingStatus.style.display = "block";
          return;
        }

        const fridaysRaw = Array.from(new Set(data.report.map((r) => r.session_date)));
        const fridaysSorted = fridaysRaw.sort((a, b) => new Date(a) - new Date(b));
        const fridaysDisplay = fridaysSorted.map((d) => formatDate(d));

        buildTableHeader(thead, fridaysDisplay);
        renderReportTable(data.report, fridaysSorted);

        if (data.summary) renderServantsCountTable(data.summary);
      } else {
        errorMessage.textContent = data.message;
        errorMessage.style.display = "block";
      }
    } catch (error) {
      console.error("Error loading report:", error);
      loadingStatus.style.display = "none";
      errorMessage.textContent = "فشل الاتصال بالخادم.";
      errorMessage.style.display = "block";
    }
  }

  // ✅ تنسيق التاريخ
  function formatDate(isoString) {
    const d = new Date(isoString);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${day}/${m}/${y}`;
  }

  // ✅ بناء رأس الجدول
  function buildTableHeader(thead, fridays) {
    const tr1 = document.createElement("tr");
    tr1.innerHTML = `
      <th rowspan="2">م</th>
      <th rowspan="2">الخادم</th>
      <th rowspan="2">الأسرة</th>
    `;

    fridays.forEach((date) => {
      const th = document.createElement("th");
      th.textContent = `جمعة ${date}`;
      th.colSpan = 3;
      tr1.appendChild(th);
    });

    const tr2 = document.createElement("tr");
    fridays.forEach(() => {
      tr2.innerHTML += `
        <th>الحالة</th>
        <th>سبب الغياب</th>
        <th>اعتذر؟</th>
      `;
    });

    thead.append(tr1, tr2);
  }

  // ✅ عرض بيانات التقرير
  function renderReportTable(report, fridays) {
    const tbody = document.getElementById("reportTableBody");
    tbody.innerHTML = "";

    const pivot = {};

    report.forEach((r) => {
      if (!pivot[r.user_id]) {
        pivot[r.user_id] = {
          username: r.username,
          family_name: r.family_name,
          dates: {},
        };
      }

      pivot[r.user_id].dates[r.session_date] = {
        status: r.status,
        absence_reason: r.absence_reason,
        apologized: r.apologized,
      };
    });

    const users = Object.values(pivot);

    users.forEach((u, idx) => {
      const tr = tbody.insertRow();
      tr.insertCell().textContent = idx + 1;
      tr.insertCell().textContent = u.username;
      tr.insertCell().textContent = u.family_name;

      fridays.forEach((date) => {
        const rec = u.dates[date];

        const statusCell = tr.insertCell();
        const reasonCell = tr.insertCell();
        const apologizedCell = tr.insertCell();

        if (!rec) {
          statusCell.textContent = "—"; statusCell.className = "no-data";
          reasonCell.textContent = "—"; reasonCell.className = "no-data";
          apologizedCell.textContent = "—"; apologizedCell.className = "no-data";
        } else {
          if (rec.status === "Present" || rec.status === 1) {
            statusCell.textContent = "حاضر"; statusCell.className = "present";
            reasonCell.textContent = "—";
            apologizedCell.textContent = rec.apologized ? "نعم" : "لا";
          } else {
            statusCell.textContent = "غائب";
            statusCell.className = rec.apologized ? "apologized" : "absent";
            reasonCell.textContent = rec.absence_reason ?? "—";
            apologizedCell.textContent = rec.apologized ? "نعم" : "لا";
          }
        }
      });
    });
  }

  // ✅ جدول عدد حضور المخدومين
  function renderServantsCountTable(summary) {
    const container = document.getElementById("servantsCountContainer");
    container.innerHTML = "";

    if (!summary || summary.length === 0) {
      container.innerHTML = '<p style="color:blue;">لا يوجد بيانات لهذا الشهر.</p>';
      return;
    }

    const table = document.createElement("table");
    table.className = "report-table";

    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr>
        <th>الجمعة</th>
        <th>عدد حضور المخدومين</th>
      </tr>
    `;

    const tbody = document.createElement("tbody");

    summary.forEach((row) => {
      const tr = tbody.insertRow();
      tr.insertCell().textContent = formatDate(row.session_date);
      tr.insertCell().textContent = row.attendees_count;
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    container.appendChild(table);
  }

  return (
    <div className="container">
      <h1>تقرير الحضور والغياب للخدام</h1>
      <a href="/AdminDashboard" className="btn btn-secondary">العودة للوحة الإدارة</a>
      <hr />

      <div className="report-controls">
        <label>تصفية حسب الشهر:</label>
        <select id="report_month">
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

        <label>تصفية حسب الأسرة:</label>
        <select id="report_family">
          <option value="">-- كل الأسر --</option>
        </select>

        <button id="filter-btn">عرض التقرير</button>
      </div>

      <p id="loading-status" style={{ textAlign: "center", color: "blue" }}>
        اختر الشهر والأسرة ثم اعرض التقرير...
      </p>

      <p id="error-message" style={{ textAlign: "center", color: "red", display: "none" }}></p>

      <div className="table-responsive">
       <table className="report-table freeze-columns">
          <thead id="reportTableHead"></thead>
          <tbody id="reportTableBody"></tbody>
        </table>
      </div>

      <h2 style={{ marginTop: "30px" }}>عدد حضور المخدومين</h2>
      <div id="servantsCountContainer" className="table-responsive"></div>
    </div>
  );
}

export default ViewReports;
