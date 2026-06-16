import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { API_ENDPOINTS } from "../api/endpoints";
import { useNavigate } from "react-router-dom";

/////////////////\\

function CropRecommendation() {
  const [recommendation, setRecommendation] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Crop Recommendation";
    window.scrollTo(0, 0);
  }, []);

  const fields = [
    {
      label: "Nitrogen (0-120):",
      placeholder: "Your N here",
      name: "nitrogen",
      min: 0,
      max: 120,
    },
    {
      label: "Phosphorus (0-50):",
      placeholder: "Your P here",
      name: "phosphorus",
      min: 0,
      max: 50,
    },
    {
      label: "Potassium (0-200):",
      placeholder: "Your K here",
      name: "potassium",
      min: 0,
      max: 200,
    },
    {
      label: "PH (7.0-8.5):",
      placeholder: "Your PH here",
      name: "ph",
      min: 7.0,
      max: 8.5,
    },
    {
      label: "Temperature (10-45):",
      placeholder: "Your (°C) here",
      name: "temperature",
      min: 10,
      max: 45,
    },
    {
      label: "Humidity (20-80):",
      placeholder: "Your humidity here",
      name: "humidity",
      min: 20,
      max: 80,
    },
    {
      label: "Month (1-12):",
      placeholder: "Your month here",
      name: "month",
      min: 1,
      max: 12,
    },
    {
      label: "Soil Type:",
      name: "soilType",
      isDropdown: true,
      options: [
        "clayey_delta",
        "loamy_clay",
        "alluvial",
        "sandy",
        "calcareous",
        "reclaimed",
      ],
    },
    {
      label: "Governorate:",
      name: "governorate",
      isDropdown: true,
      options: [
        "Cairo",
        "Alexandria",
        "Giza",
        "Qalyubia",
        "Monufia",
        "Gharbia",
        "Kafr el-Sheikh",
        "Dakahlia",
        "Sharqia",
        "Beheira",
        "Damietta",
        "Ismailia",
        "Suez",
        "Beni Suef",
        "Faiyum",
        "Minya",
        "Asyut",
        "Sohag",
        "Qena",
        "Luxor",
        "Aswan",
        "Red Sea",
        "New Valley",
        "Matruh",
        "North Sinai",
        "South Sinai",
      ],
    },
  ];

  const handleInputChange = (e, field) => {
    let value = e.target.value;
    if (!field.isDropdown) {
      value = value.replace(/[^0-9.]/g, "");
    }
    setFormData((prev) => ({ ...prev, [field.name]: value }));
    if (errors[field.name]) {
      setErrors((prev) => ({ ...prev, [field.name]: "" }));
    }
  };

  const handleRecommendation = async () => {
    const token = localStorage.getItem("token");
    //  لو مش عامل تسجيل دخول
    if (!token || token === "null") {
      toast.warn("Please login first to get recommendations! ");
      setTimeout(() => {
        navigate("/login", { state: { from: location.pathname } });
      }, 3000);
      return;
    }
    const newErrors = {};
    fields.forEach((field) => {
      const val = formData[field.name];
      if (!val || val === "") {
        newErrors[field.name] = "Required";
      } else if (!field.isDropdown) {
        const numVal = parseFloat(val);
        if (numVal < field.min || numVal > field.max) {
          newErrors[field.name] = `Range: ${field.min}-${field.max}`;
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setRecommendation(null);
      return;
    }

    const payload = {
      n: parseFloat(formData.nitrogen),
      p: parseFloat(formData.phosphorus),
      k: parseFloat(formData.potassium),
      temperature: parseFloat(formData.temperature),
      humidity: parseFloat(formData.humidity),
      ph: parseFloat(formData.ph),
      month: parseInt(formData.month),
      soil_type: formData.soilType,
      governorate: formData.governorate,
      userId: parseInt(localStorage.getItem("userId")) || 1,
    };

    setLoading(true);
    try {
      const headers = {
        "Content-Type": "application/json",
        Accept: "*/*",
        "ngrok-skip-browser-warning": "true",
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.post(
        `${API_ENDPOINTS.CROP_RECOMMENDATION}`,
        payload,
        { headers },
      );
      setRecommendation(response.data);
    } catch (err) {
      // تعديل هنا: التعامل مع الـ stringified JSON اللي بيجي من الباك
      let errorMessage = "Something went wrong. Please try again.";

      const responseData = err.response?.data;

      if (responseData) {
        // 1. لو موجود details، نحاول نعملها parse
        if (responseData.details) {
          try {
            const parsedDetails = JSON.parse(responseData.details);
            errorMessage =
              parsedDetails.detail || responseData.message || errorMessage;
          } catch (e) {
            errorMessage = responseData.details; // لو الـ parse فشل، نعرض الـ string زي ما هو
          }
        }
        // 2. لو مفيش details، ندور في الـ message أو detail مباشرة
        else {
          errorMessage =
            responseData.detail || responseData.message || errorMessage;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast.error(errorMessage);
      console.log("Error full response:", responseData);
    } finally {
      setLoading(false);
      setErrors({});
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
        .page-wrapper { background-color: #F7FEF4; min-height: 100vh; }
        .crop-main { padding-top: 60px; display: flex; flex-direction: column; align-items: center; padding-bottom: 80px; }
        .crop-title { color: #683A2F; font-size: 48px; font-weight: 900; margin-bottom: 15px; text-align: center; }
        .crop-subtitle { color: #4B4B4B; font-size: 18px; font-weight: 600; margin-bottom: 40px; text-align: center; max-width: 800px; line-height: 1.4; }
        .crop-card { background: white; padding: 50px; border-radius: 40px; width: 95%; max-width: 600px; border: 1px solid #E3D1C8; display: flex; flex-direction: column; align-items: center; }
        .fields-container { width: 100%; }
        .custom-input-group { border: 1.5px solid #683A2F; border-radius: 4px; padding: 10px 15px; margin-bottom: 20px; display: flex; flex-direction: column; align-items: flex-start; position: relative; }
        .field-label { color: #683A2F; font-weight: 700; font-size: 18px; margin-bottom: 2px; }
        .field-input { width: 100%; border: none; outline: none; font-size: 14px; color: #683A2F; background: transparent; padding: 0; appearance: none; }
        select.field-input { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23683A2F' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'%3E%3C/path%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 30px; cursor: pointer; color: #683A2F !important; }
        .error-text { color: red; font-size: 11px; position: absolute; bottom: -18px; left: 5px; font-weight: 600; }
        .submit-btn { width: 100%; max-width: 450px; background-color: #683A2F; color: white; padding: 18px; border: none; border-radius: 15px; font-weight: 700; font-size: 16px; cursor: pointer; margin-top: 15px; text-transform: uppercase; transition:background 0.3s; }
        .submit-btn:hover { background-color: #4F2016; }
        .submit-btn:disabled { background-color: #ccc; cursor: not-allowed; }

        .result-box { margin-top: 40px; width: 100%; animation: fadeIn 0.8s ease; border-top: 2px solid #F7FEF4; padding-top: 20px; }
        .main-msg { color: #683A2F; font-size: 20px; font-weight: 900; margin-bottom: 20px; text-align: center; line-height: 1.3; }
        .crops-list { display: flex; flex-direction: column; gap: 12px; width: 100%; }
        .crop-card-small { background: #F7FEF4; border: 1px solid #E3D1C8; padding: 15px; border-radius: 15px; text-align: left; transition: transform 0.2s; }
        .crop-card-small:hover { transform: scale(1.02); }
        .c-name { color: #683A2F; font-weight: 900; font-size: 18px; text-transform: capitalize; display: block; }
        .c-water { color: #4B4B4B; font-size: 13px; font-weight: 600; margin-top: 4px; display: block; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="page-wrapper">
        <main className="crop-main">
          <h1 className="crop-title">Crop Recommendation</h1>
          <p className="crop-subtitle">
            First, conduct a soil analysis; you will find these inputs
          </p>
          <div className="crop-card">
            <div className="fields-container">
              {fields.map((f, i) => (
                <div key={i} style={{ marginBottom: "25px" }}>
                  <div
                    className="custom-input-group"
                    style={{ borderColor: errors[f.name] ? "red" : "#683A2F" }}
                  >
                    <label className="field-label">{f.label}</label>
                    {f.isDropdown ? (
                      <select
                        className="field-input"
                        onChange={(e) => handleInputChange(e, f)}
                        value={formData[f.name] || ""}
                      >
                        <option value="" disabled>
                          Select {f.label.replace(":", "")}
                        </option>
                        {f.options.map((opt, index) => (
                          <option key={index} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="field-input"
                        type="text"
                        placeholder={f.placeholder}
                        value={formData[f.name] || ""}
                        onChange={(e) => handleInputChange(e, f)}
                      />
                    )}
                    {errors[f.name] && (
                      <span className="error-text">{errors[f.name]}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              className="submit-btn"
              onClick={handleRecommendation}
              disabled={loading}
            >
              {loading ? "Analyzing..." : "GET RECOMMENDATION"}
            </button>

            {recommendation && (
              <div className="result-box">
                <h2 className="main-msg">{recommendation.message}</h2>
                <div className="crops-list">
                  <p
                    style={{
                      color: "#683A2F",
                      fontWeight: "bold",
                      fontSize: "14px",
                      marginBottom: "5px",
                    }}
                  >
                    Top 3 Suggestions:
                  </p>
                  {recommendation.top_3_crops &&
                    recommendation.top_3_crops.map((item, idx) => (
                      <div key={idx} className="crop-card-small">
                        <span className="c-name">{item.crop_name}</span>
                        <span className="c-water">
                          💧 Water Needs: {item.water_needs}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

export default CropRecommendation;
