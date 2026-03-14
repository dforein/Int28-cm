import { useState } from 'react';
import { getUser } from '../../api/client';
import { useUserStore } from '../../store/userStore';

export default function OnboardingReturn() {
  const [id, setId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const setUser = useUserStore((s) => s.setUser);

  async function handleLogin() {
    if (!id.trim()) return;
    setLoading(true);
    setError('');
    try {
      const user = await getUser(id.trim());
      setUser({ id: user.id, name: user.name, color: user.color });
    } catch {
      setError('No user found with that key. Check the key and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="onboarding-card">
      <h2>Enter your key</h2>
      <p className="onboarding-sub">Paste the key you saved.</p>
      <input
        className="text-input"
        placeholder="Paste your key"
        value={id}
        onChange={(e) => setId(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
        autoFocus
      />
      {error && <p className="error-msg">{error}</p>}
      <button className="primary-btn" onClick={handleLogin} disabled={loading || !id.trim()}>
        {loading ? 'Searching…' : 'Continue →'}
      </button>
    </div>
  );
}
