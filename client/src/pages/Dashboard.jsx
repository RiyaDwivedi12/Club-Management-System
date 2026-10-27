import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const Dashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/', { replace: true });
      return;
    }
    switch (user.role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'president':
        navigate('/president');
        break;
      case 'vice_president':
        navigate('/vice-president');
        break;
      case 'faculty':
        navigate('/faculty');
        break;
      case 'referee':
        navigate('/referee');
        break;
      default:
        navigate('/clubs');
        break;
    }
  }, [user, navigate]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
    </div>
  );
};

export default Dashboard;
