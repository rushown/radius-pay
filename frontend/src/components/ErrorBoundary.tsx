import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean; message: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(err: Error): State {
    return { hasError: true, message: err.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="card max-w-md w-full text-center space-y-4">
            <p className="text-4xl">⚠️</p>
            <h2 className="font-display text-xl font-bold text-choco-100">Something went wrong</h2>
            <p className="text-choco-400 text-sm">{this.state.message}</p>
            <button className="btn-gold w-full" onClick={() => window.location.reload()}>
              Reload App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}