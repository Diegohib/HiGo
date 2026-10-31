import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="login-screen">
          <div className="login-card" style={{ textAlign: 'center' }}>
            <p className="login-logo">Algo salió mal</p>
            <p className="login-sub">
              Hubo un error inesperado en la página. Podés intentar recargar.
            </p>
            <button className="btn btn-primary btn-block" onClick={() => window.location.reload()}>
              Recargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
