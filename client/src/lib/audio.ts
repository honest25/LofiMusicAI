import { Howl } from 'howler';

interface AudioInstance {
  howl: Howl | null;
  playing: boolean;
}

// Keep track of active audio instances
const audioInstances = new Map<string, AudioInstance>();

// Create or get an audio instance
export function getAudioInstance(id: string, src: string): AudioInstance {
  if (!audioInstances.has(id)) {
    const howl = new Howl({
      src: [src],
      html5: true, // Enable streaming
      preload: true
    });
    
    audioInstances.set(id, {
      howl,
      playing: false
    });
  }
  
  return audioInstances.get(id)!;
}

// Play or pause audio
export function togglePlay(id: string): boolean {
  const instance = audioInstances.get(id);
  if (!instance || !instance.howl) return false;
  
  if (instance.playing) {
    instance.howl.pause();
    instance.playing = false;
  } else {
    // Pause all other instances
    pauseAllExcept(id);
    
    instance.howl.play();
    instance.playing = true;
  }
  
  return instance.playing;
}

// Pause all audio instances except the one specified
export function pauseAllExcept(excludeId?: string): void {
  audioInstances.forEach((instance, id) => {
    if (id !== excludeId && instance.playing && instance.howl) {
      instance.howl.pause();
      instance.playing = false;
    }
  });
}

// Stop and remove an audio instance
export function removeAudioInstance(id: string): void {
  const instance = audioInstances.get(id);
  if (instance && instance.howl) {
    instance.howl.stop();
    instance.howl.unload();
  }
  
  audioInstances.delete(id);
}

// Format seconds to MM:SS
export function formatTime(secs: number): string {
  if (isNaN(secs) || !isFinite(secs)) return '0:00';
  
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Format file size to human-readable format
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
