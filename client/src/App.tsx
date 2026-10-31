import { Route, Switch } from "wouter";
import Home from "./pages/Home";
import Privacy from "./pages/Privacy";

export default function App() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/pl" component={Home} />
      <Route path="/pl/" component={Home} />
      <Route path="/de" component={Home} />
      <Route path="/de/" component={Home} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/privacy.html" component={Privacy} />
      <Route component={Home} />
    </Switch>
  );
}
