import { useEffect } from "react";
import "../styles.css";
import { API_BASE } from "../config";

function AddServiced() {
  // ✅ عرفنا user فوق علشان يبقى متاح في كل الفانكشنز
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const familyId = user.family_id;
  const classId = user.class_id;

  useEffect(() => {
    const form = document.getElementById("addServicedForm");
    const servantSelect = document.getElementById("servant_select");
    const message = document.getElementById("result-message");

    // ✅ تحميل قائمة الخدام (خدام الأسرة فقط)
    async function loadServants() {
      try {
        const res = await fetch(`${API_BASE}/api/servants/by-family/${familyId}`);
        const data = await res.json();

        servantSelect.innerHTML = '<option value="">-- اختر الخادم --</option>';

        if (data.success && Array.isArray(data.servants)) {
          data.servants.forEach((s) => {
            const option = document.createElement("option");
            option.value = s.user_id;
            option.textContent = s.username; // ✅ backend بيرجع username
            servantSelect.appendChild(option);
          });
        } else {
          message.style.color = "red";
          message.textContent = "❌ فشل تحميل الخدام.";
        }
      } catch (err) {
        console.error("Error loading servants:", err);
        message.style.color = "red";
        message.textContent = "❌ خطأ في الاتصال بالسيرفر.";
      }
    }

    // ✅ إضافة مخدوم
    async function addServiced(e) {
      e.preventDefault();

      const servicedName = document.getElementById("serviced_name").value;
      const servantId = servantSelect.value;

      if (!servicedName || !servantId) {
        message.style.color = "red";
        message.textContent = "❌ لازم تدخل اسم المخدوم وتختار الخادم.";
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
              role: user.role,          // ✅ الدور لازم يتبعت
              family_id: user.family_id, // ✅ الأسرة لازم تتبعت
              user_id: user.user_id      // مش ضروري لكن مفيد
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

    // ✅ تحميل الخدام عند فتح الصفحة
    loadServants();

    // ✅ ربط الفورم
    form.addEventListener("submit", addServiced);
  }, [familyId, classId, user]);

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
