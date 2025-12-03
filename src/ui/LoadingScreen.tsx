/**
 * LoadingScreen - Shows while game initializes
 */

interface LoadingScreenProps {
  isLoading: boolean
}

export function LoadingScreen({ isLoading }: LoadingScreenProps) {
  if (!isLoading) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: '#0f0f1a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        fontSize: '2rem',
        fontWeight: 700,
        color: '#4ecdc4',
        fontFamily: 'monospace',
        marginBottom: '24px',
        letterSpacing: '0.2em',
      }}>
        THE SUBSTRATE
      </div>

      <div style={{
        width: '200px',
        height: '4px',
        backgroundColor: '#1a1a2e',
        borderRadius: '2px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: '50%',
          height: '100%',
          backgroundColor: '#4ecdc4',
          animation: 'loading 1s ease-in-out infinite',
        }} />
      </div>

      <div style={{
        marginTop: '16px',
        fontSize: '0.8rem',
        color: '#555',
        fontFamily: 'monospace',
      }}>
        Initializing systems...
      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  )
}
