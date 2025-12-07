
export interface ClothingItem {
  id: string;
  url: string; // Base64 or remote URL
  source: 'upload' | 'preset' | 'generated';
  name?: string;
  description?: string; // The prompt used to generate this
}

export interface ClothingDraft {
  id: string;
  text: string;
  timestamp: number;
}

export interface ModelItem {
  id: string;
  url: string;
  timestamp: number;
}

export interface GenerationResult {
  id: string;
  modelUrl: string;
  clothingUrl: string;
  resultUrl: string;
  timestamp: number;
  params: {
    pose: string;
    angle: string;
  };
}

export type AppStep = 1 | 2 | 3;

export enum PoseType {
  Standing = '站立',
  Sitting = '坐姿',
  Walking = '行走',
  Running = '跑步',
  Posing = '时尚摆拍'
}

export enum AngleType {
  Front = '正视图',
  Side = '侧视图',
  Back = '背视图',
  ThreeQuarter = '45度角'
}

export const PRESET_CLOTHES: ClothingItem[] = [
  { id: 'p1', url: 'https://picsum.photos/id/10/400/400', source: 'preset', name: '森林系连衣裙', description: 'Forest style green dress' },
  { id: 'p2', url: 'https://picsum.photos/id/20/400/400', source: 'preset', name: '极简白T恤', description: 'Minimalist white t-shirt' },
  { id: 'p3', url: 'https://picsum.photos/id/30/400/400', source: 'preset', name: '复古牛仔外套', description: 'Vintage denim jacket' },
  { id: 'p4', url: 'https://picsum.photos/id/40/400/400', source: 'preset', name: '商务西装', description: 'Business suit' },
];
