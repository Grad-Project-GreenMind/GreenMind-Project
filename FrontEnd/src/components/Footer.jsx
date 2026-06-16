import React from "react";
import { useLocation } from "react-router-dom"; // شلنا Link من هنا
import { HashLink as Link } from "react-router-hash-link"; // هنستخدم دي كـ Link
import fbIcon from "../assets/Brown-Facebook.png";
import igIcon from "../assets/Instagram.png";
import twIcon from "../assets/Twitter.png";
import logo from "../assets/logo.png";

const Footer = () => {
  const location = useLocation();

  // active link
  const isActive = (path) => {
    const currentPath = location.pathname;
    const currentHash = location.hash;

    if (path.includes("#")) {
      const [basePath, hash] = path.split("#");
      return currentPath === basePath && currentHash === `#${hash}`;
    }
    if (path === "/") {
      return currentPath === "/" && currentHash === "";
    }
    return currentPath === path;
  };

  const getLinkStyle = (path) =>
    `no-underline transition-all ${isActive(path) ? "text-[#4CAF50] font-bold " : "hover:text-[#4CAF50] text-[#4B4B4B]"}`;

  return (
    <footer className="w-full font-inter bg-[#F7FEF4] py-16 md:py-24 px-10 md:px-20 border-t border-gray-100">
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-start gap-16">
        {/* Logos & Description */}
        <div className="flex-1 max-w-[350px] text-left">
          <img
            src={logo}
            alt="GreenMind Logo"
            className="w-16 h-16 mb-10 object-contain"
          />
          <p className="text-[#4B4B4B] text-[18px] font-normal leading-relaxed">
            Supporting smart and sustainable agriculture. <br />
            <br />
            Providing seeds, soil, and reliable growing solutions for all.
          </p>
        </div>

        {/* Pages*/}
        <div className="flex-1 max-w-[200px] text-left">
          <h3 className="text-[#683A2F] text-[24px] font-bold mb-10">Pages</h3>
          <ul className="space-y-4 text-[18px] font-normal list-none p-0 m-0">
            <li>
              <Link to="/" className={getLinkStyle("/")}>
                Home
              </Link>
            </li>
            <li>
              <Link to="/articles" className={getLinkStyle("/articles")}>
                Articles
              </Link>
            </li>
            <li>
              <Link to="/#why-us" className={getLinkStyle("/#why-us")}>
                Why Us
              </Link>
            </li>
            <li>
              <Link to="/#features" className={getLinkStyle("/#features")}>
                Features
              </Link>
            </li>
            <li>
              <Link to="/#products" className={getLinkStyle("/#products")}>
                Products
              </Link>
            </li>
            <li>
              <Link to="/#reviews" className={getLinkStyle("/#reviews")}>
                Reviews
              </Link>
            </li>
            <li>
              <Link to="/#faq" className={getLinkStyle("/#faq")}>
                FAQ
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div className="flex-1 max-w-[300px] text-left">
          <h3 className="text-[#683A2F] text-[24px] font-bold mb-10">
            Contact
          </h3>
          <div className="space-y-5 text-[#4B4B4B] text-[18px] font-normal">
            <a
              href="tel:+201023456789"
              className="block no-underline hover:text-[#4CAF50] transition-colors"
            >
              +201023456789
            </a>

            <a
              href="mailto:support@GreenMind.com"
              className="block no-underline hover:text-[#4CAF50] transition-colors"
            >
              support@GreenMind.com
            </a>
            <p className="m-0">Al-Kaiman, Al-Fayoum-Egypt</p>

            <div className="flex space-x-6 pt-6">
              <a href="#" className="hover:scale-110 transition-transform">
                <img src={fbIcon} alt="FB" className="w-10 h-10" />
              </a>
              <a href="#" className="hover:scale-110 transition-transform">
                <img src={igIcon} alt="IG" className="w-10 h-10" />
              </a>
              <a href="#" className="hover:scale-110 transition-transform">
                <img src={twIcon} alt="TW" className="w-10 h-10" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
