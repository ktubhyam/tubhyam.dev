'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex items-center justify-center h-full bg-surface border border-border rounded p-8">
            <div className="text-center">
              <p className="text-accent text-sm font-mono mb-2">
                WebGL unavailable
              </p>
              <p className="text-[#666] text-xs font-mono">
                3D viewer requires a WebGL-capable browser
              </p>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
