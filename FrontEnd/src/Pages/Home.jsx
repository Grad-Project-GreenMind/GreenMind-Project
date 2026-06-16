import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_ENDPOINTS, BASE_URL } from "../api/endpoints";

import backPhoto from "../assets/back photo.png";
import lineImage from "../assets/line.png";
import detection from "../assets/detection.png";
import com from "../assets/com.png";
import man from "../assets/man.png";
import faq from "../assets/faq.png";
import croop from "../assets/croop.png";
import fert from "../assets/fert.png";
import hand from "../assets/hand.png";
import crop from "../assets/crop.png";
const features = [
  {
    title: "Plant Disease Detection",
    img: crop,
    icon: com,
    to: "/detect-disease",
  },
  {
    title: "Crop Recommendation",
    img: croop,
    icon: com,
    to: "/crop-recommendation",
  },
  {
    title: "Fertilizer Recommendation",
    img: fert,
    icon: com,
    to: "/fertilizer-recommendation",
  },
];

const Home = () => {
  const [reviews, setReviews] = useState([]);
  const [current, setCurrent] = useState(0);
  const [openFAQ, setOpenFAQ] = useState(null);
  const navigate = useNavigate();

  const faqs = [
    {
      q: "Do you offer delivery service?",
      a: "Yes, we provide delivery service depending on your location.",
    },
    {
      q: "Do you offer delivery service?",
      a: "Delivery usually takes between 2-5 business days.",
    },
    {
      q: "Do you offer delivery service?",
      a: "You can track your order from your account dashboard.",
    },
    {
      q: "Do you offer delivery service?",
      a: "Delivery is available for most products.",
    },
  ];

  // جلب الريفيوهات من السيرفر
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await axios.get(API_ENDPOINTS.REVIEWS);
        setReviews(res.data);
      } catch (err) {
        console.error("Error fetching reviews:", err);
      }
    };
    fetchReviews();
  }, []);

  const toggleFAQ = (index) => setOpenFAQ(openFAQ === index ? null : index);
  const prevFeature = () =>
    setCurrent((prev) => (prev === 0 ? features.length - 1 : prev - 1));
  const nextFeature = () =>
    setCurrent((prev) => (prev === features.length - 1 ? 0 : prev + 1));

  return (
    <div className="flex flex-col min-h-screen w-full overflow-x-hidden font-['Inter'] bg-[#F7FEF4]">
      <main className="flex-grow w-full">
        {/* Hero Section */}
        <section className="relative w-full h-[85vh] overflow-hidden">
          <div className="absolute inset-0 w-full h-full z-0">
            <img
              src={backPhoto}
              alt="Smart Farming"
              className="w-full h-full object-cover brightness-40"
            />
          </div>
          <div className="absolute z-10 top-1/2 -translate-y-1/2 left-[15%] md:left-[20%] w-full max-w-[1076px] px-6">
            <h1 className="text-[40px] md:text-[70px] font-[800] italic leading-[1.1] mb-6 text-[#F5E1CF] drop-shadow-2xl">
              Your Smart Farming <br /> Assistant
            </h1>
            <p className="text-[18px] md:text-[28px] mb-8 max-w-[760px] leading-snug text-white">
              Discover helpful articles about smart farming, modern techniques,
              and how AI can improve your crops.
            </p>
            <button
              onClick={() => navigate("/articles")}
              className="bg-[#AA9890] hover:bg-[#91817a] text-white px-[50px] py-[16px] rounded-[25px] text-[20px] font-semibold transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              Read more
            </button>
          </div>
        </section>
        {/* Why Choose Us */}
        <section id="why-us" className="relative w-full py-28 overflow-hidden">
          <img
            src={lineImage}
            alt="line"
            className="absolute left-1/2 top-40 -translate-x-1/2 w-[900px] md:w-[1000px] lg:w-[1200px] z-0"
          />
          <div className="relative z-10 max-w-7xl mx-auto px-6">
            <div className="mb-16">
              <h2 className="text-[32px] font-bold text-[#5A3E36]">
                Why Choose Us?
              </h2>
              <p className="text-gray-600 mt-2 text-base md:text-lg">
                More than 10+ years of experience
              </p>
            </div>
            <div className="relative h-[500px] text-gray-700 text-base leading-relaxed">
              <p className="absolute left-0 top-[400px] w-full text-[#4B4B4B]">
                At GreenMind AI, we make farming smarter <br /> and easier with
                the power of AI.
              </p>
              <p className="absolute left-1/2 -translate-x-1/2 top-[245px] w-full text-center text-[#4B4B4B]">
                Our tools help farmers detect plant diseases, <br /> choose the
                best crops, and get instant recommendations.
              </p>
              <p className="absolute right-0 top-[50px] w-full text-right text-[#4B4B4B]">
                We focus on saving time, resources, <br /> and making
                agriculture more sustainable.
              </p>
            </div>
          </div>
        </section>
        {/* Features Section */}
        <section id="features" className="w-full py-20 bg-[#F7FEF4]">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h2 className="text-[32px] md:text-[40px] font-bold text-[#5A3E36] mb-4">
              Features
            </h2>

            <p className="text-gray-600 mb-16">
              Discover helpful articles about smart farming.
            </p>

            <div className="flex items-center justify-center">
              <div className="flex gap-12 items-center flex-wrap justify-center">
                {features.map((feature, index) => {
                  return (
                    <Link
                      to={feature.to}
                      key={index}
                      className="
                flex flex-col items-center
                transition-all duration-500
                cursor-pointer
                no-underline
                transform
                opacity-40 scale-90
                hover:opacity-100 hover:scale-105
              "
                    >
                      {/* Title */}
                      <h3 className="text-lg font-semibold text-[#5A3E36] mb-4">
                        {feature.title}
                      </h3>

                      <div
                        className="
                w-[280px]
                h-[200px]
                overflow-hidden
                rounded-[40px]
                shadow-lg
              "
                      >
                        <img
                          src={feature.img}
                          className="
                    w-full
                    h-full
                    object-cover
                    transition-all duration-500
                    hover:scale-110
                  "
                          alt={feature.title}
                        />
                      </div>

                      {/* Icon */}
                      <div
                        className="
                w-[50px]
                h-[50px]
                bg-[#C36B53]
                rounded-full
                flex
                items-center
                justify-center
                mt-5
                shadow-md
              "
                      >
                        <img
                          src={feature.icon}
                          className="w-[24px]"
                          alt="icon"
                        />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Products */}
        <section id="products" className="w-full py-20 bg-[#F7FEF4]">
          <div className="max-w-7xl mx-auto px-6">
            {/* Header */}
            <div className="flex flex-col items-center mb-12">
              <h2 className="text-[32px] font-bold text-[#5A2D21]">Products</h2>

              <div className="w-full flex justify-between items-center mt-6">
                <p className="text-gray-600 text-[18px]">
                  From seeds to soil — we help you grow better.
                </p>

                <button
                  onClick={() => navigate("/products")}
                  className="flex items-center gap-2 text-[16px] text-gray-700 cursor-pointer"
                >
                  Explore All
                  <span className="bg-gray-200 rounded-full w-7 h-7 flex items-center justify-center">
                    ↗
                  </span>
                </button>
              </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
              <div className="bg-[#E9EFE6] rounded-[25px] p-6 w-full max-w-[400px] h-[250px] flex flex-col justify-between border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-[#5A2D21] font-semibold text-[32px]">
                      Soil
                    </h3>

                    <p className="text-gray-500 text-sm mt-3 max-w-[180px] leading-relaxed">
                      Discover helpful articles about smart farming, modern
                      techniques.
                    </p>
                  </div>

                  <img
                    src={hand}
                    alt="soil"
                    className="w-[120px] h-[160px] object-cover rounded-[25px]"
                  />
                </div>

                <button
                  onClick={() => navigate("/products?category=Soil")}
                  className="flex items-center gap-2 text-sm font-medium text-[#5A2D21]"
                >
                  Explore Now
                  <span className="bg-[#5A2D21] text-white rounded-full w-7 h-7 flex items-center justify-center">
                    →
                  </span>
                </button>
              </div>

              {/* Seeds Card */}
              <div className="bg-[#D8C7BC] rounded-[25px] p-6 w-[400px] h-[250px] flex flex-col justify-between border border-gray-200">
                <h3 className="text-[#5A2D21] font-semibold text-[32px]">
                  Seeds
                </h3>

                <button
                  onClick={() => navigate("/products?category=Seeds")}
                  className="flex items-center gap-2 text-sm font-medium text-[#5A2D21]"
                >
                  Explore Now
                  <span className="bg-[#5A2D21] text-white rounded-full w-7 h-7 flex items-center justify-center">
                    →
                  </span>
                </button>
              </div>

              {/* Tools Card */}
              <div className="bg-[#D8C7BC] rounded-[25px] p-6 w-[400px] h-[250px] flex flex-col justify-between border border-gray-200">
                <h3 className="text-[#5A2D21] font-semibold text-[32px]">
                  Tools
                </h3>

                <button
                  onClick={() => navigate("/products?category=Tools")}
                  className="flex items-center gap-2 text-sm font-medium text-[#5A2D21]"
                >
                  Explore Now
                  <span className="bg-[#5A2D21] text-white rounded-full w-7 h-7 flex items-center justify-center">
                    →
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section id="reviews" className="w-full py-28 bg-[#F7FEF4] mb-32">
          <div className="max-w-7xl mx-auto px-6">
            <div className="relative w-full mb-20">
              <h2 className="text-[32px] font-bold text-[#5A2D21] text-center">
                What our Customer say?
              </h2>

              <button
                onClick={() => navigate("/add-review")}
                className="absolute right-0 bottom-[-30px] flex items-center gap-2 text-[16px] text-gray-700 cursor-pointer transition-all hover:opacity-80"
              >
                Add a Review
                <span className="bg-gray-200 rounded-full w-7 h-7 flex items-center justify-center">
                  ↗
                </span>
              </button>
            </div>

            <div className="flex gap-8 overflow-x-auto pb-10 px-2 scroll-smooth no-scrollbar">
              {reviews.length > 0 ? (
                reviews.map((rev, index) => (
                  <div
                    key={index}
                    className="rounded-[20px] p-6 flex flex-col items-center w-[400px] h-[280px] border border-gray-200 bg-[#F4F7F3] flex-shrink-0 shadow-sm transition-transform hover:scale-105"
                  >
                    {/* الصورة */}
                    <img
                      src={
                        rev.userImage
                          ? rev.userImage.startsWith("http")
                            ? rev.userImage
                            : `${BASE_URL}/images/profiles/${rev.userImage}`
                          : man
                      }
                      className="w-20 h-20 rounded-full mb-4 mt-6 object-cover"
                      alt="user"
                      onError={(e) => {
                        e.target.src = man;
                      }}
                    />
                    {/* الكلام */}
                    <div className="w-full text-center overflow-hidden">
                      <p className="text-gray-600 text-sm mb-4 leading-relaxed italic break-words px-2">
                        "{rev.message}"
                      </p>
                    </div>
                    {/* الاسم */}
                    <h4 className="font-semibold text-[#5A2D21] mt-auto">
                      {rev.name}
                    </h4>
                  </div>
                ))
              ) : (
                <p className="text-center w-full text-gray-500">
                  Loading reviews...
                </p>
              )}
            </div>
          </div>
        </section>

        {/* <div className="grid grid-cols-3 gap-6 justify-items-center">
              {[1, 2, 3].map((item, index) => (
                <div
                  key={index}
                  className="rounded-[20px] p-6 flex flex-col items-center w-[400px] h-[250px] border border-gray-200 bg-[#F4F7F3]"
                > */}
        {/* الصورة */}
        {/* <img
                    src={man}
                    className="w-20 h-20 rounded-full mb-4 !mt-10"
                    alt="user"
                  /> */}

        {/* الكلام */}
        {/* <p className="text-gray-600 text-sm mb-6 text-center">
                    This app totally transformed my workflow. Highly recommend!
                  </p> */}

        {/* الاسم */}
        {/* <h4 className="font-semibold text-[#5A2D21] mb-2">
                    John Emad
                  </h4>
                </div> */}
        {/* ))}
            </div>
          </div>
        </section> */}
        {/* FAQ */}
        <section
          id="faq"
          className="w-full py-32 bg-[#EEF3EC] flex justify-center pt-48"
        >
          <div className="bg-white rounded-[30px] shadow-md px-14 py-16 flex gap-20 items-center max-w-[1100px] w-full mt-24">
            <div className="flex flex-col items-center">
              <h2 className="text-[36px] font-bold text-[#5A2D21] mb-8">
                (Faq)
              </h2>
              <img src={faq} className="w-[260px]" alt="faq icon" />
            </div>
            <div className="flex-1">
              {faqs.map((item, index) => (
                <div key={index} className="border-b-2 border-yellow-400 py-6">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="flex justify-between items-center w-full text-left"
                  >
                    <span className="text-[22px] font-semibold text-[#5A2D21]">
                      {item.q}
                    </span>
                    <span
                      className={`text-2xl ${openFAQ === index ? "rotate-180" : ""}`}
                    >
                      ⌄
                    </span>
                  </button>
                  {openFAQ === index && (
                    <p className="text-gray-600 mt-4 text-[16px]">{item.a}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
