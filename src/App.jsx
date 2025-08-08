// src/App.jsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Frontpage from './pages/Frontpage'
import RecipeViewPage from './components/RecipeViewPage'
import AuthForm from './components/AuthForm'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Frontpage />} />
        <Route path="login" element={<AuthForm />} />
        <Route path="recipe/:id" element={<RecipeViewPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}
