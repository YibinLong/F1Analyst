"use client"

import React from "react"
import { AlertCircle, RefreshCw } from "lucide-react"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallbackTitle?: string
  fallbackMessage?: string
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary component that catches errors in child components
 * and displays a user-friendly error UI with retry functionality.
 *
 * Note: Error boundaries must be class components in React.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error details in development
    if (process.env.NODE_ENV === "development") {
      console.error("[ErrorBoundary] Caught error:", error)
      console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack)
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      const { fallbackTitle = "Something went wrong", fallbackMessage } = this.props
      const errorMessage = fallbackMessage || this.state.error?.message || "An unexpected error occurred"

      return (
        <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-background">
          <div className="glass-panel p-8 rounded-xl text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">{fallbackTitle}</h2>
            <p className="text-muted-foreground mb-4">{errorMessage}</p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="text-left text-xs text-muted-foreground mb-4 p-2 bg-muted/50 rounded">
                <summary className="cursor-pointer font-medium">Technical Details</summary>
                <pre className="mt-2 overflow-auto max-h-32 whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Specialized error boundary for the race viewer
 * that provides context-specific messaging
 */
export class RaceViewerErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (process.env.NODE_ENV === "development") {
      console.error("[RaceViewerErrorBoundary] Caught error:", error)
      console.error("[RaceViewerErrorBoundary] Component stack:", errorInfo.componentStack)
    }
  }

  handleReset = (): void => {
    // Reload the page to reset all state
    window.location.reload()
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex flex-col items-center justify-center bg-background">
          <div className="glass-panel p-8 rounded-xl text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Race Viewer Error</h2>
            <p className="text-muted-foreground mb-4">
              We encountered a problem displaying this race. This could be due to an issue with the race data or visualization.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="text-left text-xs text-muted-foreground mb-4 p-2 bg-muted/50 rounded">
                <summary className="cursor-pointer font-medium">Technical Details</summary>
                <pre className="mt-2 overflow-auto max-h-32 whitespace-pre-wrap">
                  {this.state.error.message}
                  {"\n\n"}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Specialized error boundary for the 3D track visualization
 */
export class TrackVisualizationErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (process.env.NODE_ENV === "development") {
      console.error("[TrackVisualizationErrorBoundary] 3D render error:", error)
      console.error("[TrackVisualizationErrorBoundary] Component stack:", errorInfo.componentStack)
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="h-full flex flex-col items-center justify-center bg-card/50 rounded-lg border border-border">
          <div className="text-center p-6">
            <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Track Visualization Error</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Unable to render the 3D track. This may be due to WebGL or graphics issues.
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
