import { useEffect } from "react";
import "../styles.css";
import { API_BASE } from "../config";

function AddServiced() {
  const [servicedName, setServicedName] = useState("");
  const [servants, setServants] = useState([]);
  const [selectedServant, setSelectedServant] = useState("");
  const [message, setMessage] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const familyId = user.family_id;   // ✅ أسرة الأمين
  const classId = user.class_id;     // ✅ الفصل الخاص بالأمين

  // ✅ تحميل قائمة الخدام من الـ API
  useEffect(() => {
    fetch("/api/servants")
      .then(res => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then(data => {
        console.log("✅ Servants data:", data);
        // backend بيرجع { success: true, servants: [...] }
        setServants(data.servants || []);
      })
      .catch(err => console.error("Error loading servants:", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const body = {
      serviced_name: servicedName,
      family_id: familyId,
      class_id: classId,
      servant_user_id: selectedServant,
      user // ✅ لازم نبعت بيانات الأمين علشان الـ backend يتحقق
    };

    const res = await fetch("/api/serviced/ameen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    setMessage(data.message);
  };

  return (
    <div className="form-container">
      <h2>➕ إضافة مخدوم</h2>
      <form onSubmit={handleSubmit}>
        <label>اسم المخدوم:</label>
        <input
          type="text"
          value={servicedName}
          onChange={(e) => setServicedName(e.target.value)}
          required
        />

        <label>اختر الخادم:</label>
        <select
          value={selectedServant}
          onChange={(e) => setSelectedServant(e.target.value)}
          required
        >
          <option value="">-- اختر الخادم --</option>
          {servants.map((s) => (
            <option key={s.user_id} value={s.user_id}>
              {s.username} {/* ✅ backend بيرجع username مش full_name */}
            </option>
          ))}
        </select>

        <button type="submit">إضافة</button>
      </form>

      {message && (
        <p style={{ marginTop: "15px", color: "#fff" }}>
          {message}
        </p>
      )}

      <p style={{ marginTop: "20px", fontSize: "14px", color: "#ffcc00" }}>
        ⚠️ ملحوظة: إضافة مخدوم للبرنامج لا تعني أنه أُضيف للقوائم الرسمية،
        برجاء مراجعة السكرتارية لتحديث الإضافة.
      </p>
    </div>
  );
}

export default AddServiced;
