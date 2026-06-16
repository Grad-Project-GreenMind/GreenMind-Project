import React, { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; 
import { GoogleLogin } from '@react-oauth/google';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';
import axios from 'axios'; 
import { toast } from 'react-toastify';

import authBg from '../assets/auth-bg.png';
import logo from '../assets/logo.png';
import facebookIcon from '../assets/Facebook.png';
import { API_ENDPOINTS } from '../api/endpoints';

const SignUp = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Sign Up";
    window.scrollTo(0, 0);
  }, []);

  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false); 
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match! ');
      return;
    }
    setLoading(true); 

    try {
      const response = await axios.post(API_ENDPOINTS.REGISTER, {
          name: formData.userName, 
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword
      }, {
        headers: {
          "ngrok-skip-browser-warning": "69420",
          "Content-Type": "application/json"
        }
      });

      if (response.status === 200 || response.status === 201) {
        toast.success("Account created successfully! ");
        navigate('/login'); 
      }
    } catch (err) {
      console.error("Sign Up Error:", err);
      const errorMsg = err.response?.data?.message || "Registration failed. Please try again.";
      toast.error(errorMsg);
    } finally {
      setLoading(false); 
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const response = await axios.post(API_ENDPOINTS.GOOGLE_LOGIN, {
          token: credentialResponse.credential, 
          role: "User" 
      }, { headers: { "ngrok-skip-browser-warning": "69420" } });

      if (response.status === 200) {
        localStorage.setItem('token', response.data.token); 
        const extractedId = response.data.userId || response.data.id;
        localStorage.setItem('userId', extractedId);
        toast.success("Welcome to GreenMindAI! ");
        navigate('/'); 
      }
    } catch (err) { 
      toast.error("Google Login Failed "); 
    } finally { 
      setLoading(false); 
    }
  };

  const responseFacebook = async (fbResponse) => {
    if (fbResponse.accessToken) {
      setLoading(true);
      try {
        const response = await axios.post(API_ENDPOINTS.FACEBOOK_LOGIN, {
          token: fbResponse.accessToken,
          role: "User"
        }, { headers: { "ngrok-skip-browser-warning": "69420" } });

        if (response.status === 200 || response.status === 201) {
          localStorage.setItem('token', response.data.token);
          const extractedId = response.data.userId || response.data.id;
          localStorage.setItem('userId', extractedId);
          toast.success("Welcome to GreenMindAI! ");
          navigate('/'); 
        }
      } catch (err) { 
        toast.error("Facebook Login Failed "); 
      } finally { 
        setLoading(false); 
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-cover bg-center overflow-y-auto font-inter" style={{ backgroundImage: `url(${authBg})` }}>
      <div className="absolute inset-0 w-full h-full z-0" style={{ backgroundColor: '#635959', opacity: '0.49' }}></div>
      <div className="relative z-10 w-full max-w-[1400px] px-8 md:px-16 flex flex-col md:flex-row items-center justify-between min-h-screen py-10">
        <div className="text-white flex-[0.4] flex flex-col items-center justify-center text-center md:text-left md:items-start mb-10 md:mb-0">
          <h1 className="font-[900] italic leading-tight text-white drop-shadow-lg text-[48px] md:text-[56px] uppercase">Create Account</h1>
        </div>
        <div className="flex-[0.6] w-full flex justify-end items-center">
          <div className="w-full max-w-[650px] py-8 md:py-10 px-6 md:px-10 flex flex-col items-center shadow-2xl transition-all animate-in fade-in duration-500" 
            style={{ backgroundColor: 'rgba(18, 39, 26, 0.45)', borderRadius: '60px', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
            <div className="flex items-center gap-4 mb-7">
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.6)', borderRadius: '60px', padding: '5px' }}>
                <img src={logo} alt="Logo" className="w-[55px] h-[55px] object-contain" /> 
              </div>
              <h3 className="text-white text-[28px] font-bold tracking-wide">GreenMindAI</h3>
            </div>
            <form className="w-full flex flex-col items-center" onSubmit={handleSignUp}>
              <div className="w-full space-y-4">
                <input name="userName" type="text" placeholder="User Name" onChange={handleChange} value={formData.userName} style={{ backgroundColor: 'rgba(217, 217, 217, 0.38)' }} className="w-full border-none rounded-full py-3 px-8 text-white placeholder-white outline-none text-center text-[18px]" required />
                <input name="email" type="email" placeholder="Email Address" onChange={handleChange} value={formData.email} style={{ backgroundColor: 'rgba(217, 217, 217, 0.38)' }} className="w-full border-none rounded-full py-3 px-8 text-white placeholder-white outline-none text-center text-[18px]" required />
                <div className="relative w-full">
                  <input name="password" type={showPassword ? "text" : "password"} placeholder="Password" onChange={handleChange} value={formData.password} style={{ backgroundColor: 'rgba(217, 217, 217, 0.38)' }} className="w-full border-none rounded-full py-3 px-8 text-white placeholder-white outline-none text-center text-[18px]" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-white/70">
                    {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                  </button>
                </div>
                <div className="relative w-full">
                  <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="Confirm Password" onChange={handleChange} value={formData.confirmPassword} style={{ backgroundColor: 'rgba(217, 217, 217, 0.38)' }} className="w-full border-none rounded-full py-3 px-8 text-white placeholder-white outline-none text-center text-[18px]" required />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-white/70">
                    {showConfirmPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                  </button>
                </div>
              </div>


              <button type="submit" disabled={loading} className={`w-[70%] text-white font-bold py-3 text-[18px] shadow-lg transition-all mt-6 transform active:scale-95 shadow-[#4CAF50]/20 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110 cursor-pointer'}`} style={{ backgroundColor: '#4CAF50', borderRadius: '60px' }}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>
            <div className="w-full flex items-center my-6">
              <div className="flex-grow border-t border-white/20"></div>
              <span className="px-3 text-white/50 text-[12px] uppercase tracking-widest font-medium">Or Sign up with</span>
              <div className="flex-grow border-t border-white/20"></div>
            </div>
            <div className="flex items-center justify-center gap-10 mb-5 w-full">
              <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => toast.error("Google Login Failed")} type="icon" shape="circle" theme="filled_blue" size="large" />
              <FacebookLogin appId="902520605961903" callback={responseFacebook} fields="name,email,picture" scope="public_profile,email" render={(renderProps) => (
                  <img src={facebookIcon} alt="Facebook" onClick={renderProps.onClick} className="w-10 h-10 object-contain cursor-pointer hover:scale-110 transition-transform" />
                )} />
            </div>
            <p className="text-white/70 text-[14px]">Already have account? <button onClick={() => navigate('/login')} className="font-bold text-white underline italic ml-1 cursor-pointer">Log in Now</button></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;