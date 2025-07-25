import React, { useState } from 'react';
import Header from './Header';
import AuthForm from './AuthForm';
import CalculatorForm from './CalculatorForm';
import ResultDisplay from './ResultDisplay';
import RecipeView from './RecipeView';
import FavoritesList from './FavoritesList';

function App() {
  const [showRecipe, setShowRecipe] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start py-8 px-4 transition-all duration-500 ease-in-out">
      <Header
        showRecipe={showRecipe}
        showFavorites={showFavorites}
        setShowRecipe={setShowRecipe}
        setShowFavorites={setShowFavorites}
        isLoggedIn={isLoggedIn}
        user={user}
        setUser={setUser}
        setIsLoggedIn={setIsLoggedIn}
      />

      {!isLoggedIn ? (
        <AuthForm setIsLoggedIn={setIsLoggedIn} setUser={setUser} />
      ) : (
        <>
          <CalculatorForm showRecipe={showRecipe} />
          <ResultDisplay />
          {showRecipe && <RecipeView />}
          {showFavorites && <FavoritesList user={user} />}
        </>
      )}
    </div>
  );
}

export default App;
