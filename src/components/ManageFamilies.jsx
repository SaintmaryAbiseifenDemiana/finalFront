import React, { useEffect, useState } from "react";
import "../styles.css";
import { API_BASE } from "../config";

function ManageFamilies() {
  const [families, setFamilies] = useState([]);
  const [newFamilyName, setNewFamilyName] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.role || user.role.trim().toLowerCase() !== "admin") {
      window.location.href = "/login";
    }
    loadFamilies();
  }, []);

  // ✅ قراءة الأسر
  const loadFamilies = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/families`);
      const data = await response.json();

      if (data.success && data.families.length > 0) {
        setFamilies(data.families);
      } else {
        setFamilies([]);
      }
    } catch (error) {
      console.error("Error loading families:", error);
      alert("فشل في تحميل الأسر.");
    }
  };

  // ✅ إضافة أسرة
  const addFamily = async (e) => {
    e.preventDefault();
    if (!newFamilyName.trim()) return;

    try {
      const response = await fetch(`${API_BASE}/api/families`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ family_name: newFamilyName.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        setNewFamilyName("");
        loadFamilies();
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage("خطأ في الاتصال بالخادم.");
    }
  };// ✅ حذف أسر محددة
const deleteSelectedFamilies = async () => {
  const selectedIds = families
    .filter((f) => f.selected)
    .map((f) => f.family_id);

  if (selectedIds.length === 0) {
    alert("❌ لازم تختاري أسرة واحدة على الأقل");
    return;
  }

  if (!window.confirm(`هل متأكدة إنك عايزة تمسحي ${selectedIds.length} أسرة؟`)) return;

  try {
    const response = await fetch(`${API_BASE}/api/families/bulk-delete`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ family_ids: selectedIds }),
    });

    const data = await response.json();

    if (data.success) {
      alert("✅ تم مسح الأسر المحددة");
      loadFamilies();
    } else {
      alert("❌ فشل في المسح: " + data.message);
    }
  } catch (err) {
    console.error("خطأ في مسح الأسر:", err);
    alert("❌ حصل خطأ أثناء المسح");
  }
};

// ✅ حذف أسرة واحدة فقط
const deleteSingleFamily = async (family_id) => {
  if (!window.confirm("هل أنتِ متأكدة من حذف هذه الأسرة؟")) return;

  try {
    const response = await fetch(`${API_BASE}/api/families/bulk-delete`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ family_ids: [family_id] }),
    });

    const data = await response.json();

    if (data.success) {
      alert("✅ تم حذف الأسرة");
      loadFamilies();
    } else {
      alert("❌ فشل الحذف: " + data.message);
    }
  } catch (err) {
    console.error("خطأ في حذف الأسرة:", err);
    alert("❌ حصل خطأ أثناء الحذف");
  }
};

  // ✅ تعديل أسرة
  const editFamily = async (family_id, currentName) => {
    const newName = prompt(
      `أدخل الاسم الجديد للأسرة (الاسم الحالي: ${currentName}):`,
      currentName
    );

    if (newName && newName.trim() !== currentName) {
      try {
        const response = await fetch(`${API_BASE}/api/families/${family_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ family_name: newName.trim() }),
        });

        const data = await response.json();

        if (data.success) {
          alert(data.message);
          loadFamilies();
        } else {
          alert(data.message);
        }
      } catch (error) {
        alert("خطأ في الاتصال بالخادم لتعديل الأسرة.");
      }
    }
  };

  // ✅ تحديد الكل
  const toggleSelectAll = (checked) => {
    setFamilies(families.map((f) => ({ ...f, selected: checked })));
  };

  // ✅ تحديد أسرة واحدة
  const toggleSelectFamily = (id, checked) => {
    setFamilies(
      families.map((f) =>
        f.family_id === id ? { ...f, selected: checked } : f
      )
    );
  };

  return (
    <div className="container">
      <h1>إدارة الأسر</h1>
      <a href="/AdminDashboard" className="btn btn-secondary mb-3">
        العودة للوحة الإدارة
      </a>
      <hr />

      <h3>إضافة أسرة جديدة</h3>
      <form onSubmit={addFamily}>
        <div className="form-group">
          <label htmlFor="new_family_name">اسم الأسرة:</label>
          <input
            type="text"
            id="new_family_name"
            value={newFamilyName}
            onChange={(e) => setNewFamilyName(e.target.value)}
            required
          />
        </div>
        <button type="submit">إضافة</button>
        <p id="addMessage">{message}</p>
      </form>

      <hr />
      <button onClick={deleteSelectedFamilies}>مسح المحددين</button>

      <h3>قائمة الأسر المسجلة</h3>
      <table className="family-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                onChange={(e) => toggleSelectAll(e.target.checked)}
              />
            </th>
            <th>م</th>
            <th>اسم الأسرة</th>
            <th>الإجراءات</th>
          </tr>
        </thead>
        <tbody id="familiesTableBody">
          {families.length > 0 ? (
            families.map((family, index) => (
              <tr key={family.family_id}>
                <td>
                  <input
                    type="checkbox"
                    className="family-checkbox"
                    checked={family.selected || false}
                    onChange={(e) =>
                      toggleSelectFamily(family.family_id, e.target.checked)
                    }
                  />
                </td>
                <td>{index + 1}</td>
                <td id={`name-${family.family_id}`}>{family.family_name}</td>
                <td>
                  <button
                    onClick={() => editFamily(family.family_id, family.family_name)}
                  >
                    تعديل
                  </button>

                  <button
                    onClick={() => deleteSingleFamily(family.family_id)}
                    style={{ backgroundColor: "#dc3545", marginLeft: "5px" }}
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">لا توجد أسر مسجلة بعد.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default ManageFamilies;
