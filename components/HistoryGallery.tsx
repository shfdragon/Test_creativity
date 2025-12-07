import React from 'react';
import { GenerationResult } from '../types';

interface HistoryGalleryProps {
  history: GenerationResult[];
  onDelete: (id: string) => void;
}

export const HistoryGallery: React.FC<HistoryGalleryProps> = ({ history, onDelete }) => {
  
  const handleDownload = (url: string, id: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `stylemorph-result-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (history.length === 0) return null;

  return (
    <div className="w-full mt-12 mb-8">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-xl font-bold text-slate-800">历史生成记录</h3>
        <span className="text-sm text-slate-500">共 {history.length} 条</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {history.map((item) => (
          <div key={item.id} className="group relative bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
            <div className="aspect-[3/4] w-full relative">
              <img 
                src={item.resultUrl} 
                alt="History" 
                className="w-full h-full object-cover"
              />
              
              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <span className="text-white text-xs font-medium px-2 py-1 border border-white/50 rounded-full mb-1">
                    {item.params.pose} - {item.params.angle}
                  </span>
                  
                  <div className="flex gap-2">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(item.resultUrl, item.id);
                        }}
                        className="p-2 bg-white/20 hover:bg-white text-white hover:text-slate-800 rounded-full backdrop-blur-sm transition-all transform hover:scale-110"
                        title="下载图片"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M12 12.75l-3.25-3.25m6.5 0L12 12.75m0 0V3" />
                        </svg>
                    </button>
                    
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item.id);
                        }}
                        className="p-2 bg-red-500/50 hover:bg-red-500 text-white rounded-full backdrop-blur-sm transition-all transform hover:scale-110"
                        title="删除记录"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                         </svg>
                    </button>
                  </div>
              </div>
            </div>
            <div className="p-2 flex gap-1 justify-between bg-slate-50">
                <div className="w-6 h-6 rounded overflow-hidden border border-slate-200">
                    <img src={item.modelUrl} className="w-full h-full object-cover" alt="m"/>
                </div>
                <div className="text-xs text-slate-400 flex items-center">
                    +
                </div>
                <div className="w-6 h-6 rounded overflow-hidden border border-slate-200">
                    <img src={item.clothingUrl} className="w-full h-full object-cover" alt="c"/>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};