import Dashboard from "../components/dashboard/Dashboard";
import LoginForm from "../components/auth/LoginForm";
import { useAuth } from "../hooks/useAuth";

const Index = () => {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // ❗ NOT LOGGED IN → SHOW LOGIN PAGE
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoginForm />
      </div>
    );
  }

  // ✅ LOGGED IN → SHOW DASHBOARD
  return (
    <div className="min-h-screen bg-gray-50">
      <Dashboard user={user} onLogout={signOut} />
    </div>
  );
};

export default Index;
