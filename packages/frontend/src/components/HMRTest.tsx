// Test component for HMR verification
export function HMRTest() {
  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      padding: '5px 10px',
      background: '#4ade80',
      color: 'white',
      borderRadius: 5,
      fontSize: 12,
      fontFamily: 'monospace',
      zIndex: 9999
    }}>
      HMR: {new Date().toLocaleTimeString()}
    </div>
  );
}