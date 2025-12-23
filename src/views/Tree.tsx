import { Route, Switch } from "wouter";

import Homepage from "./home/Homepage";
import RegisterView from "./auth/Register";
import LoginView from "./auth/Login";

export default function Tree() {
    return <Switch>
        <Route path="/" component={Homepage} />

        <Route path="/register" component={RegisterView} />
        <Route path="/login" component={LoginView} />
    </Switch>
}