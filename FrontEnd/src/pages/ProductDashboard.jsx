import React, { useState, useRef, useEffect } from 'react'; 
import { Menu, X, Search, Camera, ChevronDown } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios'; 
import { API_ENDPOINTS } from '../api/endpoints'; 
import logo from '../assets/logo.png'; 
import editIcon from '../assets/Edit.png';
import deleteIcon from '../assets/delete.png';
import productImgPlaceholder from '../assets/logo.png'; 
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const ProductDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null); 
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate(); 

  const [newProduct, setNewProduct] = useState({ id: '', name: '', description: '', categoryId: 1, price: '' });

  const handleLogout = () => {
    toast.info("Logging out..."); 
    localStorage.removeItem('token');
    localStorage.removeItem('userRole'); 
    
    setTimeout(() => {
      navigate('/selection'); 
      window.location.reload(); 
    }, 1000);
  };

  const getAuthHeaders = () => ({
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'ngrok-skip-browser-warning': '69420',
    }
  });

  useEffect(() => {
    document.title = " Products | Dashboard";
    window.scrollTo(0, 0); 
    fetchProducts(); 
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_ENDPOINTS.PRODUCTS, getAuthHeaders()); 
      if (response.data) {
        const data = response.data.products || response.data;
        const sortedData = Array.isArray(data) ? [...data] : [];
        setProducts(sortedData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load products");
      setProducts([]); 
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file); 
      setSelectedImage(URL.createObjectURL(file)); 
    }
  };

  const handleOpenAddForm = () => {
    setIsEditing(false);
    setNewProduct({ id: '', name: '', description: '', categoryId: 1, price: '' });
    setSelectedImage(null);
    setImageFile(null);
    setShowAddForm(true);
  };

  const handleEditClick = () => {
    if (selectedRowId) {
      const productToEdit = products.find(p => p.id === selectedRowId);
      if (productToEdit) {
        setNewProduct({
          ...productToEdit,
          categoryId: productToEdit.categoryId || 1,
          price: productToEdit.price?.toString().replace('$', '') 
        });
        setSelectedImage(productToEdit.image);
        setIsEditing(true);
        setShowAddForm(true);
      }
    } else {
      toast.warn("Please select a product from the table first!");
    }
  };

  const handleDelete = async () => {
    if (selectedRowId) {
      if (window.confirm("Are you sure you want to delete this product?")) {
        try {
          await axios.delete(`${API_ENDPOINTS.PRODUCTS}/${selectedRowId}`, getAuthHeaders());
          toast.success("Product deleted successfully!");
          fetchProducts(); 
          setSelectedRowId(null);
        } catch (error) {
          console.error("Delete failed:", error);
          toast.error("Could not delete from server");
        }
      }
    } else {
      toast.warn("Please select a product from the table first!");
    }
  };

  const handleSaveProduct = async () => {
    try {
      const formData = new FormData();
      formData.append("Name", newProduct.name);
      formData.append("Description", newProduct.description);
      formData.append("Price", parseFloat(newProduct.price) || 0);

      const categoryMapping = { 1: "Seeds", 2: "Soil", 3: "Tools" };
      const selectedCategoryName = categoryMapping[newProduct.categoryId];
      
      formData.append("CategoryName", selectedCategoryName);
      formData.append("category", selectedCategoryName);

      if (imageFile) {
        formData.append("Image", imageFile); 
      }

      const config = getAuthHeaders();

      if (isEditing) {
        await axios.put(`${API_ENDPOINTS.PRODUCTS}/${selectedRowId}`, formData, config);
        toast.success("Product updated successfully!");
      } else {
        await axios.post(API_ENDPOINTS.PRODUCTS, formData, config);
        toast.success("Product added successfully!");
      }
      
      setShowAddForm(false);
      fetchProducts(); 
    } catch (error) {
      console.error("Save failed details:", error.response?.data);
      toast.error("Error saving product");
    }
  };

  const filteredProducts = products.filter(p => {
    const query = searchQuery.toLowerCase();
    const catName = (p.categoryName || p.category || (p.categoryId == 1 ? "Seeds" : p.categoryId == 2 ? "Soil" : p.categoryId == 3 ? "Tools" : "")).toLowerCase();
    
    return (
      p.name?.toLowerCase().includes(query) || 
      p.id?.toString().includes(query) || 
      catName.includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-[#F9FFF9] font-inter text-[#432818] flex flex-col">
      <header className="sticky top-0 z-[110] bg-[#F9FFF9] w-full px-8 py-6 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <img src={logo} alt="Logo" className="w-10 h-10 md:w-12 md:h-12 object-contain" />
          <span className="text-[22px] md:text-[28px] font-bold tracking-tight text-[#432818]">GreenMindAI</span>
        </div>
        <button className="md:hidden p-2 ml-auto cursor-pointer" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </header>

      <div className="flex flex-col md:flex-row px-6 md:px-12 pb-10 items-start gap-10">
        <aside className={`fixed inset-y-0 left-0 z-[120] w-64 bg-white shadow-xl p-8 transform transition-transform duration-300 ease-in-out md:sticky md:top-[120px] md:translate-x-0 md:shadow-sm md:rounded-[25px] md:h-fit md:border md:border-gray-100 md:mt-[175px] ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <nav className="flex flex-col gap-8 text-[#432818]">
            <NavLink to="/home-dashboard" className={({ isActive }) => `text-left text-[18px] transition-colors pl-3 ${isActive ? 'font-bold border-l-4 border-[#432818]' : 'text-gray-400 font-semibold hover:text-[#432818]'}`}>Dashboard</NavLink>
            <NavLink to="/product-dashboard" className={({ isActive }) => `text-left text-[18px] transition-colors pl-3 ${isActive ? 'font-bold border-l-4 border-[#432818]' : 'text-gray-400 font-semibold hover:text-[#432818]'}`}>Products</NavLink>
            <NavLink to="/user-activity" className={({ isActive }) => `text-left text-[18px] transition-colors pl-3 ${isActive ? 'font-bold border-l-4 border-[#432818]' : 'text-gray-400 font-semibold hover:text-[#432818]'}`}>User Activity</NavLink>
            <NavLink to="/orders" className={({ isActive }) => `text-left text-[18px] transition-colors pl-3 ${isActive ? 'font-bold border-l-4 border-[#432818]' : 'text-gray-400 font-semibold hover:text-[#432818]'}`}>Orders</NavLink>
            
            <button 
              onClick={handleLogout}
              className="text-left text-[18px] pl-3 text-red-600 font-semibold hover:text-red-800 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </nav>
        </aside>

        {isSidebarOpen && <div className="fixed inset-0 bg-black/20 z-[115] md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}

        <main className="flex-1 w-full pt-10">
          <div className="bg-[#E4F3E4] rounded-[25px] p-6 flex justify-between items-center px-10 border border-[#CDE5CD] mb-8 shadow-sm h-[100px]">
            <h2 className="text-[#432818] text-[28px] md:text-[44px] font-[800]">Products & Store</h2>
            <button onClick={handleOpenAddForm} className="bg-[#D6866E] text-white px-8 py-3 rounded-2xl font-bold text-[18px] cursor-pointer hover:bg-[#c1765f] transition-all shadow-md active:scale-[0.98]">Add new product</button>
          </div>

          {showAddForm ? (
            <div className="max-w-3xl mx-auto bg-white rounded-[20px] shadow-lg border border-gray-200 overflow-hidden mb-10 animate-in fade-in duration-300">
              <div className="flex justify-between items-center px-8 py-4 border-b border-gray-100">
                <h3 className="italic font-[800] text-2xl text-[#432818]">{isEditing ? 'Edit Product' : 'Basic Details'}</h3>
                <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-red-500"><X size={24} /></button>
              </div>
              
              <div className="p-10 space-y-8 text-[#432818]">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border border-gray-200 cursor-pointer" onClick={() => fileInputRef.current.click()}>
                    {selectedImage ? <img src={selectedImage} className="w-full h-full object-cover" alt="" /> : <Camera className="text-gray-400" size={32} />}
                  </div>
                  <span onClick={() => fileInputRef.current.click()} className="text-gray-500 font-medium italic cursor-pointer hover:text-[#432818] hover:underline transition-all">Add product Pic</span>
                  <input type="file" hidden ref={fileInputRef} onChange={handleImageChange} accept="image/*" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-gray-600 font-semibold">Product ID</label>
                    <input disabled value={isEditing ? selectedRowId : "Auto-generated"} className="w-full bg-gray-50 p-4 rounded-xl border border-gray-100 outline-none text-gray-400 font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-gray-600 font-semibold">Product Name</label>
                    <input value={newProduct.name} onChange={(e)=>setNewProduct({...newProduct, name: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl border border-gray-200 outline-none focus:border-[#A3B899]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-gray-600 font-semibold">Description</label>
                    <input value={newProduct.description} onChange={(e)=>setNewProduct({...newProduct, description: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl border border-gray-200 outline-none focus:border-[#A3B899]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-gray-600 font-semibold">Category</label>
                    <div className="relative">
                      <select value={newProduct.categoryId} onChange={(e)=>setNewProduct({...newProduct, categoryId: parseInt(e.target.value)})} className="w-full bg-gray-50 p-4 rounded-xl border border-gray-200 outline-none appearance-none cursor-pointer">
                        <option value={1}>Seeds</option>
                        <option value={2}>Soil</option>
                        <option value={3}>Tools</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-gray-600 font-semibold">Price</label>
                    <div className="relative">
                       <span className="absolute left-4 top-4 text-gray-400">$</span>
                       <input 
                         type="text"
                         inputMode="decimal"
                         value={newProduct.price} 
                         onChange={(e)=>{
                            const val = e.target.value;
                            if (/^\d*\.?\d*$/.test(val)) {
                              setNewProduct({...newProduct, price: val});
                            }
                         }} 
                         className="w-full bg-gray-50 p-4 pl-8 rounded-xl border border-gray-200 outline-none focus:border-[#A3B899]" 
                         placeholder="0.00"
                       />
                    </div>
                  </div>
                </div>
                <div className="pt-6">
                  <button onClick={handleSaveProduct} className="w-full bg-[#A3B899] text-[#432818] py-4 rounded-2xl font-[800] text-xl hover:bg-[#8fa683] transition-all shadow-md active:scale-[0.98]">
                    {isEditing ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-[15px] border border-gray-300 flex items-center overflow-hidden shadow-sm mb-8">
                <div className="relative flex-1 px-6 py-4 flex items-center border-r border-gray-300">
                  <Search className="text-gray-400 mr-4" size={26} />
                  <input type="text" placeholder="Search Products, IDs or Categories..." className="w-full bg-transparent text-[20px] outline-none font-medium" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>
                <div className="flex">
                  <button onClick={handleEditClick} className="px-10 py-4 border-r border-gray-300 hover:bg-gray-50 flex items-center gap-3 transition-colors cursor-pointer">
                    <img src={editIcon} className="w-6" alt="Edit" /> 
                    <span className="font-semibold text-gray-700">Edit</span>
                  </button>
                  <button onClick={handleDelete} className="px-10 py-4 hover:bg-red-50 flex items-center gap-3 transition-colors text-red-600 cursor-pointer">
                    <img src={deleteIcon} className="w-6" alt="Delete" /> 
                    <span className="font-semibold">Delete</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-[20px] border border-gray-400 shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-[#C1D9C1]">
                      <th className="p-5 border border-gray-400 font-bold">Product ID</th>
                      <th className="p-5 border border-gray-400 font-bold">Product</th>
                      <th className="p-5 border border-gray-400 font-bold">Description</th>
                      <th className="p-5 border border-gray-400 font-bold">Category</th>
                      <th className="p-5 border border-gray-400 font-bold">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="5" className="p-10 text-center italic text-gray-400">Loading products...</td></tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr><td colSpan="5" className="p-10 text-center text-gray-400 italic">No products found.</td></tr>
                    ) : filteredProducts.map((p) => (
                      <tr 
                        key={p.id} 
                        onClick={() => setSelectedRowId(selectedRowId === p.id ? null : p.id)} 
                        className={`cursor-pointer transition-colors ${selectedRowId === p.id ? 'bg-[#F2F9F2]' : 'hover:bg-gray-50'}`}
                      >
                        <td className="p-5 border border-gray-300 text-[#432818] font-bold ">
                          {String(p.id).padStart(3, '0')}
                        </td>
                        <td className="p-5 border border-gray-300 flex items-center gap-4">
                          <img src={p.image || productImgPlaceholder} className="w-12 h-12 rounded-lg object-cover border shadow-sm" alt="" />
                          <span className="font-semibold text-[#432818]">{p.name}</span>
                        </td>
                        <td className="p-5 border border-gray-300 text-gray-500 truncate max-w-xs">{p.description}</td>
                        <td className="p-5 border border-gray-300 text-gray-600 font-semibold">
                           {p.categoryName || p.category || (p.categoryId == 1 ? "Seeds" : p.categoryId == 2 ? "Soil" : p.categoryId == 3 ? "Tools" : "Seeds")}
                        </td>
                        <td className="p-5 border border-gray-300 font-bold text-[#432818]">${p.price}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProductDashboard;