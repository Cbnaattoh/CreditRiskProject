import React, { Component, ErrorInfo, ReactNode } from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[200px] flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <FiAlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
              {this.state.error?.message || 'An unexpected error occurred while rendering this component.'}
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="text-left bg-gray-100 dark:bg-gray-800 p-3 rounded-lg mb-4 text-xs">
                <summary className="cursor-pointer font-medium mb-2">Error Details</summary>
                <pre className="whitespace-pre-wrap text-red-600 dark:text-red-400">
                  {this.state.error?.stack}
                </pre>
                <pre className="whitespace-pre-wrap text-gray-600 dark:text-gray-400 mt-2">
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              <FiRefreshCw className="h-4 w-4" />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;