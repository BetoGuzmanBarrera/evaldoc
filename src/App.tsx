import { Navigate, Route, Routes } from 'react-router-dom'
import { LandingPage } from './pages/public/LandingPage'
import { LoginPage } from './pages/public/LoginPage'
import { RegisterPage } from './pages/public/RegisterPage'
import { StudentDashboardPage } from './pages/student/StudentDashboardPage'
import { EvaluationsPage } from './pages/student/EvaluationsPage'
import { SurveyPage } from './pages/student/SurveyPage'
import { EvaluationSuccessPage } from './pages/student/EvaluationSuccessPage'
import { TeacherDashboardPage } from './pages/teacher/TeacherDashboardPage'
import { TeacherResultPage } from './pages/teacher/TeacherResultPage'
import { TeacherHistoryPage } from './pages/teacher/TeacherHistoryPage'
import { CoordinatorDashboardPage } from './pages/coordinator/CoordinatorDashboardPage'
import { HrDashboardPage } from './pages/hr/HrDashboardPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { InstitutionsPage } from './pages/admin/InstitutionsPage'

export default function App() {
  return <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/student" element={<StudentDashboardPage />} />
    <Route path="/student/evaluations" element={<EvaluationsPage />} />
    <Route path="/student/evaluations/:id" element={<SurveyPage />} />
    <Route path="/student/evaluations/:id/success" element={<EvaluationSuccessPage />} />
    <Route path="/teacher" element={<TeacherDashboardPage />} />
    <Route path="/teacher/results/:id" element={<TeacherResultPage />} />
    <Route path="/teacher/history" element={<TeacherHistoryPage />} />
    <Route path="/coordinator" element={<CoordinatorDashboardPage />} />
    <Route path="/hr" element={<HrDashboardPage />} />
    <Route path="/admin" element={<AdminDashboardPage />} />
    <Route path="/institutions" element={<InstitutionsPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}
