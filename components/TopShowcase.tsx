import React from 'react';

interface TopShowcaseProps {
  modelImage: string | null;
  clothingImage: string | null;
  resultImage: string | null;
}

const Card: React.FC<{ 
  title: string; 
  image: string | null; 
  rotation: string; 
  zIndex: number;
  placeholderText: string;
}> = ({ title, image, rotation, zIndex, placeholderText }) => {
  return (
    <div 
      className={`relative w-48 h-64 md:w-56 md:h-72 bg-white rounded-2xl shadow-xl transition-all duration-500 ease-in-out transform hover:scale-110 hover:z-50 hover:rotate-0 flex flex-col overflow-hidden border-4 border-white ${rotation}`}
      style={{ zIndex }}
    >
      <div className="absolute top-0 left-0 right-0 bg-white/90 backdrop-blur-sm z-10 px-3 py-2 border-b border-gray-100">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{title}</span>
      </div>
      
      <div className="flex-1 w-full h-full bg-gray-100 flex items-center justify-center relative">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center p-4">
            <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
            </div>
            <p className="text-sm text-gray-400">{placeholderText}</p>
          </div>
        )}
      </div>
      
      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none"></div>
    </div>
  );
};

export const TopShowcase: React.FC<TopShowcaseProps> = ({ modelImage, clothingImage, resultImage }) => {
  return (
    <div className="w-full py-12 flex justify-center items-center perspective-1000 min-h-[400px]">
      <div className="relative flex justify-center items-center w-full max-w-4xl px-4">
        {/* Decorative Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-primary/20 blur-3xl rounded-full"></div>

        <div className="relative -mr-16 md:-mr-24 transform translate-y-4">
           <Card 
            title="模特 (Model)" 
            image={modelImage} 
            rotation="-rotate-12 hover:-rotate-2" 
            zIndex={10} 
            placeholderText="待上传模特"
           />
        </div>

        <div className="relative z-20 mb-8 animate-float">
           <Card 
            title="效果 (Result)" 
            image={resultImage} 
            rotation="rotate-0" 
            zIndex={30} 
            placeholderText="等待生成..."
           />
        </div>

        <div className="relative -ml-16 md:-ml-24 transform translate-y-4">
           <Card 
            title="服装 (Clothing)" 
            image={clothingImage} 
            rotation="rotate-12 hover:rotate-2" 
            zIndex={20} 
            placeholderText="待选择服装"
           />
        </div>
      </div>
    </div>
  );
};