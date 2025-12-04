import { useEffect } from "react";
import "../styles.css";
import { API_BASE } from "../config";

function RecordAttendance() {
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const role = user.role?.trim().toLowerCase();
    const forcedFamilyId = new URLSearchParams(window.location.search).get("family_id");
    const familyIdToUse = forcedFamilyId || user.family_id;

    const familySelect = document.getElementById("family_select");
    const familyLabel = document.getElementById("family_label");

    // ✅ الأمين → لا يرى dropdown
    if (role === "ameensekra") {
      if (familySelect) familySelect.style.display = "none";
      if (familyLabel) familyLabel.textContent = `أسرتك: ${user.family_name}`;
    }

    loadFamiliesForDropdown();

    const monthSelect = document.getElementById("month_select");
    const fridaySelect = document.getElementById("friday_select");
    const form = document.getElementById("attendanceForm");

    function pad(n) { return n < 10 ? "0" + n : "" + n; }
    function formatDateLocal(date) {
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    // ✅ تحميل الأسر
    async function loadFamiliesForDropdown() {
      if (role === "ameensekra") return;

      try {
        const response = await fetch(`${API_BASE}/api/families`);
        const data = await response.json();

        const select = document.getElementById("family_select");
        select.innerHTML = '<option value="">-- اختار الأسرة --</option>';

        if (data.success) {
          data.families.forEach((family) => {
            const option = document.createElement("option");
            option.value = family.family_id;
            option.textContent = family.family_name;
            select.appendChild(option);
          });
        }
      } catch (error) {
        console.error("❌ خطأ في تحميل الأسر:", error);
      }
    }

    // ✅ توليد جمع الشهر
    function loadFridaysForMonth() {
      const monthValue = document.getElementById("month_select").value;
      const fridaySelect = document.getElementById("friday_select");
      fridaySelect.innerHTML = '<option value="">-- اختار جمعة --</option>';

      if (!monthValue) return;

      const monthIndex = parseInt(monthValue, 10) - 1;
      const year = ["10", "11", "12"].includes(monthValue) ? 2025 : 2026;

      let date = new Date(year, monthIndex, 1);

      while (date.getDay() !== 5) date.setDate(date.getDate() + 1);

      while (date.getMonth() === monthIndex) {
        const localStr = formatDateLocal(date);
        const option = new Option(localStr, localStr);
        fridaySelect.add(option);
        date.setDate(date.getDate() + 7);
      }
    }

    // ✅ تحميل الخدام + السجلات القديمة
    async function loadServants() {
      const familyId = familyIdToUse || document.getElementById("family_select").value;
      const date = document.getElementById("friday_select").value;

      const servantList = document.getElementById("servantList");
      const message = document.getElementById("loading-message");

      servantList.innerHTML = "";
      form.style.display = "none";
      message.style.color = "blue";
      message.textContent = "جاري تحميل الخدام...";
      message.style.display = "block";

      if (!familyId || !date) {
        message.textContent = "❌ لازم تختاري الشهر والجمعة والأسرة لبدء التسجيل";
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/attendance/servants/${familyId}`);
        const data = await response.json();

        if (data.success && data.servants.length > 0) {
          renderServants(data.servants);
          message.style.display = "none";
          form.style.display = "block";

          // ✅ تحميل السجلات القديمة
          const oldRes = await fetch(
            `${API_BASE}/api/attendance?date=${date}&family_id=${familyId}`
          );
          const oldData = await oldRes.json();

          if (oldData.success && Array.isArray(oldData.records)) {
            oldData.records.forEach((r) => {
              if (r.status === "Present")
                document.getElementById(`att-${r.user_id}-present`).checked = true;

              if (r.status === "Absent")
                document.getElementById(`att-${r.user_id}-absent`).checked = true;

              const reasonInput = document.getElementById(`reason-${r.user_id}`);
              if (reasonInput) reasonInput.value = r.absence_reason || "";

              const apolInput = document.getElementById(`apol-${r.user_id}`);
              if (apolInput) apolInput.checked = r.apologized ? true : false;
            });

            if (oldData.summary?.attendees_count) {
              document.getElementById("attendees_count").value =
                oldData.summary.attendees_count;
            }
          }
        } else {
          message.textContent = "❌ لا يوجد خدام لهذه الأسرة.";
        }
      } catch (error) {
        console.error("Error loading servants:", error);
        message.textContent = "❌ خطأ في الاتصال بالخادم.";
        message.style.color = "red";
      }
    }

    // ✅ بناء واجهة الخدام
    function renderServants(servants) {
      const list = document.getElementById("servantList");
      list.innerHTML = "";

      servants.forEach((s) => {
        const row = document.createElement("div");
        row.className = "servant-row";

        row.innerHTML = `
          <span>${s.username}</span>

          <input type="radio" name="att-${s.user_id}" id="att-${s.user_id}-present" value="Present">
          <label for="att-${s.user_id}-present">حاضر</label>

          <input type="radio" name="att-${s.user_id}" id="att-${s.user_id}-absent" value="Absent">
          <label for="att-${s.user_id}-absent">غائب</label>

          <input type="text" id="reason-${s.user_id}" placeholder="سبب الغياب (اختياري)" style="flex:1">

          <input type="checkbox" id="apol-${s.user_id}">
          <label for="apol-${s.user_id}">اعتذر؟</label>
        `;

        list.appendChild(row);
      });
    }

    // ✅ تسجيل الحضور
    async function recordAttendance(e) {
      e.preventDefault();

      const date = document.getElementById("friday_select").value;
      const familyId = familyIdToUse || document.getElementById("family_select").value;
      const resultMsg = document.getElementById("result-message");
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const attendees_count = parseInt(
        document.getElementById("attendees_count").value
      );

      if (!date || !familyId) {
        resultMsg.style.color = "red";
        resultMsg.textContent = "❌ لازم تختاري الشهر والجمعة والأسرة قبل التسجيل";
        return;
      }

      if (!attendees_count || isNaN(attendees_count)) {
        resultMsg.style.color = "red";
        resultMsg.textContent = "❌ لازم تدخلي عدد حضور المخدومين";
        return;
      }

      const records = collectRecords();
      if (records.length === 0) {
        resultMsg.style.color = "red";
        resultMsg.textContent = "❌ لم يتم اختيار حالات حضور/غياب";
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/attendance`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date,
            family_id: familyId,
            attendees_count,
            recorded_by_user_id: user.user_id,
            records,
          }),
        });

        const data = await res.json();
        resultMsg.style.color = data.success ? "green" : "red";
        resultMsg.textContent =
          data.message || (data.success ? "✅ تم التسجيل بنجاح" : "❌ فشل التسجيل");
      } catch (err) {
        resultMsg.style.color = "red";
        resultMsg.textContent = "❌ خطأ في الاتصال بالسيرفر";
      }
    }

    // ✅ جمع السجلات
    function collectRecords() {
      const rows = document.querySelectorAll(".servant-row");
      const date = document.getElementById("friday_select").value;
      const out = [];

      rows.forEach((row) => {
        const present = row.querySelector('input[value="Present"]');
        const absent = row.querySelector('input[value="Absent"]');
        const reasonInput = row.querySelector('input[id^="reason-"]');
        const apologizedInput = row.querySelector('input[id^="apol-"]');

        const userIdMatch =
          present?.id.match(/^att-(\d+)-/) ||
          absent?.id.match(/^att-(\d+)-/);

        const user_id = userIdMatch ? Number(userIdMatch[1]) : null;
        if (!user_id) return;

        let status = null;
        if (present?.checked) status = "Present";
        if (absent?.checked) status = "Absent";

        if (!status) return;

        out.push({
          user_id,
          family_id: familyIdToUse,
          session_date: date,
          status,
          absence_reason: reasonInput?.value || null,
          apologized: apologizedInput?.checked ? true : false,
        });
      });

      return out;
    }

    // ✅ Listeners
    monthSelect.addEventListener("change", () => {
      document.getElementById("servantList").innerHTML = "";
      document.getElementById("loading-message").textContent = "";
      loadFridaysForMonth();
    });

    fridaySelect.addEventListener("change", () => {
      document.getElementById("servantList").innerHTML = "";
      document.getElementById("loading-message").textContent = "";
      loadServants();
    });

    form.addEventListener("submit", recordAttendance);
  }, []);

  return (
    <div className="container">
      <h1>📝 تسجيل حضور وغياب الخدام</h1>
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

        <label>اختر جمعة:</label>
        <select id="friday_select">
          <option value="">-- اختار جمعة --</option>
        </select>

        <label id="family_label_title">اختر الأسرة:</label>
        <select id="family_select">
          <option value="">-- اختار الأسرة --</option>
        </select>
      </div>

      <p id="loading-message" style={{ textAlign: "center", color: "blue", fontWeight: "bold", marginTop: "20px" }}>
        يرجى اختيار الشهر ثم الجمعة ثم الأسرة لبدء التسجيل.
      </p>

      <form id="attendanceForm" style={{ display: "none" }}>
        <div id="servantList" className="servants-list"></div>

        <div className="extra-report">
          <h3>عدد حضور المخدومين</h3>
          <label>اكتب العدد:</label>
          <input type="number" id="attendees_count" min="0" required />
        </div>

        <button type="submit" id="submitAttendance" style={{ marginTop: "30px" }}>
          تسجيل الحضور
        </button>
      </form>

      <p id="result-message" style={{ textAlign: "center", marginTop: "15px", fontWeight: "bold" }}></p>
    </div>
  );
}

export default RecordAttendance;
