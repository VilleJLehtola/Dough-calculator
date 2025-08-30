// src/App.jsx
import { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import supabase from './supabaseClient';
import { AnalyticsTracker } from './analytics';
import ShoppingListDock from '@/components/ShoppingListDock';

// Simple loading fallback
function Fallback() {
  return (
    <div className="p-8 text-sm text-gray-600 dark:text-gray-300">
      Loading…
    </div>
  );
}

// Lazy pages (code-splitting)
const FrontPage         = lazy(() => import('./pages/FrontPage'));
const CalculatorPage    = lazy(() => import('./pages/CalculatorPage'));
const FavoritesPage     = lazy(() => import('./pages/FavoritesPage'));
const LoginPage         = lazy(() => import('./pages/LoginPage'));
const BrowsePage        = lazy(() => import('./pages/BrowsePage'));
const RecipeViewPage    = lazy(() => import('./pages/RecipeViewPage'));
const CreateRecipePage  = lazy(() => import('./pages/CreateRecipePage'));
const EditRecipePage    = lazy(() => import('./pages/EditRecipePage'));
const YourRecipesPage   = lazy(() => import('./pages/YourRecipesPage'));
const ProfilePage       = lazy(() => import('./pages/ProfilePage'));
const MyProfileRedirect = lazy(() => import('./pages/MyProfileRedirect'));
const PrivacyPage       = lazy(() => import('./pages/PrivacyPage'));
const TermsPage         = lazy(() => import('./pages/TermsPage'));
const ContactPage       = lazy(() => import('./pages/ContactPage'));
const FAQPage           = lazy(() => import('./pages/FAQPage'));
const RecipePrintPage   = lazy(() => import('./pages/RecipePrintPage'));
const OfflineRecipesPage= lazy(() => import('./pages/OfflineRecipesPage'));
const BakeModePage      = lazy(() => import('./pages/BakeModePage'));
const RecipeBakePage    = lazy(() => import('./pages/RecipeBakePage'));

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (isMounted) setUser(user || null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Since App owns the Router, we can't use useNavigate here.
  const handleLoginClick = () => {
    window.location.href = '/login';
  };

  return (
    <Router>
      <AnalyticsTracker />
      <Layout user={user} onLoginClick={handleLoginClick} onLogout={handleLogout}>
        <Suspense fallback={<Fallback />}>
          <Routes>
            <Route path="/" element={<FrontPage />} />
            <Route path="/browse" element={<BrowsePage />} />
            <Route path="/calculator" element={<CalculatorPage />} />
            <Route path="/favorites" element={<FavoritesPage user={user} />} />
            <Route path="/login" element={<LoginPage setUser={setUser} />} />
            <Route path="/create" element={<CreateRecipePage />} />
            <Route path="/recipe/:id/edit" element={<EditRecipePage />} />
            <Route path="/your-recipes" element={<YourRecipesPage />} />
            <Route path="/u/:username" element={<ProfilePage />} />
            <Route path="/profile" element={<MyProfileRedirect />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/offline" element={<OfflineRecipesPage />} />

            {/* Baking */}
            <Route path="/recipe/:id/bake" element={<RecipeBakePage />} />
            <Route path="/bake" element={<BakeModePage />} />

            {/* Recipe routes (id and id/print) */}
            <Route path="/recipe/:id" element={<RecipeViewPage />} />
            <Route path="/recipe/:id/print" element={<RecipePrintPage />} />
            {/* If you also have slug routes, keep them too:
            <Route path="/recipe/:id/:slug" element={<RecipeViewPage />} />
            <Route path="/recipe/:id/:slug/print" element={<RecipePrintPage />} /> */}

            {/* Legacy alias so old links keep working */}
            <Route path="/resepti/:id" element={<RecipeViewPage />} />

            {/* Fallback */}
            <Route path="*" element={<FrontPage />} />
          </Routes>
        </Suspense>

        {/* Floating shopping list dock, visible on all pages */}
        <ShoppingListDock />
      </Layout>
    </Router>
  );
}
