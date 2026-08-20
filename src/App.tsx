import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Dashboard } from "./pages/Dashboard";
import { PatientDetailPage } from "./pages/PatientDetail";
import { PatientsPage } from "./pages/Patients";
import { AppointmentDetailPage } from "./pages/AppointmentDetail";
import { AppointmentsPage } from "./pages/Appointments";
import { MessageDetailPage } from "./pages/MessageDetail";
import { MessagesPage } from "./pages/Messages";
import { LoginPage } from "./pages/Login";
import { NotFound } from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route path="patients/:patientId" element={<PatientDetailPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="appointments/:appointmentId" element={<AppointmentDetailPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="messages/:messageId" element={<MessageDetailPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
