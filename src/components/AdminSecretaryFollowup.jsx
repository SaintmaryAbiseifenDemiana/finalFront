import React, { useState, useEffect } from "react";
import { API_BASE } from "../config";

function AdminSecretaryFollowup() {
  const [month, setMonth] = useState("");
  const [families, setFamilies] = useState([]);

  // خريطة أسماء الأسر المختصرة
  const shortNames = {
    "حضانه (الملاك ميخائيل والشهيد كرياكوس)": "حضانة",
    "كي جي (الانبا اندرواس)": "kg",
    "اولي وتانيه ( ابونا يسطس)": "1 , 2",
    "تالته ورابعه (ابي سيفين وتماف ايريني )": "3 , 4",
    "خمسه وسادته (مارجرجس والقديسه رفقه )": "5 , 6",
    "اولي وتانيه اعدادي (العدرا والقديس اوغسطينوس)": "اعدادي",
    "تالته اعدادي ( الانبا مكسيموس والشهيده مارينا)": "3 اعدادي",
    "اولي وتانيه ثانوي (القديسه دميانه والانبا شنوده )": "ثانوي",
    "تالته ثانوي ( الانبا انطونيوس والقديسه برباره )": "3 ثانوي",
    "تمهيدي اعداد خدام (الارشيدياكون حبيب جرجس)": "تلمذة",
    "اعداد خدام (البابا اثناسيوس والبابا كيرلس عمود الدين)": "اعداد",
    "الام دولاجي": "الام دولاجي",
    "اجتماع الانبا موسي للخدام": "اجتماع الخدام"
  };

  useEffect(() => {
    if (!month) return;

    async function loadSummary() {
      try {
        const res = await fetch(`${API_BASE}/api/monthly-attendance-summary?month=${month}`);
        const data = await res.json();
        if (data.success) setFamilies(data.families);
      } catch (err) {
        console.error("خطأ في تحميل الملخص:", err);
      }
    }

    loadSummary();
  }, [month]);

  return (
    <div className="admin-container">
      <h2 style={{ color: "white", backgroundColor: "#333", padding: "8px", borderRadius: "4px" }}>
        متابعة السكرتارية
      </h2>

      <div className="form-group">
        <label>اختر الشهر:</label>
        <select value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="">-- اختار الشهر --</option>
          <option value="1">يناير</option>
          <option value="2">فبراير</option>
          <option value="3">مارس</option>
          <option value="4">أبريل</option>
          <option value="5">مايو</option>
          <option value="6">يونيو</option>
          <option value="7">يوليو</option>
          <option value="8">أغسطس</option>
          <option value="9">سبتمبر</option>
          <option value="10">أكتوبر</option>
          <option value="11">نوفمبر</option>
          <option value="12">ديسمبر</option>
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>اليوم</th>
            {families
              .filter(family => family.family_name !== "غير مسؤول عن اسره")
              .map((family, idx) => (
                <th key={idx} style={{ writingMode: "vertical-rl", textAlign: "center" }}>
                  {shortNames[family.family_name] || family.family_name}
                </th>
              ))}
          </tr>
        </thead>
        <tbody>
          {(() => {
            const allDates = new Set();
            families.forEach(family => {
              family.records.forEach(rec => {
                if (rec.date) {
                  allDates.add(new Date(rec.date).getDate());
                }
              });
            });

            return Array.from(allDates).sort((a, b) => a - b).map(day => (
              <tr key={day}>
                <td>يوم {day}</td>
                {families
                  .filter(family => family.family_name !== "غير مسؤول عن اسره")
                  .map((family, idx) => {
                    const rec = family.records.find(r => r.date && new Date(r.date).getDate() === day);
                    return (
                      <td key={idx} style={{ textAlign: "center" }}>
                        {rec ? (rec.submitted ? "✔️" : "❌") : "-"}
                      </td>
                    );
                  })}
              </tr>
            ));
          })()}
        </tbody>
      </table>
    </div>
  );
}

export default AdminSecretaryFollowup;
