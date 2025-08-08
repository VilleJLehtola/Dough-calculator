import { Routes, Route } from 'react-router-dom';
import Frontpage from './components/Frontpage';
import CalculatorForm from './components/CalculatorForm';
import FavoritesList from './components/FavoritesList';
import AdminRecipeEditor from './components/AdminRecipeEditor';
import RecipeViewPage from './components/RecipeViewPage';
import AuthForm from './components/AuthForm';
import Layout from './components/Layout';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Frontpage />} />
        <Route path="/calculator" element={<CalculatorForm />} />
        <Route path="/favorites" element={<FavoritesList />} />
        <Route path="/admin" element={<AdminRecipeEditor />} />
        <Route path="/recipe/:id" element={<RecipeViewPage />} />
        <Route path="/login" element={<AuthForm />} />
      </Routes>
    </Layout>
  );
}
