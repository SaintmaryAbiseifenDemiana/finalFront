import React, { useEffect } from "react";
import "./styles.css";
import { API_BASE } from "../config";

function Dashboard() {
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      alert("يجب تسجيل الدخول أولاً.");
      window.location.href = "/login";
      return;
    }

    const currentUser = JSON.parse(userStr);

    document.getElementById("userFamilyName").textContent =
      currentUser.family_name || "⚠️ غير محدد";

    loadClasses(currentUser.family_id);

    document.getElementById("monthSelect").addEventListener("change", handleMonthChange);
    document.getElementById("fridaySelect").addEventListener("change", checkLoadButtonStatus);
    document.getElementById("classSelect").addEventListener("change", checkLoadButtonStatus);
    document.getElementById("loadServicedBtn").addEventListener("click", () =>
      loadServicedList(currentUser)
    );
    document.getElementById("submitAttendanceBtn").addEventListener("click", () =>
      submitAttendance(currentUser)
    );

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("user");
        window.location.href = "/login";
      });
    }
  }, []);

  async function loadClasses(familyId) {
    const classSelect = document.getElementById("classSelect");
    classSelect.innerHTML = '<option value="">اختر الفصل...</option>';

    try {
      const response = await fetch(`${API_BASE}/api/serviced/classes/${familyId}`);
      const data = await response.json();

      if (data.success && data.classes.length > 0) {
        data.classes.forEach((c) => {
         classSelect.add(new Option(c.class_name, c.class_id));

});


        classSelect.disabled = false;
        document.getElementById("monthSelect").disabled = false;
      } else {
        alert("لم يتم العثور على فصول لهذه الأسرة.");
      }
    } catch (error) {
      console.error("Error loading classes:", error);
      alert("فشل تحميل الفصول.");
    }
  }
function getFridaysForMonth(month) {
  const year = ["10", "11", "12"].includes(month) ? 2026 : 2027;
  const fridays = [];

  // نبدأ من أول يوم في الشهر باستخدام UTC
  let d = new Date(Date.UTC(year, parseInt(month) - 1, 1));

  // نتحرك لحد أول جمعة
  while (d.getUTCDay() !== 5) {
    d.setUTCDate(d.getUTCDate() + 1);
  }

  // نضيف كل الجمعات في الشهر
  while (d.getUTCMonth() === parseInt(month) - 1) {
    // نخليها ترجع التاريخ كامل بالشكل YYYY-MM-DD
    fridays.push(d.toISOString().split("T")[0]);
    d.setUTCDate(d.getUTCDate() + 7);
  }

  return fridays;
}

function handleMonthChange() {
  const month = document.getElementById("monthSelect").value;
  const fridaySelect = document.getElementById("fridaySelect");

  fridaySelect.innerHTML = '<option value="">اختر الجمعة...</option>';

  if (!month) return;

  getFridaysForMonth(month).forEach((dateStr) => {
    // نعرض التاريخ كامل زي 2026-02-06
    fridaySelect.add(new Option(dateStr, dateStr));
  });

  fridaySelect.disabled = false;
  checkLoadButtonStatus();
}


  function checkLoadButtonStatus() {
    const className = document.getElementById("classSelect").value;
    const month = document.getElementById("monthSelect").value;
    const friday = document.getElementById("fridaySelect").value;

    document.getElementById("loadServicedBtn").disabled = !(className && month && friday);
  }

  async function loadServicedList(currentUser) {
    const familyId = currentUser.family_id;
    const className = document.getElementById("classSelect").value;
    const date = document.getElementById("fridaySelect").value;

    if (!familyId || !className || !date) {
      alert("الرجاء اختيار الأسرة والفصل والشهر والجمعة.");
      return;
    }

    document.getElementById("servicedTableBody").innerHTML = "";
    document.getElementById("servicedListCard").style.display = "none";
    document.getElementById("submitAttendanceBtn").disabled = true;

    try {
      const url = `${API_BASE}/api/serviced/by-class/${familyId}/${className}?date=${date}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.success && data.serviced.length > 0) {
        renderServicedTable(data.serviced);
        document.getElementById("selectedClassDisplay").textContent = className;
        document.getElementById("servicedListCard").style.display = "block";
        document.getElementById("submitAttendanceBtn").disabled = false;
      } else {
        alert("لم يتم العثور على مخدومين.");
      }
    } catch (error) {
      console.error("Error loading serviced list:", error);
      alert("فشل جلب المخدومين.");
    }
  }

  function renderServicedTable(servicedList) {
    const tbody = document.getElementById("servicedTableBody");
    tbody.innerHTML = "";

    servicedList.forEach((serviced) => {
      const tr = document.createElement("tr");
      tr.dataset.servicedId = serviced.serviced_id;

      const presentChecked = serviced.attendance_status === "Present" ? "checked" : "";
      const absentChecked = serviced.attendance_status === "Absent" ? "checked" : "";

      tr.innerHTML = `
        <td>${serviced.serviced_name}</td>
        <td class="text-center">
          <label class="m-1">
            <input type="radio" name="status_${serviced.serviced_id}" value="Present" ${presentChecked}> حاضر
          </label>
          <label class="m-1">
            <input type="radio" name="status_${serviced.serviced_id}" value="Absent" ${absentChecked}> غائب
          </label>
        </td>
      `;

      tbody.appendChild(tr);
    });
  }

  async function submitAttendance(currentUser) {
    const date = document.getElementById("fridaySelect").value;
    const servantId = currentUser.user_id;
    const tbody = document.getElementById("servicedTableBody");
    const messageDiv = document.getElementById("message");
    const submitBtn = document.getElementById("submitAttendanceBtn");

    const recordsToSubmit = [];

    tbody.querySelectorAll("tr").forEach((tr) => {
      const servicedId = tr.dataset.servicedId;
      const statusInput = tr.querySelector(`input[name="status_${servicedId}"]:checked`);
      const status = statusInput ? statusInput.value : "Absent";

      recordsToSubmit.push({
        serviced_id: parseInt(servicedId),
        status,
      });
    });

    try {
      messageDiv.className = "alert alert-info";
      messageDiv.textContent = "جاري الحفظ...";
      submitBtn.disabled = true;

      const response = await fetch(`${API_BASE}/api/serviced/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          records: recordsToSubmit,
          recorded_by_user_id: servantId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        messageDiv.className = "alert alert-success";
        messageDiv.textContent = data.message;
        loadServicedList(currentUser);
      } else {
        messageDiv.className = "alert alert-danger";
        messageDiv.textContent = data.message || "فشل غير معروف في الحفظ.";
      }
    } catch (error) {
      messageDiv.className = "alert alert-danger";
      messageDiv.textContent = "حدث خطأ في الاتصال بالخادم.";
      console.error("Submit error:", error);
    } finally {
      submitBtn.disabled = false;
    }
  }

  return (
    <div className="container">
      <h1>📋 تسجيل حضور المخدومين</h1>
      <p>الأسرة: <span id="userFamilyName"></span></p>

      <div className="report-controls">
        <label htmlFor="classSelect">اختر الفصل:</label>
        <select id="classSelect" disabled>
          <option value="">اختر الفصل...</option>
        </select>

        <label htmlFor="monthSelect">اختر الشهر:</label>
        <select id="monthSelect" disabled>
          <option value="">اختر الشهر...</option>
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

        <label htmlFor="fridaySelect">اختر الجمعة:</label>
        <select id="fridaySelect" disabled>
          <option value="">اختر الجمعة...</option>
        </select>

        <button id="loadServicedBtn" disabled>تحميل المخدومين</button>
      </div>

      <div id="servicedListCard" style={{ display: "none", marginTop: "20px" }}>
        <h3>قائمة المخدومين للفصل: <span id="selectedClassDisplay"></span></h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>اسم المخدوم</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody id="servicedTableBody"></tbody>
        </table>
      </div>

      <div style={{ marginTop: "20px" }}>
        <button id="submitAttendanceBtn" disabled>حفظ الحضور</button>
      </div>

      <p id="message" style={{ marginTop: "15px", fontWeight: "bold" }}></p>

      <button id="logoutBtn" style={{ marginTop: "20px" }}>تسجيل الخروج</button>
    </div>
  );
}

export default Dashboard;
