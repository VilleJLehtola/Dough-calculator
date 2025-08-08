// App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Frontpage from "./components/Frontpage";
import CalculatorPage from "./components/CalculatorForm";
import FavoritesList from "./components/FavoritesList";
import AdminRecipeEditor from "./components/AdminRecipeEditor";
import RecipeViewPage from "./components/RecipeViewPage";
import Layout from "./components/Layout";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Frontpage />} />
          <Route path="/calculator" element={<CalculatorPage />} />
          <Route path="/favorites" element={<FavoritesList />} />
          <Route path="/admin" element={<AdminRecipeEditor />} />
          <Route path="/recipe/:id" element={<RecipeViewPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}
