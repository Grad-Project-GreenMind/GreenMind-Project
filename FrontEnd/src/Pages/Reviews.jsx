import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "../api/endpoints";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
const Reviews = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const inputStyle = {
    height: "60px",
    borderRadius: "10px",
    fontSize: "18px",
    fontWeight: "400",
    paddingLeft: "20px",
    border: "1px solid #CCCCCC",
    width: "100%",
    outline: "none",
    color: "#4B4B4B",
  };

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    // position: "",
    email: "",
    message: "",
  });

  const [userImg, setUserImg] = useState(null); // لعرض صورة البروفايل

  useEffect(() => {
    document.title = "Reviews";
    window.scrollTo(0, 0);

    // جلب بيانات البروفايل عشان نعبي الاسم والوظيفة تلقائياً
    const fetchUserProfile = async () => {
      const token = localStorage.getItem("token"); //
      if (token && token !== "null") {
        try {
          const response = await axios.get(API_ENDPOINTS.GET_PROFILE, {
            headers: {
              Authorization: `Bearer ${token}`,
              "ngrok-skip-browser-warning": "69420",
            },
          });
          const { profilePic } = response.data;
          setUserImg(profilePic);
        } catch (err) {
          console.error("Error fetching profile", err);
        }
      }
    };
    fetchUserProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // التحقق من  تسجيل الدخول أولاً
    const token = localStorage.getItem("token");
    if (!token || token === "null") {
      toast.warn("Please login first to leave a review! ");
      setTimeout(() => {
        navigate("/login", { state: { from: location.pathname } });
      }, 3000);
      return;
    }

    // ✅ validation
    if (
      !formData.name ||
      !formData.phone ||
      !formData.email ||
      !formData.message
    ) {
      // alert("Please fill all required fields");
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      const payload = {
        ...formData,
        userImage: userImg,
      };

      await axios.post(API_ENDPOINTS.REVIEWS, payload, { headers });
      // alert("Review submitted successfully! ✅");
      toast.success("Review submitted successfully! ");

      setFormData({
        name: "",
        phone: "",
        // position: "",
        email: "",
        message: "",
      });

      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      console.log("ERROR:", error.response?.data || error.message);
      // alert("Error submitting review ❌");
      toast.error("Error submitting review ");
    }
  };

  return (
    <div className="font-['Inter'] bg-[#F7FEF4] min-h-screen flex flex-col pt-2">
      <main className="flex-grow flex flex-col items-center py-16 px-4">
        <h1 className="text-[#683A2F] text-[36px] md:text-[42px] font-bold mb-2 text-center">
          Customer Reviews
        </h1>

        <h2 className="text-[#683A2F] text-[24px] md:text-[28px] font-bold mb-10 text-center">
          Leave Your Review
        </h2>

        {/* <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col"
          style={{ maxWidth: "800px", gap: "30px" }}
        > */}

        <form
          onSubmit={handleSubmit}
          className="w-full max-w-[800px] flex flex-col gap-[20px]"
          style={{ maxWidth: "800px" }}
        >
          {/* عرض صورة اليوزر لو موجودة */}
          {/* {userImg && (
            <div className="flex justify-center mb-4">
              <img
                src={userImg}
                className="w-24 h-24 rounded-full object-cover border-4 border-[#683A2F]"
                alt="Profile"
              />
            </div>
          )} */}
          <input
            type="text"
            placeholder="Name"
            style={inputStyle}
            className="focus:border-[#683A2F] bg-white shadow-sm"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <input
            type="text"
            placeholder="Phone"
            style={inputStyle}
            className="focus:border-[#683A2F] bg-white shadow-sm"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />

          {/* <input
            type="text"
            placeholder="Position"
            style={inputStyle}
            className="focus:border-[#683A2F] bg-white shadow-sm"
            value={formData.position}
            onChange={(e) =>
              setFormData({ ...formData, position: e.target.value })
            }
          /> */}

          <input
            type="email"
            placeholder="Email"
            style={inputStyle}
            className="focus:border-[#683A2F] bg-white shadow-sm"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />

          <textarea
            placeholder="Write your feedback here..."
            style={{
              ...inputStyle,
              height: "220px",
              paddingTop: "20px",
              resize: "none",
            }}
            className="focus:border-[#683A2F] bg-white shadow-sm"
            value={formData.message}
            onChange={(e) =>
              setFormData({ ...formData, message: e.target.value })
            }
          ></textarea>

          <div className="flex justify-center" style={{ margin: "20px 0" }}>
            <button
              type="submit"
              className="bg-[#683A2F] text-white font-bold hover:opacity-90 transition shadow-md"
              style={{
                width: "220px",
                height: "60px",
                fontSize: "22px",
                borderRadius: "12px",
                cursor: "pointer",
              }}
            >
              Submit
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Reviews;
