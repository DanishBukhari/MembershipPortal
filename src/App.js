import './App.css';
import Membership from './comoponents/Membership';
import MembershipForm from './comoponents/MembershipForm';
import Checkout from './comoponents/Checkout';
import ThankYou from './comoponents/ThankYou';
import Login from './comoponents/Login';
import ClientPortal from './comoponents/ClientPortal';
import WalkInForm from './comoponents/WalkInForm';
import { Route, Routes, BrowserRouter, useLocation } from 'react-router-dom';
import AdminPortal from './comoponents/AdminPortal';
import NavBar from './comoponents/NavBar';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const location = useLocation();
  const showNavBar = location.pathname !== '/portal';

  return (
    <div>
      {showNavBar && <NavBar />}
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
    </div>
  );
}

function AppWrapper() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

export default AppWrapper;