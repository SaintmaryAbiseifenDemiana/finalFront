import React, { useState } from "react";
import "./styles.css";
import { API_BASE } from "../config";



function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageClass, setMessageClass] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageClass("");

    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (data.success) {
        setMessage("تم الدخول بنجاح! الصلاحية: " + data.role);
        setMessageClass("success");

        const user = {
          user_id: data.user_id,
          username: data.username,
          role: data.role,
          family_id: data.family_id,
          family_name: data.family_name,
        };

        localStorage.setItem("user", JSON.stringify(user));

        const role = data.role ? data.role.trim().toLowerCase() : "";

        if (role === "admin") {
          window.location.href = "/AdminDashboard";
        } else if (role === "ameensekra" || role === "amin") {
          window.location.href = "/AmeenDashboard";
        } else if (role === "khadem") {
          window.location.href = "/Dashboard";
        } else {
          setMessage("❌ صلاحية غير معروفة: " + data.role);
          setMessageClass("error");
        }
      } else {
        setMessage(data.message);
        setMessageClass("error");
      }
    } catch (error) {
      setMessage("خطأ في الاتصال بالخادم.");
      setMessageClass("error");
      console.error("Error:", error);
    }
  };

  return (
    <div className="login-container">
      <h2>تسجيل الدخول</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">اسم المستخدم:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">كلمة المرور:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit">دخول</button>

        <p className={messageClass}>{message}</p>

        <p className="forgot-text">
          نسيت كلمة السر أو اسم المستخدم؟ <br />
          <span className="contact">تواصل مع السكرتارية</span>
        </p>
      </form>
    </div>
  );
}

export default Login;
