import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import AmeenDashboard from "./components/AmeenDashboard";
import Dashboard from "./components/Dashboard";
import AdminImport from "./components/AdminImport";
import ImportServants from "./components/ImportServants";
import ManageFamilies from "./components/ManageFamilies";
import ManageUsers from "./components/ManageUsers";
import ViewReports from "./components/ViewReports";
import RecordAttendance from "./components/RecordAttendance";
import MonthlyAttendance from "./components/MonthlyAttendance";
import MonthlyReports from "./components/MonthlyReports";
import ManageServiced from "./components/ManageServiced";
import MonthlyServiced from "./components/MonthlyServiced";
import NavigationControl from "./components/NavigationControl";
import FollowClassesAbsence from "./components/FollowClassesAbsence";
import "./styles.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* صفحة تسجيل الدخول */}
        <Route path="/Login" element={<Login />} />

        {/* لوحة الإدارة */}
        <Route path="/AdminDashboard" element={<AdminDashboard />} />

        {/* لوحة الأمين/السكرتير */}
        <Route path="/AmeenDashboard" element={<AmeenDashboard />} />

        {/* لوحة الخادم */}
        <Route path="/Dashboard" element={<Dashboard />} />

        {/* لو المستخدم دخل على / → يروح للوجين */}
        <Route path="/" element={<Navigate to="/login" />} />
        {/* صفحة استيراد المخدومين */}
        <Route path="/AdminImport" element={<AdminImport />} />
        {/* صفحة استيراد الخدام */}
        <Route path="/ImportServants" element={<ImportServants />} />
        {/*ادارة الاسر */}
        <Route path="/ManageFamilies" element={<ManageFamilies />} />
        {/* ادارة الخدام */}
        <Route path="/ManageUsers" element={<ManageUsers />} />
        {/* عرض الغياب الاسبوعى */}
        <Route path="/ViewReports" element={<ViewReports />} />
        {/* تسجيل الغياب الاسبوعي */}
        <Route path="/RecordAttendance" element={<RecordAttendance />} />
        {/* تسجيل الغياب الشهري*/}
        <Route path="/MonthlyAttendance" element={<MonthlyAttendance />} />
        {/* عرض النسبة الشهرية للخدام*/}
        <Route path="/MonthlyReports" element={<MonthlyReports />} />
        {/* صفحة عرض النسبة الشهرية للمخدومين*/}
        <Route path="/MonthlyServiced" element={<MonthlyServiced />} />
        {/* صفحة الرجوع*/}
        <Route path="/NavigationControl" element={<NavigationControl />} />
        {/* ادارة المخدومين*/}
        <Route path="/ManageServiced" element={<ManageServiced />} />
        {/* متابعة الفصول*/}
        <Route path="/FollowClassesAbsence" element={<FollowClassesAbsence />} />
      </Routes>
    </Router>
  );
}

export default App;
