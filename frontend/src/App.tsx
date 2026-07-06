import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Strategies from "./pages/Strategies";
import Backtest from "./pages/Backtest";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="strategies" element={<Strategies />} />
          <Route path="backtest" element={<Backtest />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
