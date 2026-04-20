import React, { useState, useEffect } from 'react'; 
import { useNavigate, useLocation } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; 
import { GoogleLogin } from '@react-oauth/google';
import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';
import axios from 'axios'; 
import { toast } from 'react-toastify'; 

import authBg from '../assets/auth-bg.png';
import logo from '../assets/logo.png';
import facebookIcon from '../assets/Facebook.png';
import { API_ENDPOINTS } from '../api/endpoints';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation(); 
  
  useEffect(() => {
    document.title = "Log In ";
    window.scrollTo(0, 0);
  }, []);

  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState(location.state?.role || 'user');
  const [loading, setLoading] = useState(false); 

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); 

    try {
      const response = await axios.post(API_ENDPOINTS.LOGIN, {
          email: formData.email,
          password: formData.password,
          role: selectedRole === 'admin' ? "Admin" : "User"
      }, {
        headers: {
          "ngrok-skip-browser-warning": "69420",
          "Content-Type": "application/json"
        }
      });

      if (response.status === 200 || response.status === 201) {
        localStorage.setItem('token', response.data.token); 
        localStorage.setItem('userRole', response.data.role || selectedRole); 
        localStorage.setItem('userName', response.data.userName || '');
        
        toast.success(`Welcome back, ${response.data.userName || 'User'}! `);

        if (selectedRole === 'admin') {
          navigate('/home-dashboard');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      console.error("Login Error Details:", err);
      const errorMsg = err.response?.data?.message || "Invalid email or password.";
      toast.error(errorMsg); // تنبيه الخطأ
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
        toast.success("Logged in with Google! ");
        navigate('/'); 
      }
    } catch (err) { toast.error("Google Login failed."); } finally { setLoading(false); }
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
          toast.success("Logged in with Facebook! ");
          navigate('/'); 
        }
      } catch (err) { toast.error("Facebook Login Failed."); } finally { setLoading(false); }
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-cover bg-center overflow-y-auto font-inter" style={{ backgroundImage: `url(${authBg})` }}>
      <div className="absolute inset-0 w-full h-full z-0" style={{ backgroundColor: '#635959', opacity: '0.49' }}></div>
      <div className="relative z-10 w-full max-w-[1400px] px-8 md:px-16 flex flex-col md:flex-row items-center justify-between min-h-screen py-10">
        <div className="text-white flex-[0.4] flex flex-col items-center justify-center text-center md:text-left md:items-start mb-10 md:mb-0">
          <h1 className="font-[900] italic leading-tight text-white drop-shadow-lg text-[48px] md:text-[56px] uppercase">Welcome Back</h1>
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
            <form className="w-full flex flex-col items-center" onSubmit={handleLogin}>
              <div className="w-full space-y-4">
                <input type="text" name="email" placeholder="User Name or Email" onChange={handleChange} required style={{ backgroundColor: 'rgba(217, 217, 217, 0.38)' }} className="w-full border-none rounded-full py-3 px-8 text-white placeholder-white outline-none text-center focus:ring-1 focus:ring-white/30 text-[18px] font-normal" />
                <div className="relative w-full">
                  <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" onChange={handleChange} style={{ backgroundColor: 'rgba(217, 217, 217, 0.38)' }} className="w-full border-none rounded-full py-3 px-8 text-white placeholder-white outline-none text-center focus:ring-1 focus:ring-white/30 text-[18px] font-normal" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors cursor-pointer">
                    {showPassword ? <FaEyeSlash size={22} /> : <FaEye size={22} />}
                  </button>
                </div>
              </div>


              <div className="w-full flex justify-end mt-2 pr-6">
                <button type="button" onClick={() => navigate('/forgot-password')} className="text-[#FF6B6B] hover:text-[#FF4040] text-[14px] font-medium italic underline cursor-pointer transition-all tracking-wide">Forgot Password?</button>
              </div>
              <div className="flex gap-10 my-6 text-white text-[18px] font-normal">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="radio" name="role" value="user" checked={selectedRole === 'user'} onChange={(e) => setSelectedRole(e.target.value)} className="w-4 h-4 accent-[#4CAF50] cursor-pointer" />
                  <span className={selectedRole === 'user' ? 'font-bold text-[#4CAF50]' : ''}>User</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="radio" name="role" value="admin" checked={selectedRole === 'admin'} onChange={(e) => setSelectedRole(e.target.value)} className="w-4 h-4 accent-[#4CAF50] cursor-pointer" />
                  <span className={selectedRole === 'admin' ? 'font-bold text-[#4CAF50]' : ''}>Admin</span>
                </label>
              </div>
              <button type="submit" disabled={loading} className={`w-[70%] text-white font-bold py-3 text-[18px] shadow-lg transition-all mt-4 transform active:scale-95 shadow-[#4CAF50]/20 ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110 cursor-pointer'}`} style={{ backgroundColor: '#4CAF50', borderRadius: '60px' }}>
                {loading ? 'Logging in...' : 'Log In'}
              </button>
            </form>
            <div className="w-full flex items-center my-6">
              <div className="flex-grow border-t border-white/20"></div>
              <span className="px-3 text-white/50 text-[12px] uppercase tracking-widest font-medium">Or Log in with</span>
              <div className="flex-grow border-t border-white/20"></div>
            </div>
            <div className="flex items-center justify-center gap-10 mb-5">
              <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => toast.error("Google Login Failed")} type="icon" shape="circle" theme="filled_blue" size="large" />
              <FacebookLogin appId="902520605961903" callback={responseFacebook} fields="name,email,picture" scope="public_profile,email" render={(renderProps) => (
                  <img src={facebookIcon} alt="Facebook" onClick={renderProps.onClick} className="w-10 h-10 object-contain cursor-pointer hover:scale-110 transition-transform" />
                )} />      
            </div>
            <p className="text-white/70 text-[14px] font-normal">Don't have account? <button onClick={() => navigate('/signup')} className="font-bold text-white underline italic ml-1 cursor-pointer">Create Now</button></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;