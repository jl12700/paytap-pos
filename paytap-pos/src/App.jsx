import { BrowserRouter as Router, Routes, Route} from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Orders from "./pages/Orders";
import Header from "./components/shared/Header";
import  Menu  from "./pages/Menu";
import Conversion from "./pages/Conversion";
import SimpleMenuManager from "./components/SimpleMenuManager";
import DatabaseTest from "./components/DatabaseTest";

function App() {
  
  return (
    <>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/conversion" element={<Conversion />} />
          <Route path="*" element={<div>Not Found</div>}/>
        </Routes>
        <SimpleMenuManager />
        <DatabaseTest />
      </Router>  
    </>
  )
}

export default App
