import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom'; 
import axios from 'axios'; 
import logo from '../assets/logo.png'; 
import { API_ENDPOINTS } from '../api/endpoints'; 
import { toast } from 'react-toastify';

const HomeDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate(); 

  const [stats, setStats] = useState([
    { title: 'Orders', value: '0' },
    { title: 'Products', value: '0' },
    { title: 'Users', value: '0' },
  ]);
  const [recentActivity, setRecentActivity] = useState([
    { name: 'Loading...', time: '...' }
  ]);
  const [performance, setPerformance] = useState([]); 
  const [revenue, setRevenue] = useState({ today: '0', monthly: '0' });

  const handleLogout = () => {
    toast.info("Logging out..."); 
    localStorage.removeItem('token');
    localStorage.removeItem('userRole'); 
    
    setTimeout(() => {
      navigate('/selection'); 
      window.location.reload(); 
    }, 1000);
  };

  useEffect(() => {
    document.title = "Home | Dashboard";
    window.scrollTo(0, 0); 

    const fetchDashboardData = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.DASHBOARD_SUMMARY, {
          headers: {
            "ngrok-skip-browser-warning": "69420",
            "Authorization": `Bearer ${localStorage.getItem('token')}` 
          }
        });

        if (response && response.data) {
          if (response.data.stats) setStats(response.data.stats);
          
          if (response.data.recentActivity) {
            setRecentActivity(response.data.recentActivity);
          }
          
          if (response.data.performance) setPerformance(response.data.performance);
          if (response.data.revenue) setRevenue(response.data.revenue);
        }
      } catch (error) {
        console.error("Dashboard Fetch Error:", error);
        toast.error("Failed to fetch dashboard data ");
        
        if (error.response?.status === 401) {
            navigate('/login');
        }
      }
    };

    fetchDashboardData();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#F9FFF9] font-inter text-[#432818] flex flex-col">
      
      <header className="sticky top-0 z-[110] bg-[#F9FFF9] w-full px-8 py-6 flex items-center justify-between md:justify-start gap-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
          <span className="text-[28px] font-bold tracking-tight text-[#432818]">GreenMindAI</span>
        </div>
        <button className="md:hidden p-2 cursor-pointer" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </header>

      <h1 className="text-[32px] md:text-[48px] font-[800] text-center mt-6 mb-4 text-[#432818]">Dashboard</h1>

      <div className="flex flex-col md:flex-row px-6 md:px-12 pb-10 items-start gap-10">
        
        <aside className={`
          fixed inset-y-0 left-0 z-[120] w-64 bg-white shadow-xl p-8 transform transition-transform duration-300 ease-in-out
          md:sticky md:top-[120px] md:translate-x-0 md:shadow-sm md:rounded-[25px] md:h-fit md:border md:border-gray-100
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <nav className="flex flex-col gap-8 text-[#432818]">
            <NavLink to="/home-dashboard" className={({ isActive }) => `text-left text-[20px] transition-colors pl-3 ${isActive ? 'text-[#432818] font-bold border-l-4 border-[#432818]' : 'text-gray-400 font-semibold hover:text-[#432818]'}`}>Dashboard</NavLink>
            <NavLink to="/product-dashboard" className={({ isActive }) => `text-left text-[20px] transition-colors pl-3 ${isActive ? 'text-[#432818] font-bold border-l-4 border-[#432818]' : 'text-gray-400 font-semibold hover:text-[#432818]'}`}>Products</NavLink>
            <NavLink to="/user-activity" className={({ isActive }) => `text-left text-[20px] transition-colors pl-3 ${isActive ? 'text-[#432818] font-bold border-l-4 border-[#432818]' : 'text-gray-400 font-semibold hover:text-[#432818]'}`}>User Activity</NavLink>
            <NavLink to="/orders" className={({ isActive }) => `text-left text-[20px] transition-colors pl-3 ${isActive ? 'text-[#432818] font-bold border-l-4 border-[#432818]' : 'text-gray-400 font-semibold hover:text-[#432818]'}`}>Orders</NavLink>
            
            <button 
              onClick={handleLogout}
              className="text-left text-[20px] pl-3 text-red-600 font-semibold hover:text-red-800 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </nav>
        </aside>

        {isSidebarOpen && <div className="fixed inset-0 bg-black/20 z-[115] md:hidden" onClick={() => setIsSidebarOpen(false)} />}

        <main className="flex-1 w-full text-[#432818]">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white p-6 rounded-[20px] shadow-sm border border-gray-100 min-h-[130px] flex flex-col justify-center">
                <p className="text-gray-400 text-[18px] mb-2">{stat.title}</p>
                <h2 className="font-bold text-3xl md:text-4xl text-gray-800">
                  {stat.value}
                </h2>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 items-start">
            <div className="flex flex-col gap-8 w-full">
                <div className="bg-white p-6 md:p-8 rounded-[25px] shadow-sm border border-gray-100 min-h-[250px]">
                  <h3 className="text-[24px] md:text-[28px] font-bold mb-8 text-[#432818]">Recent Activity</h3>
                  <div className="space-y-6">
                    {recentActivity.map((activity, i) => (
                      <div key={i} className="flex justify-between items-center text-gray-500 border-b border-gray-50 pb-2">
                        <span>{activity.action || activity.name}</span>
                        <span className="font-bold text-gray-800">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[25px] shadow-sm border border-gray-100">
                  <p className="text-gray-400 text-[18px] mb-4">Today’s Revenue</p>
                  <div className="flex justify-between items-end">
                    <h2 className="font-bold text-4xl text-gray-800">
                      {revenue.today}$
                    </h2>
                    <div className="text-right">
                      <p className="text-gray-300 text-[12px] uppercase italic">Monthly Revenue</p>
                      <p className="font-bold text-[18px] text-gray-400">
                        {revenue.monthly}$
                      </p>
                    </div>
                  </div>
                </div>
            </div>

            <div className="w-full">
                <div className="bg-white p-6 md:p-8 rounded-[25px] shadow-sm border border-gray-100 h-auto">
                  <h3 className="text-[24px] md:text-[28px] font-bold mb-8 text-[#432818]">Product Performance</h3>
                  <div className="space-y-6">
                    {performance.length > 0 ? (
                      performance.map((perf, i) => (
                        <div key={i} className="flex justify-between items-center text-gray-500 border-b border-gray-50 pb-2">
                          <span>{perf.title || perf.item}</span>
                          <span className="font-bold text-gray-800">{perf.value}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400 italic text-center py-4">No performance data yet</p>
                    )}
                  </div>
                </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default HomeDashboard;