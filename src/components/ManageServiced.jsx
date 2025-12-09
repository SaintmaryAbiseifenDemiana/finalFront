import React, { useEffect, useState } from "react";
import "../styles.css";
import AdminImport from "./AdminImport";
import { API_BASE } from "../config";

function ManageServiced() {
  const [activeTab, setActiveTab] = useState("manage");
  const [families, setFamilies] = useState([]);
  const [classes, setClasses] = useState([]);
  const [servants, setServants] = useState([]);
  const [servicedList, setServicedList] = useState([]);

  const [selectedFamily, setSelectedFamily] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedServant, setSelectedServant] = useState("");

  const [newServicedName, setNewServicedName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const [selectedServicedIds, setSelectedServicedIds] = useState([]);

  // ✅ النقل
  const [transferId, setTransferId] = useState(null);
  const [transferServant, setTransferServant] = useState("");
  const [allServants, setAllServants] = useState([]);

  useEffect(() => {
    loadFamilies();
  }, []);

  // ✅ Live Suggestions
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // ✅ تحميل الأسر
  async function loadFamilies() {
    const res = await fetch(`${API_BASE}/api/families`);
    const data = await res.json();
    if (data.success) setFamilies(data.families);
  }

  // ✅ تحميل الفصول
  async function loadClasses(familyId) {
    const res = await fetch(`${API_BASE}/api/serviced/classes/${familyId}`);
    const data = await res.json();
    if (data.success) setClasses(data.classes);
  }

  // ✅ تحميل الخدام
  async function loadServants(familyId, className) {
    const res = await fetch(
      `${API_BASE}/api/servants/by-family/${familyId}/${encodeURIComponent(className)}`
    );
    const data = await res.json();
    if (data.success) setServants(data.servants);
  }

  // ✅ تحميل المخدومين
  async function loadServicedList(familyId, className) {
    const res = await fetch(
      `${API_BASE}/api/serviced/manage/${familyId}/${encodeURIComponent(className)}`
    );
    const data = await res.json();
    if (data.success) setServicedList(data.serviced);
  }

  // ✅ عند اختيار الأسرة
  function handleFamilyChange(e) {
    const familyId = e.target.value;
    setSelectedFamily(familyId);
    setSelectedClass("");
    setServants([]);
    setServicedList([]);
    setSearchResults([]);
    if (familyId) loadClasses(familyId);
  }

  // ✅ عند اختيار الفصل
  function handleClassChange(e) {
    const className = e.target.value;
    setSelectedClass(className);
    setSearchResults([]);

    if (selectedFamily && className) {
      loadServants(selectedFamily, className);
      loadServicedList(selectedFamily, className);
    }
  }

  // ✅ إضافة مخدوم
  async function addServiced() {
    if (!newServicedName || !selectedFamily || !selectedClass || !selectedServant) {
      alert("من فضلك املئي كل البيانات");
      return;
    }

    const res = await fetch(`${API_BASE}/api/serviced`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviced_name: newServicedName,
        family_id: selectedFamily,
        class_name: selectedClass,
        servant_user_id: selectedServant,
      }),
    });

    const data = await res.json();
    alert(data.message);

    if (data.success) {
      setNewServicedName("");
      loadServicedList(selectedFamily, selectedClass);
    }
  }

  // ✅ حذف مخدوم فردي
  async function deleteServiced(id) {
    if (!window.confirm("هل أنت متأكد من حذف هذا المخدوم؟")) return;

    const res = await fetch(`${API_BASE}/api/serviced/${id}`, {
      method: "DELETE",
    });

    const data = await res.json();
    alert(data.message);

    if (data.success) {
      loadServicedList(selectedFamily, selectedClass);
    }
  }

  // ✅ اختيار/إلغاء اختيار مخدوم
  function toggleSelectServiced(id) {
    setSelectedServicedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  // ✅ حذف جماعي
  async function deleteSelectedServiced() {
    if (selectedServicedIds.length === 0) {
      alert("من فضلك اختاري مخدومين للحذف");
      return;
    }

    if (!window.confirm("هل أنت متأكدة من حذف المخدومين المحددين؟")) return;

    const res = await fetch(`${API_BASE}/api/serviced/bulk-delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedServicedIds }),
    });

    const data = await res.json();
    alert(data.message);

    if (data.success) {
      setSelectedServicedIds([]);

      if (selectedFamily && selectedClass) {
        loadServicedList(selectedFamily, selectedClass);
      }

      if (searchResults.length > 0) {
        handleSearch();
      }
    }
  }

  // ✅ فتح نافذة النقل
  async function startTransfer(servicedId) {
    setTransferId(servicedId);

    const res = await fetch(`${API_BASE}/api/servants`);
    const data = await res.json();
    if (data.success) setAllServants(data.servants);
  }

  // ✅ تنفيذ النقل
  async function confirmTransfer() {
    if (!transferServant) {
      alert("من فضلك اختاري الخادم الجديد");
      return;
    }

    const res = await fetch(`${API_BASE}/api/serviced/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviced_id: transferId,
        new_servant_id: transferServant,
      }),
    });

    const data = await res.json();
    alert(data.message);

    if (data.success) {
      setTransferId(null);
      setTransferServant("");

      if (selectedFamily && selectedClass) {
        loadServicedList(selectedFamily, selectedClass);
      }
      if (searchResults.length > 0) {
        handleSearch();
      }
    }
  }

  // ✅ البحث
  async function handleSearch() {
    if (!searchQuery.trim()) return;

    const res = await fetch(
      `${API_BASE}/api/serviced/search?name=${encodeURIComponent(searchQuery)}`
    );

    const data = await res.json();
    if (data.success) setSearchResults(data.results);
  }

  return (
    <div className="container">
      <h1>إدارة المخدومين</h1>

      <a href="/AdminDashboard" className="btn btn-secondary">العودة للوحة الإدارة</a>

      {/* ✅ Tabs */}
      <div className="tabs">
        <button
          className={activeTab === "manage" ? "active-tab" : ""}
          onClick={() => setActiveTab("manage")}
        >
          إدارة المخدومين
        </button>

        <button
          className={activeTab === "import" ? "active-tab" : ""}
          onClick={() => setActiveTab("import")}
        >
          استيراد المخدومين
        </button>
      </div>

      {activeTab === "manage" && (
  <div className="card p-4">
    <h3>إدارة المخدومين</h3>

    {/* ✅ البحث */}
    <div className="search-box">
      <h4>بحث عن مخدوم</h4>
      <input
        type="text"
        placeholder="اكتب اسم المخدوم"
        value={searchQuery}
        onChange={(e) => {
          const value = e.target.value;
          setSearchQuery(value);

          // ✅ لو البحث اتشال → امسحي النتائج وارجعي جدول الفصل
          if (value.trim() === "") {
            setSearchResults([]);

            if (selectedFamily && selectedClass) {
              loadServicedList(selectedFamily, selectedClass);
            }
          }
        }}
      />
    </div>

    {/* ✅ جدول نتائج البحث */}
    {searchQuery.trim() !== "" && searchResults.length > 0 && (
      <>
        <div className="table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                <th>اختيار</th>
                <th>الاسم</th>
                <th>الأسرة</th>
                <th>الفصل</th>
                <th>الخادم المسؤول</th>
                <th>نقل</th>
              </tr>
            </thead>
            <tbody>
              {searchResults.map((r) => (
                <tr key={r.serviced_id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedServicedIds.includes(r.serviced_id)}
                      onChange={() => toggleSelectServiced(r.serviced_id)}
                    />
                  </td>
                  <td>{r.serviced_name}</td>
                  <td>{r.family_name}</td>
                  <td>{r.class_name}</td>
                  <td>{r.servant_name || "—"}</td>
                  <td>
                    <button
                      className="btn btn-warning"
                      onClick={() => startTransfer(r.serviced_id)}
                    >
                      نقل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedServicedIds.length > 0 && (
          <button className="btn btn-danger" onClick={deleteSelectedServiced}>
            حذف المحددين ({selectedServicedIds.length})
          </button>
        )}
      </>
    )}

    {/* ✅ صفحة الفصل (تظهر فقط لو مفيش بحث) */}
    {searchQuery.trim() === "" && searchResults.length === 0 && (
      <>
        {/* ✅ اختيار الأسرة */}
        <label>اختار الأسرة:</label>
        <select value={selectedFamily} onChange={handleFamilyChange}>
          <option value="">-- اختار الأسرة --</option>
          {families.map((f) => (
            <option key={f.family_id} value={f.family_id}>
              {f.family_name}
            </option>
          ))}
        </select>

        {/* ✅ اختيار الفصل */}
        {classes.length > 0 && (
          <>
            <label>اختار الفصل:</label>
            <select value={selectedClass} onChange={handleClassChange}>
              <option value="">-- اختار الفصل --</option>
              {classes.map((c, i) => (
                <option key={i} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </>
        )}

        {/* ✅ إضافة مخدوم */}
        {selectedClass && (
          <div className="add-serviced">
            <h4>إضافة مخدوم جديد</h4>

            <input
              type="text"
              placeholder="اسم المخدوم"
              value={newServicedName}
              onChange={(e) => setNewServicedName(e.target.value)}
            />

            <select
              value={selectedServant}
              onChange={(e) => setSelectedServant(e.target.value)}
            >
              <option value="">-- اختار الخادم المسؤول --</option>
              {servants.map((s) => (
                <option key={s.user_id} value={s.user_id}>
                  {s.username}
                </option>
              ))}
            </select>

            <button onClick={addServiced}>➕ إضافة</button>
          </div>
        )}

        {/* ✅ جدول مخدومين الفصل */}
        {servicedList.length > 0 && (
          <>
            <div className="table-wrapper">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>اختيار</th>
                    <th>اسم المخدوم</th>
                    <th>الخادم المسؤول</th>
                    <th>حذف</th>
                    <th>نقل</th>
                  </tr>
                </thead>
                <tbody>
                  {servicedList.map((s) => (
                    <tr key={s.serviced_id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedServicedIds.includes(s.serviced_id)}
                          onChange={() => toggleSelectServiced(s.serviced_id)}
                        />
                      </td>
                      <td>{s.serviced_name}</td>
                      <td>{s.servant_name || "—"}</td>
                      <td>
                        <button
                          className="btn btn-danger"
                          onClick={() => deleteServiced(s.serviced_id)}
                        >
                          حذف
                        </button>
                      </td>
                      <td>
                        <button
                          className="btn btn-warning"
                          onClick={() => startTransfer(s.serviced_id)}
                        >
                          نقل
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedServicedIds.length > 0 && (
              <button className="btn btn-danger" onClick={deleteSelectedServiced}>
                حذف المحددين ({selectedServicedIds.length})
              </button>
            )}
          </>
        )}
      </>
    )}
  </div>
)}

      {/* ✅ تبويب الاستيراد */}
      {activeTab === "import" && (
        <div className="card p-4">
          <AdminImport />
        </div>
      )}

      {/* ✅ نافذة النقل */}
      {transferId && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>نقل المخدوم لخادم آخر</h3>

            <label>اختار الخادم الجديد:</label>
            <select
              value={transferServant}
              onChange={(e) => setTransferServant(e.target.value)}
            >
              <option value="">-- اختار الخادم --</option>
              {allServants.map((s) => (
                <option key={s.user_id} value={s.user_id}>
                  {s.username}
                </option>
              ))}
            </select>

            <div className="modal-buttons">
              <button className="btn btn-primary" onClick={confirmTransfer}>
                تأكيد النقل
              </button>
              <button className="btn btn-secondary" onClick={() => setTransferId(null)}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageServiced;
