import Layout from '@/components/Layout';
import FrontPage from '@/pages/Frontpage';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<FrontPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
