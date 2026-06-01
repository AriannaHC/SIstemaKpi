import LeftPanel from './LeftPanel';
import LoginForm from './LoginForm';

export default function LoginPage({ onLoginSuccess }) {
  return (
    <div className="flex min-h-screen w-full bg-white font-sans">
      <LeftPanel />
      <LoginForm onLoginSuccess={onLoginSuccess} />
    </div>
  );
}
