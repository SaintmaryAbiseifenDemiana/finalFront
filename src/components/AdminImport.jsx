import React, { useEffect, useState } from "react";
import "../styles.css";
import { API_BASE } from "../config";

function AdminImport() {
  const [message, setMessage] = useState("");
  const [messageClass, setMessageClass] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.role || user.role.trim().toLowerCase() !== "admin") {
      window.location.href = "/login";
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById("servicedFile");

    if (fileInput.files.length === 0) {
      setMessage("الرجاء اختيار ملف أولاً.");
      setMessageClass("alert alert-danger");
      return;
    }

    const formData = new FormData();
    formData.append("servicedFile", fileInput.files[0]);

    setLoading(true);
    setMessage("جاري الاستيراد... قد يستغرق الأمر بعض الوقت.");
    setMessageClass("alert alert-info");

    try {
      const response = await fetch(`${API_BASE}/api/import-serviced`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        setMessageClass("alert alert-success");
      } else {
        setMessage(data.message || "فشل الاستيراد. تحقق من محتوى الملف وأسماء الأعمدة.");
        setMessageClass("alert alert-danger");
        console.error("Import Failed:", data.message);
      }
    } catch (error) {
      setMessage("خطأ في الاتصال بالخادم: " + error.message);
      setMessageClass("alert alert-danger");
      console.error("Network Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: "600px", paddingTop: "50px" }}>
      <h2 className="text-center mb-4">استيراد بيانات المخدومين (الفصول والربط)</h2>

      <div className="card p-4 shadow">
        <p>الرجاء التأكد من أن ملف الإكسل يحتوي على الأعمدة التالية تماماً في رأس الصفحة:</p>
        <ul className="list-unstyled mb-4 alert alert-info">
          <li><code>serviced_name</code></li>
          <li><code>family_name</code></li>
          <li><code>class_name</code></li>
          <li><code>servant_username</code> (اسم مستخدم الخادم المسؤول)</li>
        </ul>

        <form id="importForm" onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="form-group">
            <label htmlFor="servicedFile">ملف المخدومين (Excel/CSV):</label>
            <input
              type="file"
              className="form-control-file"
              id="servicedFile"
              name="servicedFile"
              accept=".xlsx, .xls, .csv"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "جاري الاستيراد..." : "بدء الاستيراد"}
          </button>
        </form>

        <div id="message" className={`mt-3 text-center ${messageClass}`}>
          {message}
        </div>
      </div>

      <div className="mt-3 text-center">
        <a href="/ManageServiced" className="btn btn-secondary">العودة للوحة الإدارة</a>
      </div>
    </div>
  );
}

export default AdminImport;
