import "semantic-ui-css/semantic.min.css";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

import Home from "./pages/Home";
import Portfolio from "./pages/Portfolio";

function App() {
  return (
    <Router>
      <div className="App">
        <Switch>
          <Route path="/view/:portfolioId" children={<Portfolio />} />
          <Route path="/" children={<Home />} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;
