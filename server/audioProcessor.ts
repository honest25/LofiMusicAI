import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Effects } from '@shared/schema';

const execAsync = promisify(exec);

export interface ProcessOptions {
  trackId: number;
  inputPath: string;
  effects: Effects;
}

/**
 * Process an audio file with lo-fi effects using FFmpeg
 */
export async function processAudio(options: ProcessOptions): Promise<string> {
  const { inputPath, effects, trackId } = options;
  
  // Create output filename with unique ID
  const inputExt = path.extname(inputPath);
  const outputFilename = `lofi_${nanoid(10)}${inputExt}`;
  const outputPath = path.join(path.dirname(inputPath), outputFilename);
  
  try {
    // Normalize effect values from 0-100 range to appropriate ranges for processing
    const normalizedEffects = {
      vinylCrackle: effects.vinylCrackle / 100,         // 0-1 range
      reverb: effects.reverb / 100,                    // 0-1 range
      beatSlowdown: 1 - (effects.beatSlowdown / 300),  // Convert to speed ratio (0.92-1.0)
      bassBoost: (effects.bassBoost / 100) * 12,       // Convert to dB gain (0-12dB)
      bitCrushing: Math.max(8, Math.round((1 - effects.bitCrushing / 100) * 16)), // Bit depth (8-16)
      backgroundNoise: effects.backgroundNoise / 100    // 0-1 range
    };
    
    console.log(`Processing track ${trackId} with effects:`, JSON.stringify(normalizedEffects));
    
    // First, check if input file exists and is readable
    try {
      await fs.access(inputPath, fs.constants.R_OK);
      console.log(`Input file exists and is readable: ${inputPath}`);
    } catch (err) {
      console.error(`Input file not accessible: ${inputPath}`);
      throw new Error(`Input file not accessible: ${inputPath}`);
    }
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fsSync.existsSync(outputDir)) {
      await fs.mkdir(outputDir, { recursive: true });
    }
    
    // Prepare temporary files for effects processing
    const tempDir = path.join(outputDir, 'temp');
    if (!fsSync.existsSync(tempDir)) {
      await fs.mkdir(tempDir, { recursive: true });
    }
    
    // Generate crackle noise file if vinyl crackle effect is desired
    const crackleFile = path.join(tempDir, 'crackle.wav');
    if (normalizedEffects.vinylCrackle > 0.05) {
      const crackleIntensity = normalizedEffects.vinylCrackle * 0.2; // Scale down for mixing
      const crackleCmd = `ffmpeg -y -f lavfi -i "anoisesrc=amplitude=${crackleIntensity}:color=pink" -t 3 "${crackleFile}"`;
      console.log(`Generating vinyl crackle: ${crackleCmd}`);
      await execAsync(crackleCmd);
    }
    
    // Generate room noise if background noise effect is desired
    const noiseFile = path.join(tempDir, 'noise.wav');
    if (normalizedEffects.backgroundNoise > 0.05) {
      const noiseIntensity = normalizedEffects.backgroundNoise * 0.15; // Scale down for mixing
      const noiseCmd = `ffmpeg -y -f lavfi -i "anoisesrc=amplitude=${noiseIntensity}:color=brown" -t 3 "${noiseFile}"`;
      console.log(`Generating background noise: ${noiseCmd}`);
      await execAsync(noiseCmd);
    }
    
    // Build the FFmpeg command with all effects
    let ffmpegCmd = `ffmpeg -y -i "${inputPath}"`;
    
    // Add tempo change (beatSlowdown)
    let filterComplex = `[0:a]atempo=${normalizedEffects.beatSlowdown}[slowed]`;
    let lastOutput = 'slowed';
    
    // Add bass boost using equalizer
    if (normalizedEffects.bassBoost > 0.5) {
      const bassGain = normalizedEffects.bassBoost;
      filterComplex += `;[${lastOutput}]equalizer=f=100:width_type=h:width=200:g=${bassGain}[boosted]`;
      lastOutput = 'boosted';
    }
    
    // Add bit crushing (lo-fi effect)
    if (normalizedEffects.bitCrushing < 16) {
      const bitDepth = normalizedEffects.bitCrushing;
      filterComplex += `;[${lastOutput}]aresample=48000,acrusher=bits=${bitDepth}:mode=lin[crushed]`;
      lastOutput = 'crushed';
    }
    
    // Add reverb effect
    if (normalizedEffects.reverb > 0.1) {
      const reverbAmount = normalizedEffects.reverb * 100;
      filterComplex += `;[${lastOutput}]areverb=wet_level=${reverbAmount}:room_scale=50:stereo_depth=100[reverbed]`;
      lastOutput = 'reverbed';
    }
    
    // Mix with vinyl crackle if needed
    if (normalizedEffects.vinylCrackle > 0.05) {
      // Add the crackle file as input
      ffmpegCmd += ` -i "${crackleFile}"`;
      // Extend the crackle to match the length of the original audio with loop
      filterComplex += `;[1:a]aloop=loop=-1:size=44100[crackle]`;
      // Mix the crackle with the processed audio
      const crackleMix = normalizedEffects.vinylCrackle;
      filterComplex += `;[${lastOutput}][crackle]amix=inputs=2:duration=first:weights=${1-crackleMix} ${crackleMix}[crackled]`;
      lastOutput = 'crackled';
    }
    
    // Mix with background noise if needed
    if (normalizedEffects.backgroundNoise > 0.05) {
      // Add the noise file as input
      ffmpegCmd += ` -i "${noiseFile}"`;
      // Extend the noise to match the length of the original audio with loop
      filterComplex += `;[2:a]aloop=loop=-1:size=44100[noise]`;
      // Mix the noise with the processed audio
      const noiseMix = normalizedEffects.backgroundNoise;
      filterComplex += `;[${lastOutput}][noise]amix=inputs=2:duration=first:weights=${1-noiseMix} ${noiseMix}[noised]`;
      lastOutput = 'noised';
    }
    
    // Complete the filter complex
    ffmpegCmd += ` -filter_complex "${filterComplex}" -map [${lastOutput}] "${outputPath}"`;
    
    console.log(`Running FFmpeg command: ${ffmpegCmd}`);
    
    // Execute the FFmpeg command
    const { stdout, stderr } = await execAsync(ffmpegCmd);
    console.log('FFmpeg stdout:', stdout);
    console.log('FFmpeg stderr:', stderr);
    
    // Clean up temporary files
    if (fsSync.existsSync(crackleFile)) {
      await fs.unlink(crackleFile);
    }
    if (fsSync.existsSync(noiseFile)) {
      await fs.unlink(noiseFile);
    }
    
    // Ensure the output file was created successfully
    try {
      await fs.access(outputPath, fs.constants.R_OK);
      const outStats = await fs.stat(outputPath);
      console.log(`Output file size: ${outStats.size} bytes`);
      if (outStats.size === 0) {
        throw new Error('Output file has zero size');
      }
    } catch (err) {
      console.error(`Error verifying output file: ${err}`);
      throw new Error(`Failed to verify output file: ${outputPath}`);
    }
    
    console.log(`Lo-Fi processing complete for track ${trackId}`);
    return outputPath;
  } catch (error) {
    console.error(`Error processing audio for track ${trackId}:`, error);
    throw new Error(`Failed to process audio file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Get audio file metadata (duration, etc.) using FFmpeg
 */
export async function getAudioMetadata(filePath: string): Promise<{ duration: number }> {
  try {
    // First, check if file exists and is readable
    try {
      await fs.access(filePath, fs.constants.R_OK);
      console.log(`Audio file exists and is readable: ${filePath}`);
    } catch (err) {
      console.error(`Audio file not accessible: ${filePath}`);
      throw new Error(`Audio file not accessible: ${filePath}`);
    }
    
    // Get file stats
    const stats = await fs.stat(filePath);
    const fileSize = stats.size;
    
    if (fileSize === 0) {
      throw new Error('Audio file has zero size');
    }
    
    console.log(`Processing audio metadata for file: ${filePath} (${fileSize} bytes)`);
    
    // Use FFmpeg to get accurate duration
    const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`;
    try {
      const { stdout } = await execAsync(cmd);
      const duration = parseFloat(stdout.trim());
      
      if (isNaN(duration) || duration <= 0) {
        throw new Error('Invalid duration value from FFmpeg');
      }
      
      console.log(`FFmpeg duration for ${path.basename(filePath)}: ${duration} seconds`);
      
      return {
        duration: Math.round(duration)
      };
    } catch (ffmpegError) {
      console.error('Error getting duration with FFmpeg:', ffmpegError);
      
      // Fallback to estimation if FFmpeg fails
      const ext = path.extname(filePath).toLowerCase();
      let bitrate = 128000; // Default to 128kbps for MP3
      
      if (ext === '.wav') {
        // WAV files are usually uncompressed, larger files
        bitrate = 1411000; // CD quality WAV
      } else if (ext === '.ogg') {
        bitrate = 160000; // Typical OGG Vorbis bitrate
      } else if (ext === '.flac') {
        bitrate = 900000; // Typical FLAC bitrate
      }
      
      // Calculate duration: file size in bits / bitrate = seconds
      // Rough estimate: fileSize (bytes) * 8 (bits per byte) / bitrate (bits per second)
      const estimatedDuration = Math.max(1, Math.round((fileSize * 8) / bitrate));
      
      console.log(`Estimated duration for ${path.basename(filePath)}: ${estimatedDuration} seconds (fallback method)`);
      
      return {
        duration: estimatedDuration
      };
    }
  } catch (error) {
    console.error('Error getting audio metadata:', error);
    return { duration: 0 };
  }
}
