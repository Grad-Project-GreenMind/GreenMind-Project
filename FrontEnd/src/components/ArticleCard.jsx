

import React from 'react';

function ArticleCard({ title, description, imageUrl, link }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full border border-gray-100 font-inter">
      {/* Article img */}
      <div className="w-full h-52 md:h-56 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
        />
      </div>

      {/* Article content */}
      <div className="p-6 md:p-8 flex flex-col flex-grow text-left">
        
        {/*article title*/}
        <h4 className="text-[20px] md:text-[24px] font-bold text-[#683A2F] mb-4 leading-tight min-h-[64px]">
          {title}
        </h4>

        <p className="text-[16px] md:text-[18px] font-normal text-[#4B4B4B] mb-8 flex-grow leading-relaxed">
          {description}
        </p>

        {/* Read more button */}
        <a 
          href={link} 
          target="_blank"             
          rel="noopener noreferrer"   
          className="w-full md:w-auto inline-block bg-[#683A2F] text-white py-3 px-10 rounded-xl font-semibold text-[18px] shadow-md hover:bg-[#522e25] self-start transition-all no-underline text-center"
        >
          Read more
        </a>
      </div>
    </div>
  );
}

export default ArticleCard;