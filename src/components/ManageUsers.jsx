import React, { useEffect, useState } from "react";
import "../styles.css";
import { API_BASE } from "../config";

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [families, setFamilies] = useState([]);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role_group: "Khadem",
    family_id: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.role || user.role.trim().toLowerCase() !== "admin") {
      window.location.href = "/Login";
    }
    loadFamiliesForDropdown();
    loadUsers();
  }, []);

  // ✅ تحميل الأسر
  const loadFamiliesForDropdown = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/families`);
      const data = await response.json();
      if (data.success) setFamilies(data.families);
    } catch (error) {
      console.error("فشل تحميل الأسر:", error);
    }
  };

  // ✅ إضافة مستخدم
  const addUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        setNewUser({
          username: "",
          password: "",
          role_group: "Khadem",
          family_id: "",
        });
        loadUsers();
      } else {
        setMessage(data.message);
      }
    } catch (error) {
      setMessage("خطأ في الاتصال بالخادم.");
    }
  };

  // ✅ تحميل المستخدمين
  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/users`);
      const data = await response.json();
      if (data.success) setUsers(data.users);
      else setUsers([]);
    } catch (error) {
      console.error("خطأ في تحميل المستخدمين:", error);
      alert("فشل في تحميل بيانات المستخدمين.");
    }
  };

  // ✅ حذف مستخدم واحد
  const deleteUser = async (user_id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return;

    try {
      const response = await fetch(`${API_BASE}/api/users/${user_id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        loadUsers();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("خطأ في الاتصال بالخادم لحذف المستخدم.");
    }
  };

 // ✅ حذف مجموعة مستخدمين
const deleteSelectedUsers = async () => {
  const selectedIds = users.filter((u) => u.selected).map((u) => u.user_id);

  if (selectedIds.length === 0) {
    alert("❌ لازم تختاري خادم واحد على الأقل");
    return;
  }

  if (!window.confirm(`هل متأكدة إنك عايزة تمسحي ${selectedIds.length} خادم؟`)) return;

  try {
    const response = await fetch(`${API_BASE}/api/users/bulk-delete`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_ids: selectedIds }),
    });

    const data = await response.json();

    if (data.success) {
      alert("✅ تم مسح الخدام المحددين");
      loadUsers();
    } else {
      alert("❌ فشل في المسح: " + data.message);
    }
  } catch (err) {
    console.error("خطأ في المسح:", err);
    alert("❌ حصل خطأ أثناء المسح");
  }
};

  // ✅ فلترة المستخدمين
  const filterUsers = (query) => {
    if (!query) {
      loadUsers();
    } else {
      const filtered = users.filter((u) =>
        u.username.toLowerCase().includes(query.toLowerCase())
      );
      setUsers(filtered);
    }
  };

  // ✅ تحديد الكل
  const toggleSelectAll = (checked) => {
    setUsers(users.map((u) => ({ ...u, selected: checked })));
  };

  // ✅ تحديد مستخدم واحد
  const toggleSelectUser = (id, checked) => {
    setUsers(
      users.map((u) =>
        u.user_id === id ? { ...u, selected: checked } : u
      )
    );
  };

  return (
    <div className="container">
      <h1>إدارة الخدام والأمناء</h1>
      <a href="/AdminDashboard" className="btn btn-secondary mb-3">
        العودة للوحة الإدارة
      </a>
      <hr />

      <h3>إضافة مستخدم جديد</h3>
      <form id="addUserForm" onSubmit={addUser}>
        <div className="form-group">
          <label htmlFor="new_username">اسم المستخدم:</label>
          <input
            type="text"
            id="new_username"
            value={newUser.username}
            onChange={(e) =>
              setNewUser({ ...newUser, username: e.target.value })
            }
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="new_password">كلمة المرور:</label>
          <input
            type="password"
            id="new_password"
            value={newUser.password}
            onChange={(e) =>
              setNewUser({ ...newUser, password: e.target.value })
            }
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="role_group">الصلاحية:</label>
          <select
            id="role_group"
            value={newUser.role_group}
            onChange={(e) =>
              setNewUser({ ...newUser, role_group: e.target.value })
            }
            required
          >
            <option value="Khadem">خادم/خادمة</option>
            <option value="AmeenSekra">أمين خدمة/سكرتارية</option>
            <option value="Admin">مشرف نظام</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="family_id">الأسرة المسؤولة:</label>
          <select
            id="family_id"
            value={newUser.family_id}
            onChange={(e) =>
              setNewUser({ ...newUser, family_id: e.target.value })
            }
          >
            <option value="">لا يوجد/مشرف</option>
            {families.map((family) => (
              <option key={family.family_id} value={family.family_id}>
                {family.family_name}
              </option>
            ))}
          </select>
        </div>

        <button type="submit">إضافة مستخدم</button>
        <p id="userAddMessage">{message}</p>
      </form>

      <hr />

      <h3>قائمة المستخدمين الحاليين</h3>

      <div className="search-box">
        <label htmlFor="userSearch">🔍 بحث عن مستخدم:</label>
        <input
          type="text"
          id="userSearch"
          placeholder="اكتب اسم المستخدم..."
          onChange={(e) => filterUsers(e.target.value)}
        />
      </div>

      <table className="users-table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                onChange={(e) => toggleSelectAll(e.target.checked)}
              />
            </th>
            <th>م</th>
            <th>اسم المستخدم</th>
            <th>الصلاحية</th>
            <th>الأسرة</th>
            <th>الإجراء</th>
          </tr>
        </thead>

        <tbody id="usersTableBody">
          {users.length > 0 ? (
            users.map((user, index) => (
              <tr key={user.user_id}>
                <td>
                  {user.user_id !== 1 ? (
                    <input
                      type="checkbox"
                      checked={user.selected || false}
                      onChange={(e) =>
                        toggleSelectUser(user.user_id, e.target.checked)
                      }
                    />
                  ) : (
                    "—"
                  )}
                </td>

                <td>{index + 1}</td>
                <td>{user.username}</td>
                <td>{user.role_group}</td>
                <td>{user.family_name || "—"}</td>

                <td>
                  {user.user_id !== 1 ? (
                    <button
                      onClick={() => deleteUser(user.user_id)}
                      style={{ backgroundColor: "#dc3545" }}
                    >
                      حذف
                    </button>
                  ) : (
                    "أساسي"
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6">لا توجد مستخدمين مسجلين بعد.</td>
            </tr>
          )}
        </tbody>
      </table>

      <button onClick={deleteSelectedUsers} className="btn btn-danger mt-3">
        مسح المحددين
      </button>
    </div>
  );
}

export default ManageUsers;
