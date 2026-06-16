import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { API_ENDPOINTS } from "../api/endpoints";
import { useNavigate } from "react-router-dom";

//
function FertilizerRecommendation() {
  const [recommendation, setRecommendation] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Fertilizer Recommendation";
    window.scrollTo(0, 0);
  }, []);

  const fields = [
    {
      label: "Crop Name:",
      placeholder: "Your crop here",
      name: "crop_name",
      isDropdown: false,
    },
    {
      label: "Nitrogen (0-120):",
      placeholder: "Your N here",
      name: "n",
      min: 0,
      max: 120,
    },
    {
      label: "Phosphorus (0-50):",
      placeholder: "Your P here",
      name: "p",
      min: 0,
      max: 50,
    },
    {
      label: "Potassium (0-200):",
      placeholder: "Your K here",
      name: "k",
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
      label: "Growth Stage:",
      name: "growth_stage",
      isDropdown: true,
      options: ["seedling", "vegetative", "flowering", "fruiting"],
    },
    {
      label: "Soil Type:",
      name: "soil_type",
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
    if (!field.isDropdown && field.name !== "crop_name") {
      value = value.replace(/[^0-9.]/g, "");
    }
    setFormData((prev) => ({ ...prev, [field.name]: value }));
    if (errors[field.name]) {
      setErrors((prev) => ({ ...prev, [field.name]: "" }));
    }
  };

  const handleRecommendation = async () => {
    // التحقق من وجود التوكن أولاً
    const token = localStorage.getItem("token");
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
      } else if (!field.isDropdown && field.name !== "crop_name") {
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
      crop_name: formData.crop_name,
      growth_stage: formData.growth_stage,
      n: parseFloat(formData.n),
      p: parseFloat(formData.p),
      k: parseFloat(formData.k),
      temperature: parseFloat(formData.temperature),
      humidity: parseFloat(formData.humidity),
      ph: parseFloat(formData.ph),
      month: parseInt(formData.month),
      soil_type: formData.soil_type,
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
        API_ENDPOINTS.FERTILIZER_RECOMMENDATION,
        payload,
        { headers },
      );
      setRecommendation(response.data);
    } catch (err) {
      const responseData = err.response?.data;
      if (
        responseData &&
        (responseData["Recommendation"] || responseData["Detected Issue"])
      ) {
        setRecommendation(responseData);
        return;
      }
      let errorMessage = "Something went wrong. Please try again.";
      if (responseData) {
        if (responseData.details) {
          try {
            const parsedDetails = JSON.parse(responseData.details);
            errorMessage =
              parsedDetails.detail || responseData.message || errorMessage;
          } catch (e) {
            errorMessage = responseData.details;
          }
        } else {
          errorMessage =
            responseData.detail || responseData.message || errorMessage;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
        .page-wrapper { background-color: #F7FEF4; min-height: 100vh; }
        .fert-main { padding-top: 60px; display: flex; flex-direction: column; align-items: center; padding-bottom: 80px; }
        .fert-title { color: #683A2F; font-size: 48px; font-weight: 900; margin-bottom: 15px; text-align: center; }
        .fert-subtitle { color: #4B4B4B; font-size: 18px; font-weight: 600; margin-bottom: 40px; text-align: center; max-width: 800px; line-height: 1.4; }
        .fert-card { background: white; padding: 50px; border-radius: 40px; width: 95%; max-width: 600px; border: 1px solid #E3D1C8; display: flex; flex-direction: column; align-items: center; }
        .fields-container { width: 100%; }
        .custom-input-group { border: 1.5px solid #683A2F; border-radius: 4px; padding: 10px 15px; margin-bottom: 20px; display: flex; flex-direction: column; align-items: flex-start; position: relative; }
        .field-label { color: #683A2F; font-weight: 700; font-size: 18px; margin-bottom: 2px; }
        .field-input { width: 100%; border: none; outline: none; font-size: 14px; color: #683A2F !important; background: transparent; padding: 0; appearance: none; }
        select.field-input { 
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23683A2F' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'%3E%3C/path%3E%3C/svg%3E"); 
          background-repeat: no-repeat; 
          background-position: right 10px center; 
          padding-right: 30px; 
          cursor: pointer; 
          color: #683A2F !important;
        }
        .error-text { color: red; font-size: 11px; position: absolute; bottom: -18px; left: 5px; font-weight: 600; }
        .submit-btn { width: 100%; max-width: 450px; background-color: #683A2F; color: white; padding: 18px; border: none; border-radius: 15px; font-weight: 700; font-size: 16px; cursor: pointer; margin-top: 15px; text-transform: uppercase; transition:background 0.3s; }
        .submit-btn:hover { background-color: #4F2016; }
        
        /* Result Styles */
        .result-box { margin-top: 40px; width: 100%; animation: fadeIn 0.8s ease; }
        .res-card { background: #F7FEF4; border: 1px solid #E3D1C8; padding: 20px; border-radius: 15px; margin-bottom: 15px; text-align: left; }
        .res-title { color: #683A2F; font-size: 16px; font-weight: 800; margin-bottom: 8px; }
        .res-text { color: #4B4B4B; font-size: 15px; line-height: 1.6; margin: 0; white-space: pre-line; }
        
        /* عشان يظهر الـ \n كسطور جديدة مرتبة */
        .res-text { color: #4B4B4B; font-size: 15px; line-height: 1.6; margin: 0; white-space: pre-line; }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="page-wrapper">
        <main className="fert-main">
          <h1 className="fert-title">Fertilizer Recommendation</h1>
          <p className="fert-subtitle">
            First, conduct a soil analysis; you will find these inputs
          </p>
          <div className="fert-card">
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
                {recommendation["Detected Issue"] && (
                  <div className="res-card">
                    <p className="res-title">Detected Issue:</p>
                    <p className="res-text">
                      {recommendation["Detected Issue"]}
                    </p>
                  </div>
                )}
                {recommendation["Recommendation"] && (
                  <div className="res-card">
                    <p className="res-title">Recommendation:</p>
                    <p className="res-text">
                      {recommendation["Recommendation"]}
                    </p>
                  </div>
                )}
                {recommendation["App Method"] && (
                  <div className="res-card">
                    <p className="res-title">App Method:</p>
                    <p className="res-text">{recommendation["App Method"]}</p>
                  </div>
                )}
                {recommendation["Why this choice?"] && (
                  <div className="res-card">
                    <p className="res-title">Why this choice?</p>
                    <p className="res-text">
                      {recommendation["Why this choice?"]}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

export default FertilizerRecommendation;
