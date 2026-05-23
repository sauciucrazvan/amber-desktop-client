import { Route, Router, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { Suspense, lazy } from "react";

import ProtectedRoute from "@/features/auth/ProtectedRoute";
import Loading from "./Loading";

const MainScreen = lazy(() =>
  import("./main").then((module) => ({ default: module.MainScreen })),
);
const InProgressCallView = lazy(
  () => import("@/features/calls/views/InProgressCallView"),
);
const AuthScreenRegister = lazy(() =>
  import("./auth").then((module) => ({ default: module.AuthScreenRegister })),
);
const AuthScreenLogin = lazy(() =>
  import("./auth").then((module) => ({ default: module.AuthScreenLogin })),
);

export default function Tree() {
  return (
    <Router hook={useHashLocation}>
      <Suspense fallback={<Loading />}>
        <InProgressCallView />
        <Switch>
          <ProtectedRoute path="/call" component={MainScreen} />
          <ProtectedRoute path="/" component={MainScreen} />

          <Route path="/register" component={AuthScreenRegister} />
          <Route path="/login" component={AuthScreenLogin} />
        </Switch>
      </Suspense>
    </Router>
  );
}
