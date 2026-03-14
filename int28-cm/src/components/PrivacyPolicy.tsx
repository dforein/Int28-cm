interface Props {
  onClose: () => void;
}

export default function PrivacyPolicy({ onClose }: Props) {
  return (
    <div className="privacy-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="privacy-card">
        <div className="privacy-header">
          <h2>Privacy Policy</h2>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <div className="privacy-body">
          <p className="privacy-date">Last updated: March 2026</p>

          <h3>What is this</h3>
          <p>int28-cm is a collaborative graph mapping tool. This policy explains what data is collected when you use it.</p>

          <h3>What we store</h3>
          <p>When you first visit, a random anonymous identifier (UUID) is generated in your browser and saved in a cookie. This identifier has no connection to your real identity, it is used only to associate your nodes and connections within the graph.</p>
          <p>We store:</p>
          <ul>
            <li>Your chosen display name</li>
            <li>A randomly assigned colour</li>
            <li>The nodes and connections you create</li>
          </ul>
          <p>We do not store passwords, email addresses, IP addresses, or any personally identifiable information.</p>

          <h3>Cookies</h3>
          <p>We use a single technical cookie (<code>int28_user</code>) to keep you signed in. This cookie is strictly necessary for the app to function and does not track you across other websites. No consent is required for strictly necessary cookies under EU law.</p>

          <h3>Infrastructure & third parties</h3>
          <p>The app is hosted on <strong>Cloudflare Pages</strong> and uses <strong>Cloudflare D1</strong> for data storage. Cloudflare may collect basic network-level data (such as IP addresses and request metadata) as part of their infrastructure. This data is processed by Cloudflare under their own <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</p>
          <p>We do not use any analytics, advertising, or tracking services.</p>

          <h3>Data retention</h3>
          <p>Your data is retained as long as the app is running. You can ask for your data to be deleted by contacting the administrator.</p>

          <h3>Your rights (GDPR)</h3>
          <p>If you are in the EU/EEA, you have the right to access, correct, or delete your data. Since no personal data is collected, these rights apply only to the content you have created (nodes, connections, display name).</p>

          <h3>Contact</h3>
          <p>For any questions or deletion requests, contact the administrator directly.</p>
        </div>
      </div>
    </div>
  );
}
