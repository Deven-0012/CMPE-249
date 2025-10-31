// App.jsx
import { useAuth } from './hooks/useAuth';
import { PROFESSOR_EMAIL } from './constants';
import { AuthPage } from './components/auth/AuthPage';
import { StudentPage } from './components/student/StudentPage';
import { ProfessorPage } from './components/professor/ProfessorPage';

// --- App (Routing) ---
export default function App() {
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading GPU Hub...</div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  return user.email === PROFESSOR_EMAIL
    ? <ProfessorPage user={user} />
    : <StudentPage user={user} />;
}
