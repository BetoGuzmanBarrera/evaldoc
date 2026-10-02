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
import { AuthProvider } from './auth/AuthProvider'
import { RequireRole } from './routes/RequireRole'

export default function App() {
  return <AuthProvider><Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route element={<RequireRole allowed={['student']} />}>
      <Route path="/student" element={<StudentDashboardPage />} />
      <Route path="/student/evaluations" element={<EvaluationsPage />} />
      <Route path="/student/evaluations/:id" element={<SurveyPage />} />
      <Route path="/student/evaluations/:id/success" element={<EvaluationSuccessPage />} />
    </Route>
    <Route element={<RequireRole allowed={['teacher']} />}>
      <Route path="/teacher" element={<TeacherDashboardPage />} />
      <Route path="/teacher/results/:id" element={<TeacherResultPage />} />
      <Route path="/teacher/history" element={<TeacherHistoryPage />} />
    </Route>
    <Route element={<RequireRole allowed={['coordinator', 'admin']} />}>
      <Route path="/coordinator" element={<CoordinatorDashboardPage />} />
    </Route>
    <Route element={<RequireRole allowed={['hr', 'admin']} />}>
      <Route path="/hr" element={<HrDashboardPage />} />
    </Route>
    <Route element={<RequireRole allowed={['admin']} />}>
      <Route path="/admin" element={<AdminDashboardPage />} />
    </Route>
    <Route element={<RequireRole allowed={['coordinator', 'hr', 'admin']} />}>
      <Route path="/institutions" element={<InstitutionsPage />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></AuthProvider>
}
