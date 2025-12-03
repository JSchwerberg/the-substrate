/**
 * ErrorBoundary - Catches React rendering errors and displays fallback UI
 */

import { Component, ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  /** If true, shows a reload button in the default fallback */
  showReload?: boolean
  /** Custom title for the error message */
  title?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error)
    console.error('Component stack:', errorInfo.componentStack)

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReload = (): void => {
    window.location.reload()
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            backgroundColor: '#1a1a2e',
            border: '2px solid #ef4444',
            borderRadius: '8px',
            margin: '20px',
            fontFamily: 'monospace',
          }}
        >
          <div
            style={{
              color: '#ef4444',
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '16px',
            }}
          >
            {this.props.title || 'Something went wrong'}
          </div>

          <div
            style={{
              color: '#888',
              fontSize: '0.9rem',
              marginBottom: '24px',
              textAlign: 'center',
              maxWidth: '400px',
            }}
          >
            {this.state.error?.message || 'An unexpected error occurred'}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '10px 20px',
                backgroundColor: '#16213e',
                border: '2px solid #4ecdc4',
                borderRadius: '6px',
                color: '#4ecdc4',
                fontSize: '0.9rem',
                fontWeight: 600,
                fontFamily: 'monospace',
                cursor: 'pointer',
              }}
            >
              Try Again
            </button>

            {this.props.showReload && (
              <button
                onClick={this.handleReload}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#16213e',
                  border: '2px solid #7ecbff',
                  borderRadius: '6px',
                  color: '#7ecbff',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                }}
              >
                Reload Game
              </button>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
