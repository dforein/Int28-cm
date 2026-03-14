import { useState, useEffect } from 'react';
import PrivacyPolicy from '../PrivacyPolicy';
import { useUserStore } from '../../store/userStore';
import OnboardingNew from './OnboardingNew';
import OnboardingReturn from './OnboardingReturn';

type Step = 'question' | 'new' | 'return';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loadFromCookie } = useUserStore();
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [step, setStep] = useState<Step>('question');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadFromCookie();
    setReady(true);
  }, [loadFromCookie]);

  // Reset to question screen whenever user logs out
  useEffect(() => {
    if (ready && !user) setStep('question');
  }, [user, ready]);

  if (!ready) return null;
  if (user) return <>{children}</>;

  return (
    <>
    <div className="auth-screen">
      <div className="auth-top">
        <span className="auth-top-dot" />
        int28-cm
      </div>

      {step === 'question' && (
        <div className="onboarding-card">
          <h1>Are you new?</h1>
          <p className="onboarding-sub">
            This app uses a cookie to remember who you are.
            No passwords, no emails; just your name and a unique key.
          </p>
          <div className="onboarding-choices">
            <button className="choice-btn" onClick={() => setStep('new')}>
              Yes, I'm new
            </button>
            <button className="choice-btn choice-btn--secondary" onClick={() => setStep('return')}>
              No, I have a key
            </button>
          </div>
        </div>
      )}

      {step === 'new' && (
        <>
          <button className="back-btn" onClick={() => setStep('question')}>← Back</button>
          <OnboardingNew />
        </>
      )}

      {step === 'return' && (
        <>
          <button className="back-btn" onClick={() => setStep('question')}>← Back</button>
          <OnboardingReturn />
        </>
      )}
    </div>
    <footer className="app-footer" style={{position:"sticky",textAlign:"right"}}>
      <button className="footer-link" onClick={() => setShowPrivacy(true)}>Privacy Policy</button>
    </footer>
    {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} />}
  </>
  );
}