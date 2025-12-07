
import React, { useState } from 'react';
import { TopShowcase } from './components/TopShowcase';
import { HistoryGallery } from './components/HistoryGallery';
import { ImageUploadZone } from './components/ImageUploadZone';
import { 
  ClothingItem, 
  ModelItem,
  GenerationResult, 
  AppStep, 
  PRESET_CLOTHES, 
  PoseType, 
  AngleType,
  ClothingDraft
} from './types';
import { generateClothingFromText, generateTryOnResult, analyzeClothingImage } from './services/geminiService';

function App() {
  // State
  const [currentStep, setCurrentStep] = useState<AppStep>(1);
  
  // Data State
  const [modelImage, setModelImage] = useState<string | null>(null);
  const [clothingImage, setClothingImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  
  // Library State
  const [availableClothes, setAvailableClothes] = useState<ClothingItem[]>(PRESET_CLOTHES);
  const [modelLibrary, setModelLibrary] = useState<ModelItem[]>([]);
  const [history, setHistory] = useState<GenerationResult[]>([]);
  
  // Clothing Creation State (Step 2)
  const [clothingDrafts, setClothingDrafts] = useState<ClothingDraft[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingCloth, setIsGeneratingCloth] = useState<string | null>(null); // storing ID of draft being generated
  
  // Generation Params (Step 3)
  const [selectedPose, setSelectedPose] = useState<PoseType>(PoseType.Standing);
  const [selectedAngles, setSelectedAngles] = useState<AngleType[]>([AngleType.Front]);
  
  // Loading State
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // --- Handlers: Model ---
  const handleModelUpload = (base64: string) => {
    const newModel: ModelItem = {
        id: Date.now().toString(),
        url: base64,
        timestamp: Date.now()
    };
    setModelLibrary(prev => [newModel, ...prev]);
    setModelImage(base64);
  };

  const handleSelectModel = (url: string) => {
    setModelImage(url);
    if (currentStep === 1) setCurrentStep(2);
  };

  const handleDeleteModel = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setModelLibrary(prev => prev.filter(m => m.id !== id));
      if (modelImage && modelLibrary.find(m => m.id === id)?.url === modelImage) {
          setModelImage(null);
      }
  };

  // --- Handlers: Clothing Analysis & Generation ---
  const handleAnalyzeCloth = async (base64: string) => {
    setIsAnalyzing(true);
    try {
        const descriptions = await analyzeClothingImage(base64);
        
        const newDrafts: ClothingDraft[] = descriptions.map((desc, index) => ({
            id: `${Date.now()}-${index}`,
            text: desc,
            timestamp: Date.now()
        }));
        
        // Sort by time is implicit by prepend, but let's ensure
        setClothingDrafts(prev => [...newDrafts, ...prev]);
    } catch (e) {
        console.error("Analysis failed", e);
        alert("图片分析失败，请重试");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleUpdateDraft = (id: string, newText: string) => {
      setClothingDrafts(prev => prev.map(d => d.id === id ? { ...d, text: newText } : d));
  };

  const handleDeleteDraft = (id: string) => {
      setClothingDrafts(prev => prev.filter(d => d.id !== id));
  };

  const handleGenerateFromDraft = async (draft: ClothingDraft) => {
    if (!draft.text.trim()) return;
    setIsGeneratingCloth(draft.id);
    try {
      const base64 = await generateClothingFromText(draft.text);
      
      const newItem: ClothingItem = {
        id: Date.now().toString(),
        url: base64,
        source: 'generated',
        name: draft.text.slice(0, 15) + '...',
        description: draft.text
      };

      setAvailableClothes(prev => [newItem, ...prev]);
      setClothingImage(base64); // Auto select
    } catch (error) {
      console.error("Clothing generation failed", error);
      alert("服装生成失败，请重试");
    } finally {
      setIsGeneratingCloth(null);
    }
  };

  const handleDeleteCloth = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAvailableClothes(prev => prev.filter(item => item.id !== id));
    if (availableClothes.find(item => item.id === id)?.url === clothingImage) {
        setClothingImage(null);
    }
  };

  // --- Handlers: Synthesis ---
  const handleToggleAngle = (angle: AngleType) => {
      setSelectedAngles(prev => {
          if (prev.includes(angle)) {
              if (prev.length === 1) return prev; // Keep at least one
              return prev.filter(a => a !== angle);
          } else {
              return [...prev, angle];
          }
      });
  };

  const handleSynthesizeBatch = async () => {
    if (!modelImage || !clothingImage) return;
    setIsSynthesizing(true);
    setResultImage(null); // Clear preview

    try {
      // Process all selected angles in parallel (or sequential if preferred, but parallel is faster)
      const promises = selectedAngles.map(async (angle) => {
          const resultUrl = await generateTryOnResult(modelImage, clothingImage, selectedPose, angle);
          return { resultUrl, angle };
      });

      const results = await Promise.all(promises);

      // Save all to history
      const newHistoryItems: GenerationResult[] = results.map(r => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          modelUrl: modelImage,
          clothingUrl: clothingImage,
          resultUrl: r.resultUrl,
          timestamp: Date.now(),
          params: { pose: selectedPose, angle: r.angle }
      }));

      setHistory(prev => [...newHistoryItems, ...prev]);
      
      // Show the first one as main preview
      if (results.length > 0) {
          setResultImage(results[0].resultUrl);
      }

    } catch (error) {
      console.error("Synthesis failed", error);
      alert("部分或全部生成失败，请重试");
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleDeleteHistory = (id: string) => {
      setHistory(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen pb-20 font-sans">
      {/* Navbar */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg shadow-md">
                S
              </div>
              <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                StyleMorph AI
              </span>
            </div>
            <div className="text-sm text-slate-500">
              Gemini 2.5 Image 驱动
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Showcase Area */}
        <TopShowcase 
          modelImage={modelImage} 
          clothingImage={clothingImage} 
          resultImage={resultImage}
        />

        {/* Main Steps Container */}
        <div className="mt-8 bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 min-h-[500px]">
          
          {/* Step Navigation */}
          <div className="flex border-b border-slate-100">
            {[1, 2, 3].map((step) => (
              <button
                key={step}
                onClick={() => setCurrentStep(step as AppStep)}
                className={`flex-1 py-5 text-center font-medium transition-all relative ${
                  currentStep === step 
                    ? 'text-primary bg-primary/5' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                    <span className={`text-xs font-bold border rounded-full w-6 h-6 flex items-center justify-center ${currentStep === step ? 'border-primary bg-primary text-white' : 'border-current'}`}>
                    {step}
                    </span>
                    <span className="text-sm md:text-base">
                        {step === 1 ? '模特管理' : step === 2 ? 'AI服装工坊' : '全视角合成'}
                    </span>
                </div>
                {currentStep === step && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            ))}
          </div>

          {/* Step Content Area */}
          <div className="p-6 md:p-8">
            
            {/* Step 1: Model Selection */}
            {currentStep === 1 && (
              <div className="grid md:grid-cols-2 gap-8">
                {/* Upload Section */}
                <div className="flex flex-col space-y-4">
                    <div className="space-y-1">
                      <h2 className="text-xl font-bold text-slate-800">上传模特</h2>
                      <p className="text-slate-500 text-sm">上传全身或半身照，作为换装的基础模特。</p>
                    </div>
                    <ImageUploadZone 
                      onImageUpload={handleModelUpload}
                      className="w-full h-80 bg-slate-50"
                      placeholderText="点击或拖拽上传模特照片"
                      subText="支持 JPG, PNG, WEBP"
                    />
                </div>

                {/* Library Section */}
                <div className="bg-slate-50 rounded-2xl p-4 flex flex-col h-full">
                    <h3 className="font-bold text-slate-700 mb-4 px-1">模特库 ({modelLibrary.length})</h3>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {modelLibrary.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm space-y-2">
                                <span className="text-4xl opacity-20">👤</span>
                                <p>暂无模特，请先上传</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-3">
                                {modelLibrary.map((model) => (
                                    <div 
                                      key={model.id}
                                      onClick={() => handleSelectModel(model.url)}
                                      className={`aspect-[3/4] rounded-lg overflow-hidden cursor-pointer relative group border-2 transition-all shadow-sm ${
                                        modelImage === model.url ? 'border-primary ring-2 ring-primary/20' : 'border-white hover:border-slate-300'
                                      }`}
                                    >
                                        <img src={model.url} alt="model" className="w-full h-full object-cover" />
                                        <button 
                                            onClick={(e) => handleDeleteModel(model.id, e)}
                                            className="absolute top-1 right-1 w-6 h-6 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600 z-10"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                        {modelImage === model.url && (
                                            <div className="absolute inset-0 bg-primary/10 pointer-events-none flex items-center justify-center">
                                                <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">当前选中</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
              </div>
            )}

            {/* Step 2: Clothing Workshop */}
            {currentStep === 2 && (
              <div className="grid lg:grid-cols-12 gap-8 h-[600px] lg:h-[700px]">
                 
                 {/* Left: Creation Lab (Upload & Drafts) - span 7 */}
                 <div className="lg:col-span-7 flex flex-col h-full space-y-4">
                    <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex-none">
                        <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <span className="w-6 h-6 bg-indigo-600 text-white rounded-md flex items-center justify-center text-xs">AI</span>
                            1. 智能分析与提取
                        </h3>
                        <p className="text-xs text-slate-500 mb-3">上传任意包含服装的图片，AI将自动识别并生成描述，您可修改描述后生成高清服装图。</p>
                        
                        <div className="flex gap-4 items-center">
                             <div className="w-32 h-20 flex-none">
                                <ImageUploadZone 
                                    onImageUpload={handleAnalyzeCloth}
                                    className="w-full h-full bg-white text-xs"
                                    placeholderText={isAnalyzing ? "分析中..." : "上传参考图"}
                                    subText=""
                                    icon={isAnalyzing ? <div className="animate-spin w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full"/> : undefined}
                                />
                             </div>
                             <div className="flex-1 text-xs text-slate-400 border-l pl-4 border-indigo-100">
                                {isAnalyzing ? (
                                    <span className="text-indigo-600 font-medium animate-pulse">正在识别服装特征...</span>
                                ) : (
                                    "提示：识别结果将显示在下方草稿箱中，支持手动编辑。"
                                )}
                             </div>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col min-h-0">
                        <h3 className="font-bold text-slate-800 mb-2 px-1 flex justify-between items-center">
                            服装描述草稿箱
                            <span className="text-xs font-normal text-slate-400">按时间排序</span>
                        </h3>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar pb-2">
                            {clothingDrafts.length === 0 ? (
                                <div className="h-full border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-sm flex-col">
                                    <span>📝 暂无草稿</span>
                                    <span className="text-xs mt-1">请先上传图片进行分析</span>
                                </div>
                            ) : (
                                clothingDrafts.map((draft) => (
                                    <div key={draft.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                                                {new Date(draft.timestamp).toLocaleTimeString()}
                                            </span>
                                            <button 
                                                onClick={() => handleDeleteDraft(draft.id)}
                                                className="text-slate-300 hover:text-red-500 transition-colors"
                                                title="删除草稿"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        </div>
                                        <textarea
                                            className="w-full text-sm text-slate-700 bg-slate-50 border-0 rounded-lg p-2 focus:ring-1 focus:ring-primary resize-none mb-3"
                                            rows={3}
                                            value={draft.text}
                                            onChange={(e) => handleUpdateDraft(draft.id, e.target.value)}
                                        />
                                        <button
                                            onClick={() => handleGenerateFromDraft(draft)}
                                            disabled={!!isGeneratingCloth}
                                            className="w-full py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isGeneratingCloth === draft.id ? (
                                                <>
                                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                                                    生成中...
                                                </>
                                            ) : (
                                                <>⚡ 生成高清服装图</>
                                            )}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                 </div>

                 {/* Right: Asset Library - span 5 */}
                 <div className="lg:col-span-5 bg-slate-50 rounded-2xl p-4 flex flex-col h-full border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-2">2. 选择服装 ({availableClothes.length})</h3>
                    <p className="text-xs text-slate-500 mb-4">点击选择用于合成的服装，AI生成的结果将自动保存在此。</p>
                    
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="grid grid-cols-2 gap-3">
                            {availableClothes.map((cloth) => (
                                <div 
                                    key={cloth.id}
                                    onClick={() => setClothingImage(cloth.url)}
                                    className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all group ${
                                        clothingImage === cloth.url ? 'border-primary ring-2 ring-primary/10' : 'border-white hover:border-slate-300'
                                    }`}
                                >
                                    <img src={cloth.url} alt={cloth.name} className="w-full h-full object-cover bg-white" />
                                    
                                    {/* Badges */}
                                    <div className="absolute top-1 left-1 flex gap-1">
                                        {cloth.source === 'generated' && (
                                            <span className="w-2 h-2 bg-pink-500 rounded-full shadow-sm ring-1 ring-white" title="AI生成"></span>
                                        )}
                                        {cloth.source === 'upload' && (
                                            <span className="w-2 h-2 bg-blue-500 rounded-full shadow-sm ring-1 ring-white" title="本地上传"></span>
                                        )}
                                    </div>

                                    {/* Delete */}
                                    <button 
                                        onClick={(e) => handleDeleteCloth(cloth.id, e)}
                                        className="absolute top-1 right-1 p-1.5 bg-white/90 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white shadow-sm z-10"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                                            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                                        </svg>
                                    </button>

                                    {/* Selection Overlay */}
                                    {clothingImage === cloth.url && (
                                        <div className="absolute inset-0 border-2 border-primary rounded-xl pointer-events-none bg-primary/5 flex items-end justify-center pb-2">
                                            <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold">已选择</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                 </div>

              </div>
            )}

            {/* Step 3: Synthesis */}
            {currentStep === 3 && (
              <div className="max-w-3xl mx-auto space-y-10 py-6">
                
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Pose Selection */}
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <label className="block text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-primary rounded-full"></span>
                        1. 选择动作姿态 (单选)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.values(PoseType).map((pose) => (
                        <button
                          key={pose}
                          onClick={() => setSelectedPose(pose)}
                          className={`py-3 px-4 text-sm rounded-lg border transition-all relative overflow-hidden ${
                            selectedPose === pose 
                            ? 'border-primary bg-primary text-white font-medium shadow-md transform scale-105' 
                            : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {pose}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Angle Selection (Multi) */}
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <label className="block text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                         <span className="w-1 h-4 bg-secondary rounded-full"></span>
                         2. 选择展示角度 (多选)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.values(AngleType).map((angle) => {
                        const isSelected = selectedAngles.includes(angle);
                        return (
                            <button
                              key={angle}
                              onClick={() => handleToggleAngle(angle)}
                              className={`py-3 px-4 text-sm rounded-lg border transition-all flex items-center justify-between ${
                                isSelected 
                                ? 'border-secondary bg-secondary/10 text-secondary font-bold' 
                                : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {angle}
                              {isSelected && (
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                              )}
                            </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-slate-400 mt-2 text-right">可同时生成多个视角图</p>
                  </div>
                </div>

                {/* Synthesis Action */}
                <div className="flex flex-col items-center gap-6">
                    <button
                        onClick={handleSynthesizeBatch}
                        disabled={isSynthesizing || !modelImage || !clothingImage}
                        className="group relative w-full md:w-2/3 overflow-hidden rounded-2xl bg-slate-900 p-px font-bold text-white shadow-xl shadow-indigo-500/20 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                    >
                        <span className="absolute inset-[-1000%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)]" />
                        <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-2xl bg-slate-900 px-8 py-6 text-lg backdrop-blur-3xl transition-all group-hover:bg-slate-800/90 gap-3">
                            {isSynthesizing ? (
                                <>
                                    <svg className="animate-spin h-6 w-6 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>正在批量生成 {selectedAngles.length} 张效果图...</span>
                                </>
                            ) : (
                                <>
                                    <span>✨ 立即生成 (×{selectedAngles.length})</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-indigo-400">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                                    </svg>
                                </>
                            )}
                        </span>
                    </button>
                    
                    {!modelImage || !clothingImage ? (
                        <p className="text-red-400 text-sm bg-red-50 px-3 py-1 rounded-full">⚠️ 请先完成第1步和第2步的选择</p>
                    ) : (
                        <p className="text-slate-400 text-sm">
                            将为您生成: <strong className="text-slate-700">{selectedPose}</strong> 的 
                            <span className="mx-1">{selectedAngles.join('、')}</span>
                        </p>
                    )}
                </div>

              </div>
            )}

          </div>
        </div>

        {/* History Section */}
        <HistoryGallery history={history} onDelete={handleDeleteHistory} />
        
      </main>
    </div>
  );
}

export default App;
