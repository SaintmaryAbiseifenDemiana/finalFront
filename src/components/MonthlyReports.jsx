import React, { useEffect } from "react";
import * as XLSX from "xlsx";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import "../styles.css";
import { API_BASE } from "../config";

// ✅ استخدم Roboto فقط (الخط الافتراضي)
pdfMake.vfs = pdfFonts.vfs;
pdfMake.fonts = {
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-Italic.ttf",
  },
};

function MonthlyReports() {
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

  // ✅ إصلاح العربية في PDF
  function fixArabic(text) {
    return text.split(" ").reverse().join(" ").replace(/ +/g, " ");
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
        rtl: true,
        direction: "rtl",
        alignment: "right",
      }))
      .reverse();

    const rows = [...document.querySelectorAll(".report-table tbody tr")].map((tr) =>
      [...tr.cells].map((td) => ({
        text: fixArabic(td.textContent.trim()),
        rtl: true,
        direction: "rtl",
        alignment: "right",
      })).reverse()
    );

    const docDefinition = {
      content: [
        {
          text: fixArabic(title),
          style: "header",
          alignment: "right",
          rtl: true,
          direction: "rtl",
        },
        {
          table: {
            headerRows: 1,
            widths: Array(headers.length).fill("*"),
            body: [headers, ...rows],
          },
          layout: "lightHorizontalLines",
        },
      ],
      defaultStyle: {
        font: "Roboto",   // ✅ رجعناه للخط اللي شغال
        fontSize: 11,
        alignment: "right",
        direction: "rtl",
      },
      styles: {
        header: {
          font: "Roboto",
          fontSize: 16,
          bold: true,
          margin: [0, 0, 0, 10],
        },
      },
      pageMargins: [30, 30, 30, 30],
    };

    pdfMake.createPdf(docDefinition).download(fileName);
  }

  // ✅ تحميل الأسر
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

  // ✅ تحميل التقرير الشهري
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

  // ✅ حساب التقرير الربع سنوي
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

  return (
    <div className="container">
      <h1>النسبة الشهرية للخدام</h1>
      <a href="/AdminDashboard" className="btn btn-secondary">العودة للوحة الإدارة</a>
      <hr />

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

        <label>اختر الأسرة:</label>
        <select id="family_select">
          <option value="">-- كل الأسر --</option>
        </select>

        <button id="loadReportBtn">عرض التقرير</button>

        <label>اختر الربع السنوي:</label>
        <select id="quarter_select">
          <option value="">-- اختار الربع --</option>
          <option value="Q1">الربع الأول (أكتوبر–ديسمبر 2025)</option>
          <option value="Q2">الربع الثاني (يناير–مارس 2026)</option>
          <option value="Q3">الربع الثالث (أبريل–يونيو 2026)</option>
          <option value="Q4">الربع الرابع (يوليو–سبتمبر 2026)</option>
        </select>

        <button id="calcQuarterBtn">عرض النسبة السنوية</button>
      </div>

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
              <th>نسبة الافتقاد</th>
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
