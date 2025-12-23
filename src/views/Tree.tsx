import { Route, Switch } from "wouter";

import Homepage from "./home/Homepage";
import RegisterView from "./auth/Register";
import LoginView from "./auth/Login";
import Settings from "./common/Settings";

export default function Tree() {
    return <Switch>
        <Route path="/" component={Homepage} />
        <Route path="/settings" component={Settings} />

        <Route path="/register" component={RegisterView} />
        <Route path="/login" component={LoginView} />
    </Switch>
}