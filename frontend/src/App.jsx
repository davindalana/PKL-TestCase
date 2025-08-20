import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Layout from './components/Layout'
import InputWO from './pages/InputWO'
import LihatWO from './pages/LihatWO'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<InputWO />} />
          <Route path="/input-wo" element={<InputWO />} />
          <Route path="/lihat-wo" element={<LihatWO />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
