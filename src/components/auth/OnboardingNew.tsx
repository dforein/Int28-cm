import { useState } from 'react';
import { createUser } from '../../api/client';
import { useUserStore } from '../../store/userStore';

const COLORS = [
  '#e05c5c', '#e08c3a', '#d4b23a', '#5cb85c',
  '#3a8fd4', '#7c5cbf', '#d45c9e', '#3abfbf',
];

function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export default function OnboardingNew() {
  const [name, setName] = useState('');
  const [step, setStep] = useState<'name' | 'created'>('name');
  const [userId, setUserId] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useUserStore((s) => s.setUser);

  async function handleCreate() {
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const color = randomColor();
      const user = await createUser(name.trim(), color);
      setUser({ id: user.id, name: user.name, color: user.color });
      setUserId(user.id);
      setStep('created');
    } catch (e) {
      setError('Could not create user. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (step === 'created') {
    return (
      <div className="onboarding-card">
        <h2>Welcome!</h2>
        <p className="onboarding-sub">
          Your identity is saved in a cookie on your browser.
          If you ever clear your cookies, you can recover your account using this key.
        </p>
        <div className="id-display">
          <code>{userId}</code>
          <button className="copy-btn" onClick={handleCopy}>
            {copied ? 'Copied' : 'Copy key'}
          </button>
        </div>
        <p className="onboarding-hint">
          Store it somewhere, it's your only way back if you lose the cookie.
        </p>
        <button className="primary-btn" onClick={() => {}}>
          Enter →
        </button>
      </div>
    );
  }

  return (
    <div className="onboarding-card">
      <h2>Choose a name</h2>
      <p className="onboarding-sub">This is how others will identify your nodes.</p>
      <input
        className="text-input"
        placeholder="Your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        maxLength={40}
        autoFocus
      />
      {error && <p className="error-msg">{error}</p>}
      <button className="primary-btn" onClick={handleCreate} disabled={loading || !name.trim()}>
        {loading ? 'Creating…' : 'Create user →'}
      </button>
    </div>
  );
}
