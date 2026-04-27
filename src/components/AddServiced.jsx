import { useEffect } from "react";
import "../styles.css";
import { API_BASE } from "../config";

function AddServiced() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const familyId = user.family_id;

  useEffect(() => {
    const form = document.getElementById("addServicedForm");
    const servantSelect = document.getElementById("servant_select");
    const classSelect = document.getElementById("class_select");
    const message = document.getElementById("result-message");

    // ✅ تحميل قائمة الخدام
    async function loadServants() {
      try {
        const res = await fetch(`${API_BASE}/api/servants/by-family/${familyId}`);
        const data = await res.json();

        servantSelect.innerHTML = '<option value="">-- اختر الخادم --</option>';

        if (data.success && Array.isArray(data.servants)) {
          data.servants.forEach((s) => {
            const option = document.createElement("option");
            option.value = s.user_id;
            option.textContent = s.username;
            servantSelect.appendChild(option);
          });
        }
      } catch (err) {
        console.error("Error loading servants:", err);
        message.style.color = "red";
        message.textContent = "❌ خطأ في تحميل الخدام.";
      }
    }

    // ✅ تحميل قائمة الفصول
    async function loadClasses() {
      try {
        const res = await fetch(`${API_BASE}/api/classes?family_id=${familyId}`);
        const data = await res.json();

        classSelect.innerHTML = '<option value="">-- اختر الفصل --</option>';

        if (data.success && Array.isArray(data.classes)) {
          data.classes.forEach((c) => {
            const option = document.createElement("option");
            option.value = c.class_id;
            option.textContent = c.class_name;
            classSelect.appendChild(option);
          });
        }
      } catch (err) {
        console.error("Error loading classes:", err);
        message.style.color = "red";
        message.textContent = "❌ خطأ في تحميل الفصول.";
      }
    }

    // ✅ إضافة مخدوم
    async function addServiced(e) {
      e.preventDefault();

      const servicedName = document.getElementById("serviced_name").value;
      const servantId = servantSelect.value;
      const classId = classSelect.value;

      if (!servicedName || !servantId || !classId) {
        message.style.color = "red";
        message.textContent = "❌ كل البيانات مطلوبة (اسم، خادم، فصل).";
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/serviced/ameen`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviced_name: servicedName,
            family_id: familyId,
            class_id: classId,
            servant_user_id: servantId,
            user: {
              role: user.role,
              family_id: user.family_id,
              user_id: user.user_id
            }
          }),
        });

        const data = await res.json();
        message.style.color = data.success ? "green" : "red";
        message.textContent = data.message;
      } catch (err) {
        console.error("Error adding serviced:", err);
        message.style.color = "red";
        message.textContent = "❌ خطأ في الاتصال بالسيرفر.";
      }
    }

    loadServants();
    loadClasses();
    form.addEventListener("submit", addServiced);
  }, [familyId, user]);

  return (
    <div className="container">
      <h1>➕ إضافة مخدوم</h1>
      <a href="/AmeenDashboard" className="btn btn-secondary">العودة للوحة الأمين</a>
      <hr />

      <form id="addServicedForm">
        <label>اسم المخدوم:</label>
        <input type="text" id="serviced_name" required />

        <label>اختر الخادم:</label>
        <select id="servant_select" required>
          <option value="">-- اختر الخادم --</option>
        </select>

        <label>اختر الفصل:</label>
        <select id="class_select" required>
          <option value="">-- اختر الفصل --</option>
        </select>

        <button type="submit" style={{ marginTop: "20px" }}>إضافة</button>
      </form>

      <p id="result-message" style={{ marginTop: "15px", fontWeight: "bold" }}></p>

      <p style={{ marginTop: "20px", fontSize: "14px", color: "#ffcc00" }}>
        ⚠️ ملحوظة: إضافة مخدوم للبرنامج لا تعني أنه أُضيف للقوائم الرسمية،
        برجاء مراجعة السكرتارية لتحديث الإضافة.
      </p>
    </div>
  );
}

export default AddServiced;
