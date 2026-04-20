import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../api/endpoints';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; 

const Profile = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // States لإظهار وإخفاء الباسورد
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // بيانات المستخدم
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "",
    profilePic: null
  });

  // بيانات تغيير الباسورد
  const [passwords, setPasswords] = useState({
    current: '',
    next: ''
  });

  // جلب البيانات عند فتح الصفحة
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError("Please login first.");
          return;
        }

        const response = await axios.get(API_ENDPOINTS.GET_PROFILE, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "69420"
          }
        });
        
        if (response.data) {
          setUserData({
            name: response.data.name || "",
            email: response.data.email || "",
            phone: response.data.phone || "",
            gender: response.data.gender || "",
            profilePic: response.data.profilePic || null
          });
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        toast.error("Failed to load profile data.");
      }
    };

    document.title = "My Profile";
    window.scrollTo(0, 0);
    fetchProfile();
  }, []);

  const handleImageClick = () => {
    if (isEditMode) fileInputRef.current.click();
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setUserData({ ...userData, profilePic: imageUrl });
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setError('');
    setPasswords({ current: '', next: '' });
    setShowCurrentPassword(false);
    setShowNewPassword(false);
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      await axios.put(API_ENDPOINTS.UPDATE_PROFILE, {
        name: userData.name,
        phone: userData.phone,
        gender: userData.gender,
        profilePic: userData.profilePic
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "69420"
        }
      });

      if (passwords.current && passwords.next) {
        await axios.post(API_ENDPOINTS.CHANGE_PASSWORD, {
          currentPassword: passwords.current, 
          newPassword: passwords.next,        
          confirmPassword: passwords.next     
        }, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "69420"
          }
        });
      }

      setIsEditMode(false);
      setPasswords({ current: '', next: '' });
      toast.success("Profile updated successfully!");

    } catch (err) {
      console.error("Update Error:", err.response?.data);
      const msg = err.response?.data?.message || "Update failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#F9FFF9] font-inter flex flex-col text-[#432818] w-full min-h-screen">
      <main className="flex-grow w-full max-w-7xl mx-auto px-8 md:px-20 py-12 flex flex-col items-center">
        
        <h1 className="text-[40px] md:text-[56px] font-[900] mb-12 text-center w-full">
          My profile
        </h1>

        <div className="flex flex-col items-center relative w-full max-w-2xl">
          
          {isEditMode && (
            <button 
              onClick={handleCancel}
              className="absolute -right-4 md:-right-20 top-0 text-[20px] md:text-[24px] font-[800] underline cursor-pointer"
            >
              Cancel
            </button>
          )}

          <div className="flex flex-col items-center mb-12">
            <div className="w-32 h-32 md:w-40 md:h-40 bg-[#D9D9D9] rounded-full mb-4 shadow-sm overflow-hidden border-2 border-gray-200">
                {userData.profilePic && <img src={userData.profilePic} alt="Profile" className="w-full h-full object-cover" />}
            </div>

            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />

            {!isEditMode ? (
              <button 
                onClick={() => setIsEditMode(true)}
                className="text-[18px] font-semibold underline text-[#4B4B4B] hover:text-[#432818] transition-colors"
              >
                Edit profile
              </button>
            ) : (
              <button 
                onClick={handleImageClick}
                className="text-[14px] font-bold text-[#4B4B4B] underline"
              >
                Change profile photo
              </button>
            )}
          </div>

          {error && <p className="text-red-500 mb-5 font-bold animate-pulse text-center w-full">⚠️ {error}</p>}

          <div className="w-full space-y-10">
            {[
              { label: 'User name', key: 'name', type: 'text' },
              { label: 'Email', key: 'email', type: 'email', disabled: true }, 
              { label: 'Phone number', key: 'phone', type: 'text' }
            ].map((field) => (
              <div key={field.label} className="flex flex-col gap-3 relative w-full">
                <label className="text-[24px] md:text-[28px] font-[700] text-[#432818]">{field.label}</label>
                {!isEditMode || field.disabled ? (
                  <div className="w-full p-4 rounded-[15px] border border-gray-300 bg-white text-[18px] flex items-center min-h-[60px]">
                    {userData[field.key]}
                  </div>
                ) : (
                  <input 
                    type={field.type}
                    value={userData[field.key] || ''}
                    onChange={(e) => setUserData({...userData, [field.key]: e.target.value})}
                    className="w-full p-4 rounded-[15px] border border-[#432818] text-[18px] outline-none shadow-sm bg-[#F9FFF9]"
                  />
                )}
              </div>
            ))}

            <div className="flex flex-col gap-3 relative w-full">
              <label className="text-[24px] md:text-[28px] font-[700] text-[#432818]">Password</label>
              {!isEditMode ? (
                <div className="w-full p-4 rounded-[15px] border border-gray-300 bg-white text-[18px] flex items-center min-h-[60px]">
                  ••••••••••••
                </div>
              ) : (
                <div className="space-y-6 w-full">
                  {/* Current Password */}
                  <div className="relative">
                    <input 
                      type={showCurrentPassword ? "text" : "password"} 
                      placeholder="Current password"
                      value={passwords.current}
                      onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                      className="w-full p-4 rounded-[15px] border border-[#432818] text-[18px] outline-none bg-[#F9FFF9] pr-12"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#432818]/70 hover:text-[#432818]"
                    >
                      {showCurrentPassword ? <FaEyeSlash size={22} /> : <FaEye size={22} />}
                    </button>
                  </div>

                  {/* New Password  */}
                  <div className="relative">
                    <input 
                      type={showNewPassword ? "text" : "password"} 
                      placeholder="New password"
                      value={passwords.next}
                      onChange={(e) => setPasswords({...passwords, next: e.target.value})}
                      className="w-full p-4 rounded-[15px] border border-[#432818] text-[18px] outline-none bg-[#F9FFF9] pr-12"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#432818]/70 hover:text-[#432818]"
                    >
                      {showNewPassword ? <FaEyeSlash size={22} /> : <FaEye size={22} />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-8 pt-4 text-[18px] font-semibold text-[#432818]">
                <span>Gender:</span>
                <div className={`flex items-center gap-2 ${isEditMode ? 'cursor-pointer' : 'cursor-default'}`} onClick={() => isEditMode && setUserData({...userData, gender: 'Male'})}>
                  <div className="w-5 h-5 rounded-full border-2 border-[#432818] flex items-center justify-center">
                    {userData.gender === 'Male' && <div className="w-2.5 h-2.5 rounded-full bg-[#432818]"></div>}
                  </div>
                  <span>Male</span>
                </div>
                <div className={`flex items-center gap-2 ${isEditMode ? 'cursor-pointer' : 'cursor-default'}`} onClick={() => isEditMode && setUserData({...userData, gender: 'Female'})}>
                  <div className="w-5 h-5 rounded-full border-2 border-[#432818] flex items-center justify-center">
                    {userData.gender === 'Female' && <div className="w-2.5 h-2.5 rounded-full bg-[#432818]"></div>}
                  </div>
                  <span>Female</span>
                </div>
            </div>

            {isEditMode && (
              <div className="pt-10 flex justify-center">
                <button 
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className={`bg-[#432818] text-white text-[20px] font-bold py-3 px-14 rounded-[12px] shadow-md transition-all ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 cursor-pointer'}`}
                >
                  Save Profile 
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}; 

export default Profile;