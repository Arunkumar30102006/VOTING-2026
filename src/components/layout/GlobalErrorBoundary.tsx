import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { logger } from "@/services/logger";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        logger.error("Uncaught error in application", { error, errorInfo });
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-4">
                    <div className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl bg-card border border-border shadow-2xl">
                        <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                            <AlertTriangle className="w-10 h-10 text-destructive" />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-foreground">
                                Something went wrong
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                We apologize for the inconvenience. A critical error has occurred.
                            </p>
                        </div>

                        {this.state.error && import.meta.env.DEV && (
                            <div className="text-left p-4 rounded-lg bg-muted text-xs font-mono overflow-auto max-h-40 border border-border/50">
                                {this.state.error.toString()}
                            </div>
                        )}

                        <Button
                            onClick={this.handleReload}
                            className="w-full gap-2 items-center"
                            size="lg"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reload Application
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
