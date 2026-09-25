import { Navigate, Route, Routes } from 'react-router-dom'
import { LandingPage } from './pages/public/LandingPage'
import { LoginPage } from './pages/public/LoginPage'
import { RegisterPage } from './pages/public/RegisterPage'
import { StudentDashboardPage } from './pages/student/StudentDashboardPage'
import { EvaluationsPage } from './pages/student/EvaluationsPage'
import { SurveyPage } from './pages/student/SurveyPage'
import { EvaluationSuccessPage } from './pages/student/EvaluationSuccessPage'

export default function App() {
  return <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route path="/student" element={<StudentDashboardPage />} />
    <Route path="/student/evaluations" element={<EvaluationsPage />} />
    <Route path="/student/evaluations/:id" element={<SurveyPage />} />
    <Route path="/student/evaluations/:id/success" element={<EvaluationSuccessPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}
