import React from "react";
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

import Home from "./pages/Home";

import SelectionEntry from "./pages/SelectionEntry";
import ArticlePage from "./pages/ArticlePage";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import HomeDashboard from "./pages/HomeDashboard";
import ProductDashboard from "./pages/ProductDashboard";
import UserActivity from "./pages/UserActivity";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";

//Rehab
import { CartProvider } from "./context/CartContext";
import ProductsPage from "./pages/ProductsPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import CropRecommendation from "./pages/CropRecommendation";
import FertilizerRecommendation from "./pages/FertilizerRecommendation";

//Mohamed
import History from "./pages/History";
import HistoryDetails from "./pages/HistoryDetails";
import Chatbot from "./pages/Chatbot.jsx";
import Reviews from "./pages/Reviews";
import DetectPlantDiseases from "./pages/DetectPlantDiseases";

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

  // لاخفاء الزرار العائم لو احنا جوه صفحة الشات بوت فعلا
  const hideChatbotButton = path === "/chatbot";

  return (
    <div className="min-h-screen flex flex-col font-inter">
      {/* <ScrollToTop /> */}
      <ToastContainer position="top-right" autoClose={3000} theme="light" />

      {!hideHeaderFooter && <Navbar />}

      {/* التعديل هنا: ضفنا pt-20 عشان نمنع الكلام يلزق في الناف بار */}
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
