import React, { useEffect, useState } from "react";
import "../styles.css";
import { API_BASE } from "../config";

function ImportServants() {
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("black");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.role || user.role.trim().toLowerCase() !== "admin") {
      window.location.href = "/login";
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById("servantFile");
    const file = fileInput.files[0];

    if (!file) {
      setMessage("الرجاء اختيار ملف.");
      setMessageColor("red");
      return;
    }

    setMessage("جاري رفع ومعالجة الملف... قد يستغرق الأمر بعض الوقت.");
    setMessageColor("blue");
    setLoading(true);

    const formData = new FormData();
    formData.append("servantFile", file);

    try {
      const response = await fetch(`${API_BASE}/api/import-servants`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage(`✅ نجاح! تم إضافة ${data.importedCount} خادم جديد بنجاح.`);
        setMessageColor("green");
      } else {
        const errorMsg = data.message || "فشل غير معروف في الخادم.";
        setMessage(`❌ فشل الاستيراد: ${errorMsg}`);
        setMessageColor("red");
      }
    } catch (error) {
      console.error("Error during import:", error);
      setMessage("❌ خطأ في الاتصال بالخادم. تحقق من Console.");
      setMessageColor("red");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: "600px", paddingTop: "30px" }}>
      <h1>📥 استيراد بيانات الخدام دفعة واحدة</h1>
      <a href="/AdminDashboard" className="btn btn-secondary mb-3">
        العودة للوحة الإدارة
      </a>
      <hr />

      <h2>تعليمات تجهيز الملف</h2>
      <p>
        يجب أن يكون الملف بصيغة <strong>CSV</strong> أو <strong>Excel</strong>.
        ويجب أن يحتوي على الأعمدة التالية بالترتيب الدقيق في الصف الأول:
      </p>

      <pre>username, password, role_group, family_name</pre>

      <p style={{ color: "red", fontWeight: "bold" }}>
        ملاحظة: سيتم تجاهل الخدام الذين لديهم نفس اسم المستخدم (`username`)
        الموجودين مسبقاً.
      </p>

      <form id="importForm" onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="form-group">
          <label htmlFor="servantFile">اختر ملف CSV/Excel:</label>
          <input
            type="file"
            id="servantFile"
            name="servantFile"
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            required
          />
        </div>
        <button type="submit" id="importButton" disabled={loading}>
          {loading ? "جاري الاستيراد..." : "بدء الاستيراد"}
        </button>
      </form>

      <p id="importStatus" style={{ marginTop: "20px", fontWeight: "bold", color: messageColor }}>
        {message}
      </p>
    </div>
  );
}

export default ImportServants;
