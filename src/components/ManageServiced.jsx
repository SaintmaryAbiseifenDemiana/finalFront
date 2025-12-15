import React, { useEffect, useState } from "react";
import "../styles.css";
import AdminImport from "./AdminImport";
import { API_BASE } from "../config";

function ManageServiced() {
  const [activeTab, setActiveTab] = useState("manage");

  // ✅ نفس الداتا ونفس الكونسبت
  const [servicedList, setServicedList] = useState([]);          // اللي بتتعرض
  const [originalServicedList, setOriginalServicedList] = useState([]); // نسخة ثابتة للبحث

  const [families, setFamilies] = useState([]);
  const [classes, setClasses] = useState([]);
  const [servants, setServants] = useState([]);

  const [selectedFamily, setSelectedFamily] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedServant, setSelectedServant] = useState("");
  const [newServicedName, setNewServicedName] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServicedIds, setSelectedServicedIds] = useState([]);

  // ✅ النقل
  const [transferId, setTransferId] = useState(null);
  const [transferServant, setTransferServant] = useState("");
  const [allServants, setAllServants] = useState([]);

  useEffect(() => {
    loadFamilies();
    loadAllServiced();
  }, []);

  // ✅ تحميل الأسر
  async function loadFamilies() {
    const res = await fetch(`${API_BASE}/api/families`);
    const data = await res.json();
    if (data.success) setFamilies(data.families);
  }

  // ✅ تحميل كل المخدومين (للبحث العام)
  async function loadAllServiced() {
    const res = await fetch(`${API_BASE}/api/serviced/all`);
    const data = await res.json();

    if (data.success) {
      setServicedList(data.serviced);
      setOriginalServicedList(data.serviced);
    }
  }

  // ✅ تحميل الفصول
  async function loadClasses(familyId) {
    const res = await fetch(`${API_BASE}/api/serviced/classes/${familyId}`);
    const data = await res.json();
    if (data.success) setClasses(data.classes);
  }

  // ✅ تحميل الخدام
  async function loadServants(familyId, classId) {
    const res = await fetch(`${API_BASE}/api/servants/by-family/${familyId}/${classId}`);
    const data = await res.json();
    if (data.success) setServants(data.servants);
  }

  // ✅ تحميل مخدومين فصل
  async function loadServicedList(familyId, classId) {
    const res = await fetch(`${API_BASE}/api/serviced/by-class/${familyId}/${classId}`);
    const data = await res.json();

    if (data.success) {
      setServicedList(data.serviced);
      setOriginalServicedList(data.serviced);
    }
  }

  // ✅ البحث (نفس ManageUsers بالظبط)
  function filterServiced(query) {
    setSearchQuery(query);

    if (!query) {
      setServicedList(originalServicedList);
    } else {
      const filtered = originalServicedList.filter((s) =>
        s.serviced_name.toLowerCase().includes(query.toLowerCase())
      );
      setServicedList(filtered);
    }
  }

  function handleFamilyChange(e) {
    const familyId = e.target.value;
    setSelectedFamily(familyId);
    setSelectedClass("");
    setClasses([]);
    setServants([]);
    setSearchQuery("");

    if (familyId) loadClasses(familyId);
  }

  function handleClassChange(e) {
    const classId = e.target.value;
    setSelectedClass(classId);
    setSearchQuery("");

    if (selectedFamily && classId) {
      loadServicedList(selectedFamily, classId);
      loadServants(selectedFamily, classId);
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
        class_id: selectedClass,
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

  // ✅ حذف مخدوم
  async function deleteServiced(id) {
    if (!window.confirm("هل أنت متأكد من حذف هذا المخدوم؟")) return;

    const res = await fetch(`${API_BASE}/api/serviced/${id}`, { method: "DELETE" });
    const data = await res.json();
    alert(data.message);

    if (data.success) loadServicedList(selectedFamily, selectedClass);
  }

  // ✅ تحديد
  function toggleSelectServiced(id) {
    setSelectedServicedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function selectAllServiced() {
    if (selectedServicedIds.length === servicedList.length) {
      setSelectedServicedIds([]);
    } else {
      setSelectedServicedIds(servicedList.map((s) => s.serviced_id));
    }
  }

  // ✅ حذف جماعي
  async function deleteSelectedServiced() {
    if (selectedServicedIds.length === 0) {
      alert("اختاري مخدومين للحذف");
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
      loadServicedList(selectedFamily, selectedClass);
    }
  }

  // ✅ نقل
  async function startTransfer(id) {
    setTransferId(id);
    const res = await fetch(`${API_BASE}/api/servants`);
    const data = await res.json();
    if (data.success) setAllServants(data.servants);
  }

  async function confirmTransfer() {
    if (!transferServant) return alert("اختاري الخادم الجديد");

    const res = await fetch(`${API_BASE}/api/serviced/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviced_id: transferId, new_servant_id: transferServant }),
    });

    const data = await res.json();
    alert(data.message);

    if (data.success) {
      setTransferId(null);
      setTransferServant("");
      loadServicedList(selectedFamily, selectedClass);
    }
  }

  return (
    <div className="container">
      <h1>إدارة المخدومين</h1>

      <div className="search-box">
        <input
          type="text"
          placeholder="بحث عن مخدوم"
          value={searchQuery}
          onChange={(e) => filterServiced(e.target.value)}
        />
      </div>

      <table className="report-table">
        <thead>
          <tr>
            <th>
              <input type="checkbox" onChange={selectAllServiced} />
            </th>
            <th>الاسم</th>
            <th>الخادم</th>
            <th>حذف</th>
            <th>نقل</th>
          </tr>
        </thead>
        <tbody>
          {servicedList.length > 0 ? (
            servicedList.map((s) => (
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
                  <button onClick={() => deleteServiced(s.serviced_id)}>حذف</button>
                </td>
                <td>
                  <button onClick={() => startTransfer(s.serviced_id)}>نقل</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">لا توجد نتائج</td>
            </tr>
          )}
        </tbody>
      </table>

      {selectedServicedIds.length > 0 && (
        <button className="btn btn-danger" onClick={deleteSelectedServiced}>
          حذف المحددين ({selectedServicedIds.length})
        </button>
      )}

      {activeTab === "import" && <AdminImport />}

      {transferId && (
        <div className="modal-overlay">
          <div className="modal">
            <select value={transferServant} onChange={(e) => setTransferServant(e.target.value)}>
              <option value="">-- اختار الخادم --</option>
              {allServants.map((s) => (
                <option key={s.user_id} value={s.user_id}>{s.username}</option>
              ))}
            </select>
            <button onClick={confirmTransfer}>تأكيد</button>
            <button onClick={() => setTransferId(null)}>إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageServiced;
