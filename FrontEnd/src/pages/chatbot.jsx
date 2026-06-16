// import React, { useState, useRef, useEffect } from "react";
// import { FiEdit, FiMaximize2 } from "react-icons/fi";
// import { useNavigate, useLocation } from "react-router-dom";
// import axios from "axios";
// import { API_ENDPOINTS } from "../api/endpoints";
// import { toast } from "react-toastify";

// import BotImg from "../assets/Bot.png";

// const Chatbot = () => {
//   const navigate = useNavigate();
//   const location = useLocation();

//   const [isSidebarOpen, setIsSidebarOpen] = useState(true);
//   const [messages, setMessages] = useState([
//     { text: "Hello 👋 How can I help you?", sender: "bot" },
//   ]);

//   const [input, setInput] = useState("");
//   const [history, setHistory] = useState([]);
//   const [activeChatIndex, setActiveChatIndex] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const bottomRef = useRef(null);
//   const sessionIdRef = useRef(String(Date.now()));
//   const titleGeneratedRef = useRef(false);

//   useEffect(() => {
//     document.title = "Chatbot";
//     window.scrollTo(0, 0);

//     const token = localStorage.getItem("token");
//     const userId = localStorage.getItem("userId");

//     if (!token || token === "null") {
//       toast.warn("Please login first to chat with AI! ");
//       setTimeout(() => {
//         navigate("/login", { state: { from: location.pathname } });
//       }, 3000);
//     } else {
//       fetchChatHistory();
//     }
//     // }, [navigate, location.pathname]);
//   }, []);

//   //   جلب تاريخ المحادثات من السيرفر
//   const fetchChatHistory = async () => {
//     const token = localStorage.getItem("token");
//     const userId = localStorage.getItem("userId");
//     if (token && userId) {
//       try {
//         const response = await axios.get(API_ENDPOINTS.CHAT_HISTORY(userId), {
//           headers: { Authorization: `Bearer ${token}` },
//         });

//         const chatHistory = Array.isArray(response.data) ? response.data : [];
//         setHistory(chatHistory);

//         // التعديل هنا: لو فيه تاريخ قديم، افتح آخر محادثة تلقائياً
//         if (chatHistory.length > 0) {
//           const lastChat = chatHistory[0]; // السيرفر غالباً بيرجع الأحدث أولاً
//           loadChatMessages(lastChat, 0);
//         } else {
//           // لو مفيش أي تاريخ خالص، هنا بس نبدأ جلسة جديدة
//           sessionIdRef.current = String(Date.now());
//         }
//       } catch (err) {
//         console.error("Error fetching history:", err);
//       }
//     }
//   };

//   const loadChatMessages = async (chat, index) => {
//     setActiveChatIndex(index);
//     const sessionId = chat.id || chat.session_id;
//     sessionIdRef.current = sessionId;
//     titleGeneratedRef.current = true;

//     // لو الرسائل موجودة جوه الـ chat object استخدمها مباشرة
//     if (
//       chat.messages &&
//       Array.isArray(chat.messages) &&
//       chat.messages.length > 0
//     ) {
//       setMessages(chat.messages);
//       return;
//     }

//     // لو مش موجودة، اطلبها من السيرفر
//     try {
//       const token = localStorage.getItem("token");
//       const res = await axios.get(API_ENDPOINTS.CHAT_MESSAGES(sessionId), {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       const data = res.data;

//       if (Array.isArray(data) && data.length > 0) {
//         setMessages(data);
//       } else {
//         setMessages([
//           { text: "No messages found for this chat.", sender: "bot" },
//         ]);
//       }
//     } catch (err) {
//       console.error("Error loading chat messages:", err);
//       setMessages([{ text: "❌ Failed to load messages.", sender: "bot" }]);
//     }
//   };

//   useEffect(() => {
//     bottomRef.current?.scrollIntoView({
//       behavior: "smooth",
//       block: "nearest",
//     });
//   }, [messages]);

//   const isArabic = (text) => /[\u0600-\u06FF]/.test(text);

//   const toArabicNumbers = (text) => {
//     const map = {
//       0: "٠",
//       1: "١",
//       2: "٢",
//       3: "٣",
//       4: "٤",
//       5: "٥",
//       6: "٦",
//       7: "٧",
//       8: "٨",
//       9: "٩",
//     };
//     return text.replace(/[0-9]/g, (d) => map[d]) || "";
//   };

//   const formatMessage = (text) => {
//     if (!text) return "";

//     // let formatted = toArabicNumbers(text);
//     let formatted = isArabic(text) ? toArabicNumbers(text) : text;
//     formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

//     formatted = formatted.replace(/^\*\s/gm, "• ");

//     formatted = formatted
//       .split("\n")
//       .map((line) => `<p style="margin:8px 0">${line}</p>`)
//       .join("");

//     return formatted;
//   };

//   // ================= SEND =================
//   const sendMessage = async () => {
//     if (!input.trim()) return;

//     const currentInput = input;
//     const token = localStorage.getItem("token");
//     const userId = localStorage.getItem("userId");
//     setInput("");

//     setMessages((prev) => [
//       ...prev,
//       { text: currentInput, sender: "user" },
//       { text: "🌿 AI is analyzing...", sender: "bot" },
//     ]);

//     try {
//       const res = await axios.post(
//         API_ENDPOINTS.CHAT_SEND,
//         {
//           session_id: sessionIdRef.current,
//           // user_id: "user1",
//           user_id: userId,
//           message: currentInput,
//         },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "ngrok-skip-browser-warning": "69420",
//           },
//         },
//       );

//       // const reply = res.data.reply;
//       const { reply, follow_up_question } = res.data;

//       let fullBotReply = reply;
//       if (follow_up_question) {
//         fullBotReply += `\n\n**${follow_up_question}**`;
//       }

//       setMessages((prev) => {
//         const updated = [...prev];
//         updated.pop();
//         return [...updated, { text: fullBotReply, sender: "bot" }];
//       });

//       if (!titleGeneratedRef.current) {
//         try {
//           const titleRes = await axios.get(
//             API_ENDPOINTS.CHAT_GENERATE_TITLE(sessionIdRef.current),
//             {
//               headers: {
//                 Authorization: `Bearer ${token}`,
//                 "ngrok-skip-browser-warning": "69420",
//               },
//             },
//           );

//           // const serverTitle = titleRes.data.title;
//           const serverTitle = titleRes.data.reply || titleRes.data.title;

//           if (serverTitle) {
//             setHistory((prev) => [
//               {
//                 id: sessionIdRef.current,
//                 title: serverTitle,
//                 messages: [
//                   ...messages,
//                   { text: currentInput, sender: "user" },
//                   { text: fullBotReply, sender: "bot" },
//                 ],
//               },
//               ...prev,
//             ]);
//             titleGeneratedRef.current = true;
//           }
//         } catch (e) {
//           console.error("Title generation failed", e);
//           setHistory((prev) => [
//             { id: sessionIdRef.current, title: currentInput.slice(0, 20) },
//             ...prev,
//           ]);
//         }
//       }
//     } catch (err) {
//       console.error(err);
//       setMessages((prev) => {
//         const updated = [...prev];
//         updated.pop();
//         return [...updated, { text: "❌ server error", sender: "bot" }];
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ================= NEW CHAT =================
//   const newChat = () => {
//     sessionIdRef.current = String(Date.now());
//     titleGeneratedRef.current = false;
//     setMessages([{ text: "Hello 👋 How can I help you?", sender: "bot" }]);
//     setInput("");
//     setActiveChatIndex(null);
//   };

//   const token = localStorage.getItem("token");
//   if (!token || token === "null") {
//     return <div className="min-h-screen bg-white"></div>;
//   }

//   return (
//     <div className="flex flex-col h-[calc(100vh-70px)]  w-full font-['Inter'] overflow-hidden bg-white">
//       <div className="flex flex-1 overflow-hidden">
//         {/* Sidebar */}
//         <aside
//           // className="w-[280px] bg-[#F1F3F2] border-r border-[#D9E4DD] flex flex-col p-6 h-full">
//           className={`bg-[#F1F3F2] border-r border-[#D9E4DD] flex flex-col p-6 h-full transition-all duration-300 ${
//             isSidebarOpen ? "w-[280px] px-6" : "w-[100px] px-6 items-start"
//           }`}
//         >
//           {/*Header Sidebar */}
//           <div
//             className={`flex items-center  w-full mb-10 ${
//               isSidebarOpen ? "justify-between" : "justify-start gap-3"
//             }`}
//           >
//             <img src={BotImg} alt="bot" className="w-[34px] flex-shrink-0" />
//             <FiMaximize2
//               className={`cursor-pointer text-xl flex-shrink-0 transition-transform ${!isSidebarOpen ? "rotate-90" : ""}`}
//               onClick={() => setIsSidebarOpen(!isSidebarOpen)}
//             />
//           </div>

//           {/* New Chat Button */}

//           <div>
//             <button
//               onClick={newChat}
//               className={`flex items-center text-[#4D362F] hover:bg-gray-200 rounded-lg transition-all ${
//                 isSidebarOpen ? "w-full gap-2 p-2" : "justify-start p-1"
//               }`}
//             >
//               <FiEdit size={22} className="flex-shrink-0" />
//               {isSidebarOpen && <span>New chat</span>}
//             </button>
//           </div>

//           {/* History List */}
//           <div className="flex-1 overflow-y-auto w-full mt-4">
//             {isSidebarOpen && history && history.length > 0
//               ? history.map((chat, index) => (
//                   <div
//                     key={index}
//                     onClick={() => loadChatMessages(chat, index)}
//                     className={`p-3 cursor-pointer hover:bg-gray-200 rounded mb-1 text-sm truncate ${
//                       activeChatIndex === index ? "bg-gray-200 font-bold" : ""
//                     }`}
//                   >
//                     {chat.title}
//                   </div>
//                 ))
//               : isSidebarOpen && (
//                   <p className="text-xs text-gray-400 p-3">No history yet</p>
//                 )}
//           </div>
//         </aside>

//         {/* MAIN */}
//         <main className="flex-1 flex flex-col bg-[#F6FAF6] overflow-hidden">
//           {/* Title */}
//           <div className="mt-8 text-center">
//             <h2 className="text-[40px] font-bold text-[#4D362F]">
//               Smart Chatbot
//             </h2>
//           </div>

//           {/* Messages */}
//           <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6 max-w-[950px] mx-auto w-full">
//             {messages.map((msg, index) => (
//               <div
//                 key={index}
//                 className={`flex w-full ${
//                   msg.sender === "user" ? "justify-end" : "justify-start"
//                 }`}
//               >
//                 <div
//                   style={{
//                     maxWidth: "700px",
//                     padding: msg.sender === "user" ? "18px 25px" : "10px",
//                     borderRadius: msg.sender === "user" ? "30px" : "0",
//                     border:
//                       msg.sender === "user" ? "1px solid #1E9E5E33" : "none",
//                     color: msg.sender === "user" ? "#1E9E5E" : "#8D493A",
//                     fontSize: "18px",
//                     textAlign: isArabic(msg.text) ? "right" : "left",
//                     direction: isArabic(msg.text) ? "rtl" : "ltr",
//                   }}
//                   dangerouslySetInnerHTML={{
//                     __html: formatMessage(msg.text),
//                   }}
//                 />
//               </div>
//             ))}

//             <div ref={bottomRef} />
//           </div>

//           {/* INPUT */}
//           <div className="w-full flex justify-center py-6">
//             <div className="relative w-[90%] max-w-[900px] h-[70px]">
//               <input
//                 value={input}
//                 onChange={(e) => setInput(e.target.value)}
//                 onKeyDown={(e) => e.key === "Enter" && sendMessage()}
//                 placeholder="Type your question here..."
//                 className="
//                   w-full h-full rounded-[35px]
//                   pl-8 pr-[120px]
//                   border-2 border-[#8D493A]
//                   shadow-md text-lg outline-none
//                 "
//               />

//               <button
//                 onClick={sendMessage}
//                 className="absolute right-6 top-1/2 -translate-y-1/2 text-[#1E9E5E]"
//               >
//                 Send ↑
//               </button>
//             </div>
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// };

// export default Chatbot;

import React, { useState, useRef, useEffect } from "react";
import { FiEdit, FiMaximize2 } from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { API_ENDPOINTS } from "../api/endpoints";
import { toast } from "react-toastify";

import BotImg from "../assets/Bot.png";

const Chatbot = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [messages, setMessages] = useState([
    { text: "Hello 👋 How can I help you?", sender: "bot" },
  ]);

  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [activeChatIndex, setActiveChatIndex] = useState(null);
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);
  const sessionIdRef = useRef(String(Date.now()));
  const titleGeneratedRef = useRef(false);

  // 1. التأكد من تسجيل الدخول وجلب الهيستوري عند فتح الصفحة
  useEffect(() => {
    document.title = "Chatbot";
    window.scrollTo(0, 0);

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || token === "null") {
      toast.warn("Please login first to chat with AI!");
      setTimeout(() => {
        navigate("/login", { state: { from: location.pathname } });
      }, 3000);
    } else {
      fetchChatHistory(); // جلب التاريخ فوراً
    }
  }, []); // المصفوفة فارغة لضمان التشغيل مرة واحدة فقط عند التحميل

  // 2. جلب تاريخ المحادثات من السيرفر
  const fetchChatHistory = async () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    // التأكد إن الـ userId موجود وقيمته مش undefined
    if (token && userId && userId !== "undefined") {
      try {
        const response = await axios.get(API_ENDPOINTS.CHAT_HISTORY(userId), {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "69420",
          },
        });

        // const chatHistory = Array.isArray(response.data) ? response.data : [];
        const chatHistory =
          response.data.chats ||
          (Array.isArray(response.data) ? response.data : []);
        setHistory(chatHistory);

        // فتح آخر محادثة تلقائياً إذا وجدت داتا
        if (chatHistory.length > 0) {
          loadChatMessages(chatHistory[0], 0);
        }
      } catch (err) {
        // معالجة خطأ 404 لو اليوزر ملوش تاريخ لسه
        if (err.response && err.response.status === 404) {
          console.log("No history found for this user yet.");
          setHistory([]);
        } else {
          console.error("Error fetching history:", err);
        }
      }
    }
  };

  const loadChatMessages = async (chat, index) => {
    setActiveChatIndex(index);
    const sessionId = chat.id || chat.session_id;
    sessionIdRef.current = sessionId;
    titleGeneratedRef.current = true;

    if (
      chat.messages &&
      Array.isArray(chat.messages) &&
      chat.messages.length > 0
    ) {
      setMessages(chat.messages);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(API_ENDPOINTS.CHAT_MESSAGES(sessionId), {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "69420",
        },
      });

      const data = res.data;
      if (Array.isArray(data) && data.length > 0) {
        setMessages(data);
      } else {
        setMessages([
          { text: "No messages found for this chat.", sender: "bot" },
        ]);
      }
    } catch (err) {
      console.error("Error loading chat messages:", err);
      setMessages([{ text: "❌ Failed to load messages.", sender: "bot" }]);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [messages]);

  const isArabic = (text) => /[\u0600-\u06FF]/.test(text);

  const toArabicNumbers = (text) => {
    const map = {
      0: "٠",
      1: "١",
      2: "٢",
      3: "٣",
      4: "٤",
      5: "٥",
      6: "٦",
      7: "٧",
      8: "٨",
      9: "٩",
    };
    return text.replace(/[0-9]/g, (d) => map[d]) || "";
  };

  // const formatMessage = (text) => {
  //   if (!text) return "";
  //   let formatted = isArabic(text) ? toArabicNumbers(text) : text;
  //   formatted = formatted.replace(
  //     /^### (.*$)/gm,
  //     '<h3 class="text-xl font-bold mt-4 mb-2">$1</h3>',
  //   );
  //   formatted = formatted.replace(
  //     /\*\*(.*?)\*\*/g,
  //     '<strong class="font-bold">$1</strong>',
  //   );
  //   formatted = formatted.replace(/^\*\s/gm, "• ");
  //   formatted = formatted
  //     .split("\n")
  //     .map((line) => `<p style="margin:8px 0">${line}</p>`)
  //     .join("");
  //   return formatted;
  // };

  const formatMessage = (text) => {
    if (!text) return "";
    let formatted = isArabic(text) ? toArabicNumbers(text) : text;

    // 1. مسح الخطوط الفاصلة === تماماً من النص
    formatted = formatted.replace(/^==+$/gm, "");

    // 2. العناوين (###) بـ Tailwind classes
    formatted = formatted.replace(
      /^### (.*$)/gm,
      '<h3 class="text-xl font-bold mt-4 mb-2">$1</h3>',
    );

    // 3. الخط العريض (**)
    formatted = formatted.replace(
      /\*\*(.*?)\*\*/g,
      '<strong class="font-bold">$1</strong>',
    );

    // 4. النقط (*)
    formatted = formatted.replace(/^\*\s/gm, "• ");

    // 5. السطور والفقرات بـ Tailwind classes للمسافات
    formatted = formatted
      .split("\n")
      .map((line) => {
        if (line.trim() === "") return '<div class="h-2"></div>';
        return `<p class="my-2 leading-relaxed">${line}</p>`;
      })
      .join("");

    return formatted;
  };
  const sendMessage = async () => {
    if (!input.trim()) return;

    const currentInput = input;
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    setInput("");

    setMessages((prev) => [
      ...prev,
      { text: currentInput, sender: "user" },
      { text: "🌿 AI is analyzing...", sender: "bot" },
    ]);

    try {
      const res = await axios.post(
        API_ENDPOINTS.CHAT_SEND,
        {
          session_id: sessionIdRef.current,
          user_id: userId, // هنا الـ ID هيبعت 1 صح
          message: currentInput,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "69420",
          },
        },
      );

      const { reply, follow_up_question } = res.data;
      let fullBotReply = reply;
      if (follow_up_question) {
        fullBotReply += `\n\n**${follow_up_question}**`;
      }

      setMessages((prev) => {
        const updated = [...prev];
        updated.pop();
        return [...updated, { text: fullBotReply, sender: "bot" }];
      });

      // 3. توليد عنوان المحادثة وتصحيح استلامه من الباك
      if (!titleGeneratedRef.current) {
        try {
          const titleRes = await axios.get(
            API_ENDPOINTS.CHAT_GENERATE_TITLE(sessionIdRef.current),
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "ngrok-skip-browser-warning": "69420",
              },
            },
          );

          // استخدام reply إذا كان title راجع بـ null
          const serverTitle = titleRes.data.reply || titleRes.data.title;

          if (serverTitle) {
            setHistory((prev) => [
              {
                id: sessionIdRef.current,
                title: serverTitle,
                messages: [
                  ...messages,
                  { text: currentInput, sender: "user" },
                  { text: fullBotReply, sender: "bot" },
                ],
              },
              ...prev,
            ]);
            titleGeneratedRef.current = true;
          }
        } catch (e) {
          setHistory((prev) => [
            { id: sessionIdRef.current, title: currentInput.slice(0, 20) },
            ...prev,
          ]);
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated.pop();
        return [...updated, { text: "❌ server error", sender: "bot" }];
      });
    }
  };

  const newChat = () => {
    sessionIdRef.current = String(Date.now());
    titleGeneratedRef.current = false;
    setMessages([{ text: "Hello 👋 How can I help you?", sender: "bot" }]);
    setInput("");
    setActiveChatIndex(null);
  };

  const token = localStorage.getItem("token");
  if (!token || token === "null") {
    return <div className="min-h-screen bg-white"></div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-70px)] w-full font-['Inter'] overflow-hidden bg-white">
      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`bg-[#F1F3F2] border-r border-[#D9E4DD] flex flex-col p-6 h-full transition-all duration-300 ${isSidebarOpen ? "w-[280px] px-6" : "w-[100px] px-6 items-start"}`}
        >
          <div
            className={`flex items-center w-full mb-10 ${isSidebarOpen ? "justify-between" : "justify-start gap-3"}`}
          >
            <img src={BotImg} alt="bot" className="w-[34px] flex-shrink-0" />
            <FiMaximize2
              className={`cursor-pointer text-xl flex-shrink-0 transition-transform ${!isSidebarOpen ? "rotate-90" : ""}`}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            />
          </div>
          <div>
            <button
              onClick={newChat}
              className={`flex items-center text-[#4D362F] hover:bg-gray-200 rounded-lg transition-all ${isSidebarOpen ? "w-full gap-2 p-2" : "justify-start p-1"}`}
            >
              <FiEdit size={22} className="flex-shrink-0" />
              {isSidebarOpen && <span>New chat</span>}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto w-full mt-4">
            {isSidebarOpen && history && history.length > 0
              ? history.map((chat, index) => (
                  <div
                    key={index}
                    onClick={() => loadChatMessages(chat, index)}
                    className={`p-3 cursor-pointer hover:bg-gray-200 rounded mb-1 text-sm truncate ${activeChatIndex === index ? "bg-gray-200 font-bold" : ""}`}
                  >
                    {chat.title}
                  </div>
                ))
              : isSidebarOpen && (
                  <p className="text-xs text-gray-400 p-3">No history yet</p>
                )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col bg-[#F6FAF6] overflow-hidden">
          <div className="mt-8 text-center">
            <h2 className="text-[40px] font-bold text-[#4D362F]">
              Smart Chatbot
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6 max-w-[950px] mx-auto w-full">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex w-full ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  style={{
                    maxWidth: "700px",
                    padding: msg.sender === "user" ? "18px 25px" : "10px",
                    borderRadius: msg.sender === "user" ? "30px" : "0",
                    border:
                      msg.sender === "user" ? "1px solid #1E9E5E33" : "none",
                    color: msg.sender === "user" ? "#1E9E5E" : "#8D493A",
                    fontSize: "18px",
                    textAlign: isArabic(msg.text) ? "right" : "left",
                    direction: isArabic(msg.text) ? "rtl" : "ltr",
                  }}
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }}
                />
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="w-full flex justify-center py-6">
            <div className="relative w-[90%] max-w-[900px] h-[70px]">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Type your question here..."
                className="w-full h-full rounded-[35px] pl-8 pr-[120px] border-2 border-[#8D493A] shadow-md text-lg outline-none"
              />
              <button
                onClick={sendMessage}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-[#1E9E5E]"
              >
                Send ↑
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Chatbot;
