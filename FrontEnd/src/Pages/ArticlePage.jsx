
import React, { useEffect, useState } from 'react'; 
import axios from 'axios';
import ArticleCard from '../components/ArticleCard';
import articleImg from '../assets/Article Image.png'; 
import { API_ENDPOINTS } from '../api/endpoints';
import { toast } from 'react-toastify';

function ArticlePage() {
  const [featured, setFeatured] = useState(null); 
  const [articlesList, setArticlesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setLoading(true);
        const response = await axios.get(API_ENDPOINTS.GET_ARTICLES, {
          headers: {
            "ngrok-skip-browser-warning": "69420" 
          }
        });

        if (response.data) {
          setFeatured(response.data.featuredArticle || null);
          setArticlesList(response.data.allArticles || []);
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        const msg = "Unable to connect to the server at the moment.";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    document.title = "Articles";
    window.scrollTo(0, 0); 
    fetchArticles();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#683A2F] font-bold text-2xl bg-[#F7FEF4]">
        Loading Articles...
      </div>
    );
  }

  return (
    <div className="bg-[#F7FEF4] pt-10 md:pt-16 pb-20 px-5 md:px-10 font-inter">
      <div className="max-w-[1440px] mx-auto">
        
        {/* Featured Today */}
        {featured ? (
          <div className="flex flex-col items-center text-center">
            <h2 className="text-[22px] md:text-[28px] font-bold text-[#683A2F] uppercase tracking-widest mb-1">
              Reader's Choice
            </h2>
            <p className="text-[16px] md:text-[18px] text-[#4B4B4B] mb-10">
              This month's most popular article is: <span className="font-semibold text-[#683A2F]">"{featured.title}"</span>
            </p>

            <div className="w-full max-w-[1000px] bg-[rgba(141,73,58,0.25)] rounded-[40px] overflow-hidden shadow-xl mb-20 border border-[#683a2f1a]">
              <div className="py-4 text-center font-bold text-[#683A2F] uppercase tracking-widest text-xl bg-white/30">
                Featured Today
              </div>
              <img 
                src={featured.imageUrl || articleImg} 
                alt="Featured" 
                className="w-full h-[350px] object-cover" 
              />
              <div className="p-8">
                <p className="text-[#4B4B4B] mb-8 text-lg leading-relaxed">
                  {featured.description}
                </p>
                <a 
                  href={featured.url || "#"} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-[#683A2F] text-white py-3 px-12 rounded-2xl font-bold transition-all hover:bg-[#522e25] inline-block no-underline"
                >
                  Read more
                </a>
              </div>
            </div>
          </div>
        ) : (
          !error && <p className="text-center text-gray-500 mb-10">No featured article today.</p>
        )}

        <h2 className="text-center text-[48px] font-black text-[#683A2F] mb-16 uppercase">Articles</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {articlesList && articlesList.length > 0 ? (
            articlesList.map((art) => (
              <ArticleCard 
                key={art.id} 
                title={art.title} 
                description={art.description} 
                imageUrl={art.imageUrl || articleImg} 
                link={art.url || "#"} 
              />
            ))
          ) : (
            <div className="col-span-full text-center py-10">
              {error ? (
                <p className="text-red-500 font-bold">{error}</p>
              ) : (
                <p className="text-gray-500 italic text-xl">No articles available.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ArticlePage;