import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Track, Effects } from "@/lib/types";

interface EffectControlsProps {
  track: Track;
  onEffectsUpdated: () => void;
}

export default function EffectControls({ track, onEffectsUpdated }: EffectControlsProps) {
  const [effects, setEffects] = useState<Effects>(track.effects as Effects || {
    vinylCrackle: 65,
    reverb: 40,
    beatSlowdown: 25,
    bassBoost: 50,
    bitCrushing: 20,
    backgroundNoise: 35
  });
  const [isApplying, setIsApplying] = useState(false);
  const { toast } = useToast();

  const handleEffectChange = (effect: keyof Effects, value: number[]) => {
    setEffects(prev => ({
      ...prev,
      [effect]: value[0]
    }));
  };

  const resetEffects = () => {
    setEffects({
      vinylCrackle: 65,
      reverb: 40,
      beatSlowdown: 25,
      bassBoost: 50,
      bitCrushing: 20,
      backgroundNoise: 35
    });
  };

  const applyEffects = async () => {
    setIsApplying(true);
    
    try {
      await apiRequest('POST', '/api/tracks/effects', {
        trackId: track.id,
        effects
      });
      
      toast({
        title: "Effects Applied",
        description: "Your Lo-Fi track is being regenerated with the new effects"
      });
      
      onEffectsUpdated();
    } catch (error) {
      toast({
        title: "Failed to Apply Effects",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
      <div className="text-sm font-medium mb-4 flex justify-between items-center">
        <span>Lo-Fi Effect Controls</span>
        <button 
          className="text-xs text-secondary hover:underline"
          onClick={resetEffects}
        >
          Reset to Default
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Vinyl Crackle</label>
          <div className="flex items-center">
            <Slider 
              value={[effects.vinylCrackle]} 
              min={0} 
              max={100} 
              step={1}
              onValueChange={(value) => handleEffectChange('vinylCrackle', value)}
              className="flex-1"
            />
            <span className="text-xs ml-2 w-7 text-right">{effects.vinylCrackle}%</span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-1">Reverb</label>
          <div className="flex items-center">
            <Slider 
              value={[effects.reverb]} 
              min={0} 
              max={100} 
              step={1}
              onValueChange={(value) => handleEffectChange('reverb', value)}
              className="flex-1"
            />
            <span className="text-xs ml-2 w-7 text-right">{effects.reverb}%</span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-1">Beat Slowdown</label>
          <div className="flex items-center">
            <Slider 
              value={[effects.beatSlowdown]} 
              min={0} 
              max={100} 
              step={1}
              onValueChange={(value) => handleEffectChange('beatSlowdown', value)}
              className="flex-1"
            />
            <span className="text-xs ml-2 w-7 text-right">{effects.beatSlowdown}%</span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-1">Bass Boost</label>
          <div className="flex items-center">
            <Slider 
              value={[effects.bassBoost]} 
              min={0} 
              max={100} 
              step={1}
              onValueChange={(value) => handleEffectChange('bassBoost', value)}
              className="flex-1"
            />
            <span className="text-xs ml-2 w-7 text-right">{effects.bassBoost}%</span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-1">Bit Crushing</label>
          <div className="flex items-center">
            <Slider 
              value={[effects.bitCrushing]} 
              min={0} 
              max={100} 
              step={1}
              onValueChange={(value) => handleEffectChange('bitCrushing', value)}
              className="flex-1"
            />
            <span className="text-xs ml-2 w-7 text-right">{effects.bitCrushing}%</span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-1">Background Noise</label>
          <div className="flex items-center">
            <Slider 
              value={[effects.backgroundNoise]} 
              min={0} 
              max={100} 
              step={1}
              onValueChange={(value) => handleEffectChange('backgroundNoise', value)}
              className="flex-1"
            />
            <span className="text-xs ml-2 w-7 text-right">{effects.backgroundNoise}%</span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex justify-end">
        <Button 
          className="bg-secondary hover:bg-secondary/90 text-white"
          disabled={isApplying}
          onClick={applyEffects}
        >
          <RefreshCw className="h-5 w-5 mr-1" />
          {isApplying ? 'Processing...' : 'Regenerate Lo-Fi'}
        </Button>
      </div>
    </div>
  );
}
