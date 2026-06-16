import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";
import menuIcon from "../assets/Menu.png";
import { toast } from "react-toastify";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeHash, setActiveHash] = useState("");

  useEffect(() => {
    setActiveHash(location.hash);
  }, [location]);

  const handleLogout = () => {
    toast.info("Logging out...");
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    setIsMenuOpen(false);
    setTimeout(() => {
      navigate("/selection");
      window.location.reload();
    }, 1000);
  };

  const isActive = (path) => {
    const currentPath = location.pathname;
    if (path === "/") return currentPath === "/" && activeHash === "";
    if (path.includes("#")) {
      const [basePath, hash] = path.split("#");
      const isSamePage =
        currentPath === basePath || (basePath === "/" && currentPath === "/");
      return isSamePage && activeHash === `#${hash}`;
    }
    return currentPath === path;
  };

  const handleNavClick = (path) => {
    setIsMenuOpen(false);
    if (path === "/") {
      setActiveHash("");
      if (location.pathname === "/") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        navigate("/", { replace: true });
      } else {
        navigate("/");
        setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
      }
    } else if (path.includes("#")) {
      const [basePath, id] = path.split("#");
      setActiveHash(`#${id}`);
      navigate(path);
      if (location.pathname === "/" || location.pathname === basePath) {
        const element = document.getElementById(id);
        if (element) element.scrollIntoView({ behavior: "smooth" });
      } else {
        setTimeout(() => {
          const element = document.getElementById(id);
          if (element) element.scrollIntoView({ behavior: "smooth" });
        }, 300);
      }
    } else {
      navigate(path);
    }
  };

  const linkStyles =
    "text-[18px] font-semibold text-[#683A2F] no-underline transition-all duration-300 tracking-widest cursor-pointer bg-transparent border-none outline-none focus:outline-none relative pb-2";

  return (
    <header className="bg-[#E3D1C8] fixed top-0 left-0 w-full z-50 shadow-sm font-inter">
      <div className="max-w-full mx-auto h-16 px-2 md:px-6 flex justify-between items-center relative">
        <div
          className="flex items-center cursor-pointer"
          onClick={() => handleNavClick("/")}
        >
          <img
            src={logo}
            alt="Logo"
            className="w-10 h-10 md:w-12 md:h-12 object-contain"
          />
        </div>

        <nav className="hidden md:flex space-x-8">
          {links.map((link) => {
            const active = isActive(link.path);
            return (
              <button
                key={link.path}
                onClick={() => handleNavClick(link.path)}
                className={linkStyles}
                style={{
                  borderBottom: active
                    ? "3px solid #683A2F"
                    : "3px solid transparent",
                  opacity: active ? "1" : "0.7",
                  transition: "all 0.3s ease",
                }}
              >
                {link.name}
              </button>
            );
          })}
        </nav>

        <div className="relative flex items-center">
          <div
            className="cursor-pointer ml-4"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <img
              src={menuIcon}
              alt="Menu"
              className="w-8 h-auto opacity-80 hover:opacity-100"
            />
          </div>

          <div
            className={`absolute right-0 mt-2 w-56 bg-[#E3D1C8] shadow-2xl rounded-xl overflow-hidden transition-all duration-300 z-[100] ${
              isMenuOpen
                ? "opacity-100 translate-y-2 scale-100"
                : "opacity-0 -translate-y-4 scale-95 pointer-events-none"
            }`}
            style={{ top: "100%" }}
          >
            <nav className="flex flex-col p-4 space-y-2">
              <div className="md:hidden flex flex-col space-y-2">
                {links.map((link) => {
                  const active = isActive(link.path);
                  return (
                    <button
                      key={link.path}
                      onClick={() => handleNavClick(link.path)}
                      className="text-[18px] font-semibold text-[#683A2F] py-2 px-3 text-left cursor-pointer"
                      style={{
                        borderLeft: active
                          ? "4px solid #683A2F"
                          : "4px solid transparent",
                        backgroundColor: active
                          ? "rgba(104, 58, 47, 0.1)"
                          : "transparent",
                      }}
                    >
                      {link.name}
                    </button>
                  );
                })}
              </div>

              {localStorage.getItem("token") ? (
                <>
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setIsMenuOpen(false);
                    }}
                    className="text-[18px] font-semibold text-[#683A2F] py-2 px-3 text-left cursor-pointer"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => {
                      navigate("/history");
                      setIsMenuOpen(false);
                    }}
                    className="text-[18px] font-semibold text-[#683A2F] py-2 px-3 text-left cursor-pointer"
                  >
                    History
                  </button>
                  <button
                    onClick={handleLogout}
                    className="text-[18px] font-semibold text-red-700 py-2 px-3 text-left cursor-pointer"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    navigate("/selection");
                    setIsMenuOpen(false);
                  }}
                  className="text-[18px] font-semibold text-[#683A2F] py-2 px-3 text-left"
                >
                  Sign Up
                </button>
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

const links = [
  { name: "Home", path: "/" },
  { name: "Articles", path: "/articles" },
  { name: "Why Us", path: "/#why-us" },
  { name: "Features", path: "/#features" },
  { name: "Products", path: "/#products" },
  { name: "Reviews", path: "/#reviews" },
  { name: "FAQ", path: "/#faq" },
];

export default Navbar;
