import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';
import { API_ENDPOINTS } from '../api/endpoints';
import { toast } from 'react-toastify'; 

import authBg from '../assets/auth-bg.png';
import logo from '../assets/logo.png';

const ForgotPassword = () => {
    const navigate = useNavigate();
    
    useEffect(() => {
        document.title = "Reset Password | GreenMindAI";
        window.scrollTo(0, 0);
    }, []);

    const [step, setStep] = useState(1); 
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false); 
    const [selectedRole, setSelectedRole] = useState('user');
    
    const [email, setEmail] = useState('');
    const [otpValue, setOtpValue] = useState(''); 
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleNextStep = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (step === 1 && !email.toLowerCase().endsWith('@gmail.com')) {
            toast.warn("Please use a valid Gmail address. 📧");
            setLoading(false);
            return;
        }

        try {
            if (step === 1) {
                const response = await axios.post(API_ENDPOINTS.FORGOT_PASSWORD, {
                    email: email,
                    role: selectedRole === 'admin' ? "Admin" : "User"
                });

                if (response.status === 200) {
                    toast.success("OTP sent to your email! ");
                    setStep(2); 
                }
            } else {
                if (newPassword !== confirmPassword) {
                    toast.error("Passwords do not match! ");
                    setLoading(false);
                    return;
                }

                const response = await axios.post(API_ENDPOINTS.RESET_PASSWORD, {
                    email: email,
                    newPassword: newPassword,
                    confirmNewPassword: confirmPassword, 
                    role: selectedRole === 'admin' ? "Admin" : "User", 
                    otp: otpValue
                });

                if (response.status === 200) {
                    toast.success("Password updated successfully! "); 
                    navigate('/login');
                }
            }
        } catch (err) {
            console.error("Error:", err);
            const msg = err.response?.data?.message || "Something went wrong. Please try again.";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className="relative min-h-screen w-full flex items-center justify-center bg-cover bg-center overflow-y-auto font-inter text-white"
            style={{ backgroundImage: `url(${authBg})` }}
        >
            <div className="absolute inset-0 w-full h-full z-0" style={{ backgroundColor: '#635959', opacity: '0.49' }}></div>

            <div className="relative z-10 w-full max-w-[650px] px-6 py-10 flex flex-col items-center">
                <div 
                    className="w-full py-10 px-6 md:px-12 flex flex-col items-center shadow-2xl transition-all animate-in fade-in duration-500" 
                    style={{ 
                        backgroundColor: 'rgba(18, 39, 26, 0.45)', 
                        borderRadius: '60px', 
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)'
                    }}
                >
                    {/* Header */}
                    <div className="w-full flex items-center justify-between mb-6 px-2">
                        <button type="button" onClick={() => step === 1 ? navigate('/login') : setStep(1)} className="text-white hover:text-[#4CAF50] transition-colors cursor-pointer border-none bg-transparent">
                            <FaArrowLeft size={24} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)', borderRadius: '60px', padding: '5px' }}>
                                <img src={logo} alt="Logo" className="w-[40px] h-[40px] object-contain" />
                            </div>
                            <h3 className="text-white text-[22px] font-bold">GreenMindAI</h3>
                        </div>
                        <div className="w-6"></div>
                    </div>

                    <h2 className="text-white text-[28px] font-[900] italic mb-2 text-center uppercase tracking-tight">
                        {step === 1 ? "Forgot Password?" : "Reset Password"}
                    </h2>
                    <p className="text-white/70 text-[14px] mb-4 text-center max-w-[80%] mx-auto">
                        {step === 1 ? "Enter your email to receive a verification code." : "Enter the code sent to your email and your new password."}
                    </p>

                    <form className="w-full space-y-4 flex flex-col items-center" onSubmit={handleNextStep}>
                        <div className="w-full">
                            <input 
                                type="email" 
                                placeholder="Registered Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                style={{ backgroundColor: 'rgba(217, 217, 217, 0.38)' }}
                                className={`w-full border-none rounded-full py-3 px-8 text-white placeholder-white outline-none text-center focus:ring-1 focus:ring-white/30 text-[18px] transition-all ${step === 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={step === 2 || loading}
                            />
                        </div>

                        {step === 1 && (
                            <div className="flex gap-10 my-6 text-[18px] font-normal">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="radio" name="role" value="user" checked={selectedRole === 'user'} onChange={(e) => setSelectedRole(e.target.value)} className="w-4 h-4 accent-[#4CAF50] cursor-pointer" />
                                    <span className={selectedRole === 'user' ? 'font-bold text-[#4CAF50]' : 'text-white'}>User</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="radio" name="role" value="admin" checked={selectedRole === 'admin'} onChange={(e) => setSelectedRole(e.target.value)} className="w-4 h-4 accent-[#4CAF50] cursor-pointer" />
                                    <span className={selectedRole === 'admin' ? 'font-bold text-[#4CAF50]' : 'text-white'}>Admin</span>
                                </label>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="w-full space-y-4 animate-in fade-in duration-500">
                                <input 
                                    type="text" 
                                    placeholder="Enter OTP Code"
                                    required
                                    maxLength="6"
                                    value={otpValue}
                                    onChange={(e) => setOtpValue(e.target.value)}
                                    style={{ backgroundColor: 'rgba(217, 217, 217, 0.38)' }}
                                    className={`w-full border-none rounded-full py-3 px-8 text-white placeholder-white outline-none text-center focus:ring-1 focus:ring-white/30 text-[18px] ${otpValue ? 'tracking-[5px] font-bold text-[20px]' : ''}`}
                                />
                                
                                <div className="relative w-full">
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="New Password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        style={{ backgroundColor: 'rgba(217, 217, 217, 0.38)' }}
                                        className="w-full border-none rounded-full py-3 px-8 text-white placeholder-white outline-none text-center focus:ring-1 focus:ring-white/30 text-[18px]"
                                    />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-white/70 border-none bg-transparent cursor-pointer">
                                        {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                                    </button>
                                </div>

                                <div className="relative w-full">
                                    <input 
                                        type={showConfirmPassword ? "text" : "password"} 
                                        placeholder="Confirm New Password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        style={{ backgroundColor: 'rgba(217, 217, 217, 0.38)' }}
                                        className="w-full border-none rounded-full py-3 px-8 text-white placeholder-white outline-none text-center focus:ring-1 focus:ring-white/30 text-[18px]"
                                    />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-white/70 border-none bg-transparent cursor-pointer">
                                        {showConfirmPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        <button 
                            type="submit"
                            disabled={loading}
                            className={`w-[80%] text-white font-bold py-3 text-[18px] shadow-lg transition-all mt-6 transform active:scale-95 shadow-[#4CAF50]/20 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110 cursor-pointer'}`} 
                            style={{ backgroundColor: '#4CAF50', borderRadius: '60px', border: 'none' }}
                        >
                            {loading ? "Processing..." : (step === 1 ? "Send OTP" : "Reset Password")}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;