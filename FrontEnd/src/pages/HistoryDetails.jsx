import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { API_ENDPOINTS } from "../api/endpoints";
import { toast } from "react-toastify";

// Icons
import PlantIcon from "../assets/PlantDiseaseDetection.png";
import CropIcon from "../assets/CropRecommendation.png";
import FertilizerIcon from "../assets/FertilizerRecommendation.png";
import OrdersIcon from "../assets/MyOrders.png";
import CommentIcon from "../assets/comment.png";
import RemoveIcon from "../assets/Remove.png";

const HistoryDetails = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);

  const config = {
    disease: {
      title: "Plant Disease Detection",
      icon: PlantIcon,
      bg: "#E6D0C5",
    },
    crop: { title: "Crop Recommendation", icon: CropIcon, bg: "#D5E8D4" },
    fertilizer: {
      title: "Fertilizer Recommendation",
      icon: FertilizerIcon,
      bg: "#FFF2CC",
    },
    orders: { title: "My Orders", icon: OrdersIcon, bg: "#F8CECC" },
  };

  const current = config[type] || config.disease;

  useEffect(() => {
    const fetchHistory = async () => {
      // التحقق من تسجيل الدخول
      const token = localStorage.getItem("token");
      if (!token || token === "null") {
        toast.warn("Please login first to see your history details! ");
        setTimeout(() => {
          navigate("/login", { state: { from: location.pathname } });
        }, 3000);
        return;
      }

      try {
        setLoading(true);
        const headers = {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true", // لتخطي تحذير ngrok
        };

        const res = await axios.get(`${API_ENDPOINTS.HISTORY}/${type}`, {
          headers,
        });
        const data = res.data.results || res.data || [];

        const normalized = data.map((item) => ({
          id: item.id,
          text:
            item.diagnosis?.plant && item.diagnosis?.disease
              ? `${item.diagnosis.plant} - ${item.diagnosis.disease}`
              : item.text || "",
          date: item.date || "",
          image: item.permanentImageUrl || item.image || null,
        }));
        setDetails(normalized);
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to load history data");
        setDetails([]);
      } finally {
        setLoading(false);
      }
    };
    if (type) fetchHistory();
  }, [type, navigate, location.pathname]);

  const deleteSingleItem = async (id) => {
    const token = localStorage.getItem("token"); //الحصول على التوكن للحذف
    try {
      await axios.delete(`${API_ENDPOINTS.HISTORY}/${type}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await api.delete(`/api/History/${type}/${id}`);
      setDetails((prev) => prev.filter((item) => item.id !== id));
      toast.success("Item removed successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete item");
    }
  };

  const clearAllHistory = async () => {
    // بنعرض Toast مخصص فيه زراير التأكيد
    toast.info(
      <div className="flex flex-col gap-3">
        <p className="font-bold text-[#683A2F]">
          Are you sure you want to clear all history?
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={async () => {
              toast.dismiss();
              try {
                const token = localStorage.getItem("token");
                await axios.delete(`${API_ENDPOINTS.HISTORY}/${type}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                setDetails([]);
                toast.success("History cleared successfully");
              } catch (error) {
                console.error(error);
                toast.error("Failed to clear history");
              }
            }}
            className="bg-[#C62828] text-white px-4 py-1 rounded-md text-sm font-bold"
          >
            Confirm
          </button>
          <button
            onClick={() => toast.dismiss()}
            className="bg-gray-200 text-[#683A2F] px-4 py-1 rounded-md text-sm font-bold"
          >
            Cancel
          </button>
        </div>
      </div>,
      {
        position: "top-right",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
        closeButton: false,
      },
    );
  };

  return (
    <main className="flex-grow flex flex-col items-center pt-10 pb-20 px-4 bg-[#F7FEF4] min-h-screen font-['Inter']">
      <h1 className="text-[36px] font-bold text-[#683A2F] mb-2">
        Activity History
      </h1>

      <p className="text-[#1E1E1E] mb-12 text-[18px] font-semibold">
        Let’s Get You Growing!
      </p>

      <div className="w-full max-w-[650px] flex flex-col items-start">
        {/* HEADER */}
        <div
          className="flex items-center gap-6 pl-10 pr-4 py-5 rounded-[15px] shadow-sm"
          style={{
            backgroundColor: current.bg,
            width: "320px",
            height: "90px",
            marginBottom: "35px",
          }}
        >
          <img src={current.icon} className="w-[28px] h-[28px]" alt="icon" />
          <span className="font-bold text-[20px] text-[#683A2F]">
            {current.title}
          </span>
        </div>

        {/* CONTENT */}
        <div className="w-full rounded-[30px] p-8 bg-[#EEE4DA] min-h-[400px] shadow-md">
          <h2 className="text-white font-bold text-[28px] mb-8 text-center">
            Your history
          </h2>

          <div className="flex flex-col gap-6">
            {loading ? (
              <p className="text-[#683A2F] font-bold text-center">Loading...</p>
            ) : details.length > 0 ? (
              details.map((item) => (
                <div
                  key={item.id}
                  className="p-6 flex justify-between items-start bg-white rounded-[20px] shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate("/features", { state: item })}
                >
                  {/* LEFT */}
                  <div className="flex gap-4 flex-1">
                    <img
                      src={CommentIcon}
                      className="w-[28px] h-[28px] mt-1"
                      alt="comment"
                    />
                    <div className="flex flex-col w-full pr-2">
                      <p className="text-[#5D4037] text-[12px] font-bold whitespace-pre-line mb-3 leading-relaxed">
                        {item.text}
                      </p>
                      <span className="text-[#4CAF50] text-[10px] font-bold">
                        {item.date}
                      </span>
                    </div>
                  </div>

                  {/* RIGHT IMAGE */}
                  <div className="flex flex-col items-end ml-4">
                    <img
                      src={item.image || "https://via.placeholder.com/90"}
                      alt="result"
                      className="w-[90px] h-[55px] object-cover rounded-[10px] border border-gray-100"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/90";
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSingleItem(item.id);
                      }}
                      className="mt-3 opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <img
                        src={RemoveIcon}
                        className="w-[14px] h-[14px]"
                        alt="remove"
                      />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[#683A2F] font-bold text-center">
                No history available
              </p>
            )}
          </div>

          {details.length > 0 && (
            <div className="w-full flex justify-center">
              <button
                onClick={clearAllHistory}
                className="bg-[#C62828] hover:bg-[#B71C1C] text-white text-[14px] font-bold py-2 px-10 rounded-[10px] mt-10 transition-colors shadow-lg"
              >
                Remove history
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default HistoryDetails;
