import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SpeechProvider } from './context/SpeechContext';
import PrivateRoute from './components/PrivateRoute';
import AppLayout from './components/AppLayout';
import StudentLayout from './components/StudentLayout';
import SessionExpiredModal from './components/SessionExpiredModal';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import LandingPage from './pages/landing/LandingPage';
import { ROUTES } from './constants/routes';
import { ROLE_ADMIN, ROLE_TEACHER, ROLE_STUDENT } from './constants/roles';

import StudentDashboard from './pages/student/Dashboard';
import LessonSession from './pages/student/LessonSession';

import AdminDashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import Classes from './pages/admin/Classes';
import ClassDetail from './pages/admin/ClassDetail';
import Devices from './pages/admin/Devices';
import AdminLessons from './pages/admin/Lessons';

import TeacherDashboard from './pages/teacher/Dashboard';
import TeacherClasses from './pages/teacher/Classes';
import StudentDetail from './pages/teacher/StudentDetail';
import TeacherLessons from './pages/teacher/Lessons';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SpeechProvider>
        <SessionExpiredModal />
        <Routes>
          <Route path={ROUTES.HOME} element={<LandingPage />} />
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />

          <Route element={<PrivateRoute allowedRoles={[ROLE_TEACHER, ROLE_ADMIN]} />}>
            <Route element={<AppLayout />}>
              <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />

              <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboard />} />
              <Route path={ROUTES.ADMIN_USERS} element={<Users />} />
              <Route path={ROUTES.ADMIN_CLASSES} element={<Classes />} />
              <Route path={ROUTES.ADMIN_CLASS_DETAIL} element={<ClassDetail />} />
              <Route path={ROUTES.ADMIN_DEVICES} element={<Devices />} />
              <Route path={ROUTES.ADMIN_LESSONS} element={<AdminLessons />} />

              <Route path={ROUTES.TEACHER_DASHBOARD} element={<TeacherDashboard />} />
              <Route path={ROUTES.TEACHER_CLASSES} element={<TeacherClasses />} />
              <Route path={ROUTES.TEACHER_STUDENT_DETAIL} element={<StudentDetail />} />
              <Route path={ROUTES.TEACHER_LESSONS} element={<TeacherLessons />} />
            </Route>
          </Route>
          <Route element={<PrivateRoute allowedRoles={[ROLE_STUDENT]} />}>
            <Route element={<StudentLayout />}>
              <Route path={ROUTES.STUDENT_DASHBOARD} element={<StudentDashboard />} />
              <Route path={ROUTES.STUDENT_SESSION} element={<LessonSession />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to={ROUTES.LOGIN} />} />
        </Routes>
        </SpeechProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
