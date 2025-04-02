export interface Track {
  id: number;
  originalFilename: string;
  originalPath: string;
  lofiPath: string | null;
  fileSize: number;
  duration: number | null;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  effects: Effects;
  createdAt: Date | string;
}

export interface Effects {
  vinylCrackle: number;
  reverb: number;
  beatSlowdown: number;
  bassBoost: number;
  bitCrushing: number;
  backgroundNoise: number;
}

export interface TrackProgress {
  currentTime: number;
  duration: number;
  playing: boolean;
}
