import React, { useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

import PlantIcon from "../assets/PlantDiseaseDetection.png";
import CropIcon from "../assets/CropRecommendation.png";
import FertilizerIcon from "../assets/FertilizerRecommendation.png";
import OrdersIcon from "../assets/MyOrders.png";

const History = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.title = "History";
    window.scrollTo(0, 0);

    const token = localStorage.getItem("token");
    if (!token || token === "null") {
      toast.warn("Please login first to view your history! ");
      setTimeout(() => {
        navigate("/login", { state: { from: location.pathname } });
      }, 3000);
    }
  }, [navigate, location.pathname]);

  const buttons = [
    {
      title: "Plant Disease Detection",
      icon: PlantIcon,
      link: "/history-details/disease",
    },
    {
      title: "Crop Recommendation",
      icon: CropIcon,
      link: "/history-details/crop",
    },
    {
      title: "Fertilizer Recommendation",
      icon: FertilizerIcon,
      link: "/history-details/fertilizer",
    },
    {
      title: "My Orders",
      icon: OrdersIcon,
      link: "/history-details/orders",
    },
  ];

  //  منع عرض المحتوى لو مش مسجل
  const token = localStorage.getItem("token");
  if (!token || token === "null") {
    return <div className="min-h-screen bg-[#F7FEF4]"></div>;
  }

  return (
    <main className="flex-grow flex flex-col items-center pt-10 px-4 bg-[#F7FEF4] min-h-screen font-['Inter']">
      <h1 className="text-[32px] md:text-[40px] font-bold text-[#683A2F] mb-2 text-center">
        Activity History
      </h1>

      <p className="text-[#1E1E1E] mb-12 text-center text-[20px] font-[600]">
        Let’s Get You Growing!
      </p>

      {/*  الكروت */}
      <div
        className="w-full max-w-[850px] px-4"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          columnGap: "60px",
          rowGap: "40px",
          marginBottom: "50px",
        }}
      >
        {buttons.map((btn, index) => (
          <Link
            key={index}
            to={btn.link}
            className="block w-full no-underline group"
          >
            <div className="bg-white flex items-center px-5 rounded-[15px] transition-all duration-300 group-hover:-translate-y-2 shadow-[0_15px_35px_rgba(0,0,0,0.3)] border border-white/80 h-[90px]">
              <div className="w-[50px] h-[50px] flex items-center justify-center mr-4 shrink-0">
                <img
                  src={btn.icon}
                  alt={btn.title}
                  className="w-[35px] h-[35px] object-contain"
                />
              </div>

              <span className="text-[#683A2F] text-[18px] font-[700] leading-[1.2]">
                {btn.title}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* مربع حذف الهيستوري */}
      <div className="bg-white rounded-[20px] text-center shadow-[0_15px_40px_rgba(0,0,0,0.5)] flex flex-col justify-center items-center p-6 mb-20 w-[325px] h-[110px]">
        <p className="text-[#683A2F] font-bold text-[16px] mb-6">
          Do you want to remove all history records?
        </p>

        <div className="flex justify-center gap-10">
          <button className="bg-[#D32F2F] text-white text-[16px] font-bold py-2 px-10 rounded-[10px] hover:opacity-90 transition shadow-md">
            Confirm
          </button>
          <button className="bg-[#E8F5E9] text-[#2E7D32] text-[16px] font-bold py-2 px-10 rounded-[10px] hover:bg-[#C8E6C9] transition border border-[#C8E6C9]">
            Cancel
          </button>
        </div>
      </div>
    </main>
  );
};

export default History;
