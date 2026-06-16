import { useState, useEffect } from "react";
import axios from "axios"; // نستخدم axios الخاص بمشروعك
import { API_ENDPOINTS } from "../api/endpoints"; // ربط المسارات
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

import uploadIcon from "../assets/icon.png";
import imageIcon from "../assets/image.png";
export default function Hero() {
  const [preview, setPreview] = useState(null);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.title = "Plant Disease Detection";
    window.scrollTo(0, 0);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
  };

  const handleClear = () => {
    setPreview(null);
    setImage(null);
    setResult(null);
  };

  const handlePredict = async () => {
    // التحقق من تسجيل الدخول أولاً باستخدام التوكن الخاص بمشروعك
    const token = localStorage.getItem("token");
    if (!token || token === "null") {
      toast.warn("Please login first to detect plant diseases!");
      setTimeout(() => {
        navigate("/login", { state: { from: location.pathname } });
      }, 3000);
      return;
    }
    if (!image) {
      alert("Please upload an image first!");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("Images", image);

    try {
      // ربط الـ POST بالـ Endpoint بتاعك
      const res = await axios.post(API_ENDPOINTS.DETECT_DISEASE, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`, // إرسال التوكن لضمان الصلاحية
        },
      });
      setResult(res.data);
      toast.success("Analysis complete!");

      try {
        await axios.post(
          API_ENDPOINTS.DETECT_HISTORY,
          {
            type: "disease",
            text: `Disease detected: ${res.data?.results?.[0]?.diagnosis?.disease || "Unknown"}`,
            img: preview,
            date: new Date().toLocaleString(),
            //       });
            //     } catch (historyErr) {
            //       console.error("History error:", historyErr);
            //     }
            //   } catch (err) {
            //     console.error("Predict error:", err);
            //     alert(
            //       err.response?.status === 401 ? "Unauthorized!" : "Connection error!",
            //     );
            //   } finally {
            //     setLoading(false);
            //   }
            // };
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      } catch (historyErr) {
        console.error("History error:", historyErr);
      }
    } catch (err) {
      console.error("Predict error:", err);
      toast.error(
        err.response?.status === 401 ? "Unauthorized!" : "Connection error!",
      );
    } finally {
      setLoading(false);
    }
  };

  const d = result?.results?.[0]?.diagnosis;

  return (
    <section className="bg-[#F7FEF4] pt-[40px] pb-[80px] flex flex-col items-center text-center font-['Inter'] px-4">
      <h1 className="text-[40px] md:text-[56px] font-extrabold text-[#683A2F] mb-[20px]">
        Detect Plant Diseases Instantly
      </h1>

      <p className="max-w-[700px] text-[#4B4B4B] text-[18px] mb-[50px]">
        Upload a photo of your plant and let our AI identify possible diseases
        in seconds.
      </p>

      <div className="w-full max-w-[420px] flex flex-col gap-[30px]">
        <div className="bg-white rounded-[30px] p-6 shadow-md">
          <div className="w-full aspect-square border-[3px] border-dashed border-[#D1D5DB] rounded-[24px] flex items-center justify-center bg-[#FAFAFA]">
            {preview ? (
              <img
                src={preview}
                className="w-full h-full object-contain p-4"
                alt="Preview"
              />
            ) : (
              <img
                src={uploadIcon}
                className="w-[80px] h-[80px] opacity-80"
                alt="Upload Icon"
              />
            )}
          </div>
        </div>

        {d && (
          <div className="bg-green-50 rounded-[20px] border border-green-200 p-4 w-full">
            <div className="bg-white rounded-[18px] shadow-md overflow-hidden text-left">
              <div className="border-b p-4 bg-white">
                <h3 className="text-[#683A2F] font-bold text-xl text-center">
                  Disease: {d.disease}
                </h3>
              </div>
              <div className="p-4 max-h-[320px] overflow-y-auto text-sm text-gray-700 space-y-5">
                <div>
                  <p>
                    <strong>Plant:</strong> {d.plant}
                  </p>
                  {/* <p>
                    <strong>Status:</strong> Diseased
                  </p> */}
                  <p>
                    <strong>Status:</strong>{" "}
                    {d.disease === "Healthy" ? "HEALTHY" : "DISEASED"}
                  </p>
                  {d.disease !== "Healthy" && (
                    <>
                      <p>
                        <strong>Severity:</strong> {d.severity || "High"}
                      </p>
                      <p>
                        <strong>Pathogen:</strong> {d.pathogen_type}
                      </p>
                    </>
                  )}
                </div>

                {/* حالة الورقة سليمة: عرض Care Tips فقط */}
                {d.disease === "Healthy" ? (
                  <div className="space-y-1">
                    <strong>Care Tips:</strong>
                    {d.care_tips?.length > 0 ? (
                      d.care_tips.map((tip, i) => <p key={i}>• {tip}</p>)
                    ) : (
                      <p>• Keep the plant in well-drained soil.</p>
                    )}
                  </div>
                ) : (
                  /* حالة الورقة مصابة: عرض الأعراض والوقاية والعلاج */
                  <>
                    <div className="space-y-1">
                      <strong>Symptoms:</strong>
                      {d.symptoms?.map((s, i) => (
                        <p key={i}>• {s}</p>
                      ))}
                    </div>
                    <div className="space-y-1">
                      <strong>Prevention:</strong>
                      {d.prevention?.map((p, i) => (
                        <p key={i}>• {p}</p>
                      ))}
                    </div>
                    <div className="space-y-1">
                      <strong>Treatment:</strong>
                      {d.treatment?.map((t, i) => (
                        <p key={i}>• {t}</p>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center mb-10">
          {!preview ? (
            <label className="cursor-pointer">
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileChange}
              />
              <div className="flex items-center gap-[12px] bg-[#683A2F] text-white px-[24px] py-[12px] rounded-[12px] font-bold hover:bg-[#50241F]">
                <img src={imageIcon} className="w-[20px] h-[20px]" alt="Add" />
                Add photo
              </div>
            </label>
          ) : (
            <div className="flex items-center gap-[12px]">
              <button
                onClick={handlePredict}
                disabled={loading}
                className="px-[20px] py-[12px] rounded-[12px] font-bold text-white bg-[#683A2F] hover:bg-[#50241F]"
              >
                {loading ? "Wait..." : "Predict"}
              </button>
              <button
                onClick={handleClear}
                className="px-[20px] py-[12px] rounded-[12px] font-bold bg-gray-200 hover:bg-gray-300"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
