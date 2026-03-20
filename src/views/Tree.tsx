import { Route, Router, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { Suspense, lazy } from "react";

import ProtectedRoute from "@/auth/ProtectedRoute";

const Homepage = lazy(() => import("./home/Homepage"));
const RegisterView = lazy(() => import("./auth/Register"));
const LoginView = lazy(() => import("./auth/Login"));

export default function Tree() {
  return (
    <Router hook={useHashLocation}>
      <Suspense
        fallback={
          <div className="p-4 text-sm text-muted-foreground">Loading...</div>
        }
      >
        <Switch>
          <ProtectedRoute path="/" component={Homepage} />

          <Route path="/register" component={RegisterView} />
          <Route path="/login" component={LoginView} />
        </Switch>
      </Suspense>
    </Router>
  );
}
