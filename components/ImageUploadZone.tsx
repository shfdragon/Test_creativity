import React, { useState, useRef, DragEvent, ClipboardEvent, ChangeEvent } from 'react';

interface ImageUploadZoneProps {
  onImageUpload: (base64: string) => void;
  className?: string;
  placeholderText?: string;
  subText?: string;
  icon?: React.ReactNode;
}

export const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  onImageUpload,
  className = "",
  placeholderText = "点击上传图片",
  subText = "支持拖拽与粘贴",
  icon
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
        return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) onImageUpload(result);
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        e.preventDefault();
        const blob = items[i].getAsFile();
        if (blob) handleFile(blob);
        break;
      }
    }
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-2xl transition-all duration-200 outline-none flex flex-col items-center justify-center cursor-pointer overflow-hidden group ${
        isDragging 
          ? 'border-primary bg-primary/5 scale-[1.01]' 
          : 'border-slate-300 hover:border-primary hover:bg-slate-50'
      } ${className}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onPaste={onPaste}
      onClick={() => fileInputRef.current?.click()}
      tabIndex={0}
      role="button"
      aria-label="Upload image"
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
          }
        }}
        accept="image/*"
        className="hidden"
      />
      
      <div className="pointer-events-none flex flex-col items-center p-6 text-center w-full z-10">
         <div className={`transition-transform duration-300 mb-3 ${isDragging ? 'scale-110' : 'group-hover:scale-105'}`}>
           {icon || (
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-slate-400 group-hover:text-primary transition-colors">
               <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
             </svg>
           )}
         </div>
         <p className="font-medium text-slate-700 mb-1 group-hover:text-primary transition-colors">{isDragging ? '释放以上传' : placeholderText}</p>
         <p className="text-xs text-slate-400">{subText}</p>
      </div>
      
      {/* Visual hint for focus state */}
      <div className="absolute inset-0 rounded-2xl ring-2 ring-primary ring-opacity-0 focus:ring-opacity-50 pointer-events-none transition-all"></div>
    </div>
  );
};
