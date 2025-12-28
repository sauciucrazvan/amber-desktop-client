import { Route, Router, Switch } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";

import Homepage from "./home/Homepage";
import RegisterView from "./auth/Register";
import LoginView from "./auth/Login";

export default function Tree() {
    return (
        <Router hook={useHashLocation}>
            <Switch>
                <Route path="/" component={Homepage} />

                <Route path="/register" component={RegisterView} />
                <Route path="/login" component={LoginView} />
            </Switch>
        </Router>
    )
}