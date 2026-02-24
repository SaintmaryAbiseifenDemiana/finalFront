import React, { useEffect } from "react";
import * as XLSX from "xlsx";
import pdfMake from "pdfmake/build/pdfmake";
import { vfs, fonts } from "../fonts/fonts";
import "../styles.css";
import { API_BASE } from "../config";

pdfMake.vfs = vfs;
pdfMake.fonts = fonts;

function MonthlyReports() {
  let isAsc = false;

  useEffect(() => {
    loadFamilies();

    document.getElementById("loadReportBtn")?.addEventListener("click", loadMonthlyReport);
    document.getElementById("calcQuarterBtn")?.addEventListener("click", calculateQuarterReports);

    document.getElementById("exportMonthlyExcel")?.addEventListener("click", () => {
      const table = document.querySelector(".report-table");
      const wb = XLSX.utils.table_to_book(table, { sheet: "Monthly Report" });
      XLSX.writeFile(wb, "monthly_report.xlsx");
    });

    document.getElementById("exportMonthlyPDF")?.addEventListener("click", () => {
      exportTableToPdf("تقرير النسبة الشهرية للخدام", "monthly_report.pdf");
    });

    const searchInput = document.getElementById("userSearch");
    if (searchInput) searchInput.addEventListener("input", filterUsers);
  }, []);

  function fixArabic(text) {
    return text.split(" ").reverse().join(" ").replace(/ +/g, " ");
  }

  function fixArabicSpacing(text) {
    if (!text) return text;
    if (/^[0-9.]+$/.test(text)) return text;
    return text.replace(/ /g, "\u00A0");
  }

  function filterUsers() {
    const input = document.getElementById("userSearch").value.toLowerCase();
    const rows = document.querySelectorAll("#reportTableBody tr");

    rows.forEach((row) => {
      const nameCell = row.cells[1];
      if (!nameCell) return;
      const name = nameCell.textContent.toLowerCase();
      row.style.display = name.includes(input) ? "" : "none";
    });
  }

  function exportTableToPdf(title, fileName) {
    const headers = [...document.querySelectorAll(".report-table thead th")]
      .map((th) => ({
        text: fixArabic(th.textContent.trim()),
        alignment: "right",
      }));

    const rows = [...document.querySelectorAll(".report-table tbody tr")].map((tr) =>
      [...tr.cells].map((td, index) => {
        const value = td.textContent.trim();
        const isNumber = /^[0-9.]+$/.test(value);
        return {
          text: isNumber ? value : fixArabicSpacing(value),
          alignment: isNumber ? "center" : "right",
        };
      })
    );

    const columnWidths = [25, "*", "*", "*", "*", "*", "*"];

    const docDefinition = {
      content: [
        {
          text: fixArabic(title),
          style: "header",
          alignment: "right",
        },
        {
          table: {
            headerRows: 1,
            widths: columnWidths,
            body: [headers, ...rows],
          },
          layout: "lightHorizontalLines",
        },
      ],
      defaultStyle: {
        font: "Cairo",
        fontSize: 11,
        alignment: "right",
      },
      styles: {
        header: {
          font: "Cairo",
          fontSize: 16,
          bold: true,
          margin: [0, 0, 0, 10],
        },
      },
      pageMargins: [30, 30, 30, 30],
      pageDirection: "rtl",
    };

    pdfMake.createPdf(docDefinition).download(fileName);
  }

  async function loadFamilies() {
    try {
      const response = await fetch(`${API_BASE}/api/families`);
      const data = await response.json();
      const select = document.getElementById("family_select");

      if (data.success) {
        select.innerHTML = '<option value="">-- كل الأسر --</option>';
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

  async function loadMonthlyReport() {
    const month = document.getElementById("month_select").value;
    const familyId = document.getElementById("family_select").value;
    const tableBody = document.getElementById("reportTableBody");
    const resultMessage = document.getElementById("resultMessage");

    if (!month) {
      resultMessage.textContent = "❌ يرجى اختيار شهر أولاً";
      resultMessage.style.color = "red";
      return;
    }

    tableBody.innerHTML = "";
    resultMessage.textContent = "جاري تحميل التقرير...";
    resultMessage.style.color = "blue";

    try {
      const year = document.getElementById("year_select")?.value || new Date().getFullYear();
      let apiUrl = `${API_BASE}/api/monthly-reports?month=${month}&year=${year}`;
      if (familyId) apiUrl += `&family_id=${familyId}`;

      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.success && data.report.length > 0) {
        tableBody.innerHTML = "";
        data.report.forEach((record, index) => {
          const row = tableBody.insertRow();
          row.insertCell().textContent = index + 1;
          row.insertCell().textContent = record.username;
          row.insertCell().textContent = record.meeting_pct;
          row.insertCell().textContent = record.lesson_pct;
          row.insertCell().textContent = record.communion_pct;
          row.insertCell().textContent = record.confession_pct;
          row.insertCell().textContent = record.visits_pct;
        });

        const header = document.getElementById("visitsHeader");
        if (header) header.onclick = sortByVisits;

        resultMessage.textContent = "✅ تم تحميل التقرير الشهري";
        resultMessage.style.color = "green";
      } else {
        resultMessage.textContent = "❌ لا توجد بيانات لهذا الشهر";
        resultMessage.style.color = "red";
      }
    } catch (err) {
      console.error("خطأ:", err);
      resultMessage.textContent = "❌ خطأ في الاتصال بالخادم";
      resultMessage.style.color = "red";
    }
  }

  async function calculateQuarterReports() {
    const familyId = document.getElementById("family_select").value;
    const quarter = document.getElementById("quarter_select").value;
    const tableBody = document.getElementById("reportTableBody");
    const resultMessage = document.getElementById("resultMessage");

    tableBody.innerHTML = "";
    resultMessage.textContent = "جاري حساب النسبة السنوية...";
    resultMessage.style.color = "blue";

    if (!quarter) {
      resultMessage.textContent = "❌ يرجى اختيار ربع سنوي أولاً";
      resultMessage.style.color = "red";
      return;
    }

    let apiUrl = `${API_BASE}/api/monthly-reports-quarter?quarter=${quarter}`;
    if (familyId) apiUrl += `&family_id=${familyId}`;

    try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.success && data.report.length > 0) {
        data.report.forEach((record, index) => {
          const row = tableBody.insertRow();
          row.insertCell().textContent = index + 1;
          row.insertCell().textContent = record.username;
          row.insertCell().textContent = record.meeting_pct;
          row.insertCell().textContent = record.lesson_pct;
          row.insertCell().textContent = record.communion_pct;
          row.insertCell().textContent = record.confession_pct;
          row.insertCell().textContent = record.visits_pct;
        });

        const header = document.getElementById("visitsHeader");
        if (header) header.onclick = sortByVisits;

        resultMessage.textContent = "✅ تم حساب التقرير السنوي";
        resultMessage.style.color = "green";
      } else {
        resultMessage.textContent = "❌ لا توجد بيانات لهذا الربع";
        resultMessage.style.color = "red";
      }
    } catch (err) {
      console.error("خطأ:", err);
      resultMessage.textContent = "❌ خطأ في الاتصال بالخادم";
      resultMessage.style.color = "red";
    }
  }

  function sortByVisits() {
    const tableBody = document.getElementById("reportTableBody");
    const rows = Array.from(tableBody.querySelectorAll("tr"));
    const arrow = document.getElementById("visitsArrow");
    const sorted = rows.sort((a, b) => {
      const av = parseFloat(a.cells[6].textContent) || 0;
            const bv = parseFloat(b.cells[6].textContent) || 0;
      return isAsc ? av - bv : bv - av;
    });

    isAsc = !isAsc;
    if (arrow) {
      arrow.textContent = isAsc ? "⬆️" : "⬇️";
    }

    tableBody.innerHTML = "";
    sorted.forEach(row => tableBody.appendChild(row));
  }

  return (
    <div className="container">
      <h1>نسبة الخدام</h1>
      <a href="/AdminDashboard" className="btn btn-secondary">العودة للوحة الإدارة</a>
      <hr />

      {/* ✅ واجهة البداية: أيقونتين كبار */}
      <div className="admin-apps">
        <a href="#" id="loadReportBtn" className="app-icon">
          <div>📅</div>
          <span>النسبة الشهرية</span>
        </a>

        <a href="#" id="calcQuarterBtn" className="app-icon">
          <div>📈</div>
          <span>النسبة السنوية</span>
        </a>
      </div>

      {/* ✅ البحث والجدول يظهروا بعد الضغط على أيقونة */}
      <div className="search-box">
        <label>🔍 بحث عن خادم:</label>
        <input type="text" id="userSearch" placeholder="اكتب اسم خادم..." />
      </div>

      <div className="table-responsive">
        <table className="report-table">
          <thead>
            <tr>
              <th>م</th>
              <th>اسم الخادم</th>
              <th>حضر الاجتماع</th>
              <th>حضر الدرس</th>
              <th>اتناول</th>
              <th>اعترف</th>
              <th id="visitsHeader">افتقاد <span id="visitsArrow"></span></th>
            </tr>
          </thead>
          <tbody id="reportTableBody"></tbody>
        </table>
      </div>

      <p id="resultMessage" style={{ marginTop: "15px", fontWeight: "bold" }}></p>

      <button id="exportMonthlyExcel">📊 طباعه (Excel)</button>
      <button id="exportMonthlyPDF">📄 طباعه (PDF)</button>
    </div>
  );
}

export default MonthlyReports;
