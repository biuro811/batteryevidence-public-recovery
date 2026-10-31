import { Route, Switch } from "wouter";
import Consultation from "./pages/Consultation";
import Home from "./pages/Home";
import Intake from "./pages/Intake";
import Ops from "./pages/Ops";
import Order from "./pages/Order";
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
      <Route path="/consultation" component={Consultation} />
      <Route path="/order" component={Order} />
      <Route path="/intake" component={Intake} />
      <Route path="/ops" component={Ops} />
      <Route component={Home} />
    </Switch>
  );
}
