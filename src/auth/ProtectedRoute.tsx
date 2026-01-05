import { useEffect } from "react";
import { Route, type RouteProps } from "wouter";
import { useLocation } from "wouter";
import { useAuth } from "@/auth/AuthContext";

type ProtectedRouteProps = RouteProps & {
  component: React.ComponentType<any>;
};

export default function ProtectedRoute({
  component: Component,
  ...rest
}: ProtectedRouteProps) {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) setLocation("/login");
  }, [isAuthenticated, setLocation]);

  return (
    <Route
      {...rest}
      component={(props) => (isAuthenticated ? <Component {...props} /> : null)}
    />
  );
}
