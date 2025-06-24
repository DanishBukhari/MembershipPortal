// import logo from './logo.svg';
import './App.css';
import Membership from './comoponents/Membership';
import MembershipForm from './comoponents/MembershipForm';
import Checkout from './comoponents/Checkout';
// import ThankYou from './comoponents/ThankYou';
import ThankYou from './comoponents/ThankYou'
import Login from './comoponents/Login';
import ClientPortal from './comoponents/ClientPortal';
import WalkInForm from './comoponents/WalkInForm';
import { Route, Routes, BrowserRouter } from 'react-router-dom';
import AdminPortal from './comoponents/AdminPortal';
import NavBar from './comoponents/NavBar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Don’t forget the CSS!



function App() {
 
  return(
    <BrowserRouter>
    <NavBar />
    <Routes>
      <Route path="/" element={<Membership />} />
      <Route path="/form/:tier" element={<MembershipForm />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/thank-you" element={<ThankYou />} />
      <Route path="/login" element={<Login />} />
      <Route path="/portal" element={<ClientPortal />} />
      <Route path="/walk-in" element={<WalkInForm />} />
      <Route path="/admin-portal" element={<AdminPortal />} />
    </Routes>
    <ToastContainer />
  </BrowserRouter>


    );
  
}

export default App;
