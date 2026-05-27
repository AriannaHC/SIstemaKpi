import LeftPanel from './LeftPanel';
import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full font-sans">
      <LeftPanel />
      <LoginForm />
    </div>
  );
}