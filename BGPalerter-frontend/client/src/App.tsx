import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Administration from "./pages/Administration";
import AlertHistory from "./pages/AlertHistory";
import RoutingData from "./pages/RoutingData";
import AlertRules from "./pages/AlertRules";
import PerformanceMetrics from "./pages/PerformanceMetrics";
import { useAuth } from "./_core/hooks/useAuth";
import { getLoginUrl } from "./const";

function ProtectedRoute({ component: Component, ...rest }: { component: React.ComponentType; path: string }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        {() => <Redirect to="/dashboard" />}
      </Route>
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} path="/dashboard" />}
      </Route>
      <Route path="/admin">
        {() => <ProtectedRoute component={Administration} path="/admin" />}
      </Route>
      <Route path="/alerts">
        {() => <ProtectedRoute component={AlertHistory} path="/alerts" />}
      </Route>
      <Route path="/routing">
        {() => <ProtectedRoute component={RoutingData} path="/routing" />}
      </Route>
      <Route path="/rules">
        {() => <ProtectedRoute component={AlertRules} path="/rules" />}
      </Route>
      <Route path="/performance">
        {() => <ProtectedRoute component={PerformanceMetrics} path="/performance" />}
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
