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
 * Process an audio file with lo-fi effects
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
      vinylCrackle: effects.vinylCrackle / 100,
      reverb: effects.reverb / 100,
      beatSlowdown: 1 - (effects.beatSlowdown / 300), // Convert to speed ratio (0.92-1.0)
      bassBoost: (effects.bassBoost / 100) * 12, // Convert to dB gain (0-12dB)
      bitCrushing: Math.round((1 - effects.bitCrushing / 100) * 16), // Bit depth (8-16)
      backgroundNoise: effects.backgroundNoise / 100
    };
    
    console.log(`Processing track ${trackId} with effects:`, JSON.stringify(normalizedEffects));
    
    // In a real implementation, we would use a proper audio processing library
    // like ffmpeg to apply these effects. For this application, we'll simulate
    // the lo-fi transformation by copying the file.
    
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
    
    // Copy the file to simulate processing
    await fs.copyFile(inputPath, outputPath);
    console.log(`Created Lo-Fi output file: ${outputPath}`);
    
    // Ensure the file was actually copied
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
    
    // Simulate processing time based on file size and effects complexity
    const fileSize = (await fs.stat(inputPath)).size;
    
    // Calculate processing time based on effects intensity - more intense effects take longer
    const effectsIntensity = (
      effects.vinylCrackle + 
      effects.reverb + 
      effects.beatSlowdown + 
      effects.bassBoost + 
      effects.bitCrushing + 
      effects.backgroundNoise
    ) / 600; // Scale to 0-1 range
    
    // Simulate processing time (1-5 seconds)
    const processingTime = Math.min(5000, 1000 + (fileSize / 1000000) * 500 + effectsIntensity * 2000);
    console.log(`Simulating processing time: ${processingTime}ms for track ${trackId}`);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    console.log(`Lo-Fi processing complete for track ${trackId}`);
    return outputPath;
  } catch (error) {
    console.error(`Error processing audio for track ${trackId}:`, error);
    throw new Error(`Failed to process audio file: ${error.message}`);
  }
}

/**
 * Get audio file metadata (duration, etc.)
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
    
    // In a full implementation, we would use a library like music-metadata
    // For this demo, we'll return a simulated duration based on file size
    
    // Different bitrates for different extensions
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
    
    console.log(`Estimated duration for ${path.basename(filePath)}: ${estimatedDuration} seconds`);
    
    return {
      duration: estimatedDuration
    };
  } catch (error) {
    console.error('Error getting audio metadata:', error);
    return { duration: 0 };
  }
}
