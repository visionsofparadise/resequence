import React from "react";

interface ErrorBoundaryProps {
	children: React.ReactNode;
}

interface ErrorBoundaryState {
	error: Error | undefined;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	state: ErrorBoundaryState = { error: undefined };

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { error };
	}

	render() {
		if (this.state.error) {
			return (
				<div className="flex min-h-screen items-center justify-center bg-surface p-8">
					<div className="max-w-md text-center">
						<h1 className="mb-2 text-xl font-bold text-accent-primary">Something went wrong</h1>
						<p className="text-sm text-text-secondary">{this.state.error.message}</p>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
