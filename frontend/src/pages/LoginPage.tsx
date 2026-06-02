import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/Features/auth/LoginForm/LoginForm';
import { ROUTES } from '../constants/routes';
import { ROLE_STUDENT, ROLE_TEACHER, ROLE_ADMIN } from '../constants/roles';
import '../components/Features/auth/LoginForm/LoginForm.css';

interface User {
  role: string;
}

const LoginPage = () => {
  const navigate = useNavigate();

  const handleSuccess = (user: User) => {
    if (user.role === ROLE_STUDENT) navigate(ROUTES.STUDENT_DASHBOARD);
    else if (user.role === ROLE_TEACHER) navigate(ROUTES.TEACHER_DASHBOARD);
    else if (user.role === ROLE_ADMIN) navigate(ROUTES.ADMIN_DASHBOARD);
    else navigate(ROUTES.DASHBOARD);
  };

  return (
    <div className="login-container">
      <div className="bg-animation"></div>
      <LoginForm onSuccess={handleSuccess} />
    </div>
  );
};

export default LoginPage;
