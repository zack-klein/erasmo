import 'semantic-ui-css/semantic.min.css'
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";

import Portfolio from "./Portfolio"

function App() {
  return (
    <Router>
      <div className="App">
        <Switch>
          <Route path="/:portfolioId" children={<Portfolio />} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;
