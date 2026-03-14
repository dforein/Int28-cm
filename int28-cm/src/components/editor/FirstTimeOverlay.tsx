interface Props {
  userName: string;
  onClose: () => void;
}

export default function FirstTimeOverlay({ userName, onClose }: Props) {
  return (
    <div className="first-time-overlay">
      <div className="first-time-card">
        <div className="first-time-card-header">
          <h2>Your first time here, {userName}!</h2>
          <button className="icon-btn" onClick={onClose} title="Close">✕</button>
        </div>
        <p>
          Other people's nodes appear as ghost shapes, you can see their position but not their content.
          Create your nodes freely, without being influenced by what others wrote.
        </p>
        <ul className="first-time-tips">
          <li><strong>Double-click</strong> on the canvas to add a node</li>
          <li><strong>Drag</strong> from a handle (●) to connect</li>
          <li><strong>Double-click</strong> a node to edit its title and body</li>
        </ul>
        <p>
          Click <strong>Show →</strong> in the toolbar when you want to reveal everyone's nodes.
          Check later the guide (?) button, to understand how to use everything.
        </p>
      </div>
    </div>
  );
}
