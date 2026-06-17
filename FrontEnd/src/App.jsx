import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Link,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import BottomBar from "./components/BottomBar";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Home from "./Pages/Home.jsx";

import SelectionEntry from "./Pages/SelectionEntry.jsx";
import ArticlePage from "./Pages/ArticlePage.jsx";
import SignUp from "./Pages/SignUp.jsx";
import Login from "./Pages/Login.jsx";
import HomeDashboard from "./Pages/HomeDashboard.jsx";
import ProductDashboard from "./Pages/ProductDashboard.jsx";
import UserActivity from "./Pages/UserActivity.jsx";
import Orders from "./Pages/Orders.jsx";
import Profile from "./Pages/Profile.jsx";
import ForgotPassword from "./Pages/ForgotPassword.jsx";

//Rehab
import { CartProvider } from "./context/CartContext";
import ProductsPage from "./Pages/ProductsPage.jsx";
import CartPage from "./Pages/CartPage.jsx";
import CheckoutPage from "./Pages/CheckoutPage.jsx";
import CropRecommendation from "./Pages/CropRecommendation.jsx";
import FertilizerRecommendation from "./Pages/FertilizerRecommendation.jsx";

//Mohamed
import History from "./Pages/History.jsx";
import HistoryDetails from "./Pages/HistoryDetails.jsx";
import Chatbot from "./Pages/Chatbot.jsx";
import Reviews from "./Pages/Reviews.jsx";
import DetectPlantDiseases from "./Pages/DetectPlantDiseases.jsx";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

function AppContent() {
  const location = useLocation();
  const path = location.pathname;

  // الصفحات اللي مش عايزة فيها Navbar ولا Footer
  const noHeaderFooterPages = [
    "/login",
    "/signup",
    "/selection",
    "/home-dashboard",
    "/product-dashboard",
    "/user-activity",
    "/orders",
    "/forgot-password",
    // "/chatbot",
  ];

  const noFooterPages = ["/chatbot"];

  const noBottomBarPages = [
    "/login",
    "/signup",
    "/selection",
    "/home-dashboard",
    "/product-dashboard",
    "/user-activity",
    "/orders",
    "/forgot-password",
  ];

  const hideHeaderFooter = noHeaderFooterPages.includes(path);
  const hideBottomBar = noBottomBarPages.includes(path);
  const hideFooter = noFooterPages.includes(path);

  const hideChatbotButton = path === "/chatbot";

  return (
    <div className="min-h-screen flex flex-col font-inter">
      {/* <ScrollToTop /> */}
      <ToastContainer position="top-right" autoClose={3000} theme="light" />

      {!hideHeaderFooter && <Navbar />}

      <main className={`flex-grow ${!hideHeaderFooter ? "pt-16" : ""}`}>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/articles" element={<ArticlePage />} />
          <Route path="/selection" element={<SelectionEntry />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/home-dashboard" element={<HomeDashboard />} />
          <Route path="/product-dashboard" element={<ProductDashboard />} />
          <Route path="/user-activity" element={<UserActivity />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/profile" element={<Profile />} />

          <Route path="/products" element={<ProductsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/crop-recommendation" element={<CropRecommendation />} />
          <Route
            path="/fertilizer-recommendation"
            element={<FertilizerRecommendation />}
          />

          <Route path="/history" element={<History />} />
          <Route path="/history-details/:type" element={<HistoryDetails />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/add-review" element={<Reviews />} />
          <Route path="/detect-disease" element={<DetectPlantDiseases />} />
        </Routes>
      </main>

      {!hideHeaderFooter && !hideFooter && <Footer />}
      {!hideBottomBar && <BottomBar />}

      {/* Floating Chatbot Button*/}
      {!hideChatbotButton && (
        <Link
          to="/chatbot"
          style={{
            position: "fixed",
            bottom: "80px",
            right: "60px",
            zIndex: 9999,
          }}
        >
          <div className="text-4xl hover:scale-110 transition-all cursor-pointer ">
            {/* <div className="text-4xl hover:scale-110 transition-all cursor-pointer shadow-lg bg-white rounded-full p-2 flex items-center justify-center border border-gray-200"> */}
            🤖
          </div>
        </Link>
      )}
    </div>
  );
}

function App() {
  return (
    <CartProvider>
      <Router>
        <AppContent />
      </Router>
    </CartProvider>
  );
}

export default App;
