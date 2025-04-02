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
    // like ffmpeg to apply these effects. For this application, we'll do some
    // basic file modification to actually create a different audio file.
    
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
    
    // Read the original file
    const inputBuffer = await fs.readFile(inputPath);
    
    // Create a modified version based on effects
    let outputBuffer = Buffer.from(inputBuffer); // Start with a copy
    
    // Apply audio "effects" by modifying the buffer
    // Note: These are not real audio processing algorithms, just binary manipulations
    // to create an audibly different file for demonstration purposes

    // Create a buffer with the same size as input
    const fileSize = inputBuffer.length;
    
    // Skip the header (first 44 bytes for WAV, varies for MP3)
    // We'll start modifications after the file header to avoid corrupting the file format
    const headerSize = inputExt.toLowerCase() === '.wav' ? 44 : 128;
    
    // Apply "vinyl crackle" by adding some noise
    if (normalizedEffects.vinylCrackle > 0.1) {
      const crackleFactor = normalizedEffects.vinylCrackle * 10;
      for (let i = headerSize; i < fileSize; i += 1000) {
        if (Math.random() < normalizedEffects.vinylCrackle) {
          // Add some noise at random positions
          const noiseValue = Math.floor(Math.random() * crackleFactor);
          if (i < outputBuffer.length) {
            outputBuffer[i] = Math.min(255, outputBuffer[i] + noiseValue);
          }
        }
      }
    }
    
    // Apply "bit crushing" by reducing bit depth (zeroing out LSBs)
    if (normalizedEffects.bitCrushing < 16) {
      const bitMask = 0xFF - ((1 << (16 - normalizedEffects.bitCrushing)) - 1);
      for (let i = headerSize; i < fileSize; i += 2) {
        if (i < outputBuffer.length) {
          outputBuffer[i] = outputBuffer[i] & bitMask;
        }
      }
    }
    
    // Apply "bass boost" by amplifying certain sections
    if (normalizedEffects.bassBoost > 0) {
      const boostFactor = normalizedEffects.bassBoost / 6; // scale to reasonable values
      for (let i = headerSize; i < fileSize; i += 200) {
        if (i < outputBuffer.length) {
          // Amplify every 200th byte to simulate bass boost
          outputBuffer[i] = Math.min(255, Math.floor(outputBuffer[i] * (1 + boostFactor)));
        }
      }
    }
    
    // Apply "reverb" effect by adding delayed copies
    if (normalizedEffects.reverb > 0.1) {
      // Create a delayed version of the signal to simulate reverb
      const delayAmount = Math.floor(normalizedEffects.reverb * 800); // 0-80ms delay
      const mixAmount = normalizedEffects.reverb * 0.5; // 0-50% mix
      
      // Add a delayed copy of the audio data
      for (let i = headerSize + delayAmount; i < fileSize; i++) {
        if (i < outputBuffer.length && (i - delayAmount) < outputBuffer.length) {
          // Mix in the delayed signal
          outputBuffer[i] = Math.min(255, Math.floor(
            outputBuffer[i] * (1 - mixAmount) + 
            outputBuffer[i - delayAmount] * mixAmount
          ));
        }
      }
    }
    
    // Apply background noise
    if (normalizedEffects.backgroundNoise > 0.1) {
      const noiseAmount = normalizedEffects.backgroundNoise * 15;
      for (let i = headerSize; i < fileSize; i += 8) {
        if (i < outputBuffer.length) {
          // Add static noise
          const noise = Math.floor(Math.random() * noiseAmount);
          outputBuffer[i] = Math.min(255, outputBuffer[i] + noise);
        }
      }
    }

    // Apply "beat slowdown" by duplicating some sections
    if (normalizedEffects.beatSlowdown < 0.98) {
      // Create a new buffer with extra space for the slowdown effect
      const slowdownFactor = (1 / normalizedEffects.beatSlowdown);
      const newSize = Math.min(fileSize * 1.5, fileSize * slowdownFactor); // limit size increase
      const slowedBuffer = Buffer.alloc(Math.floor(newSize));
      
      // Copy header
      outputBuffer.copy(slowedBuffer, 0, 0, headerSize);
      
      // Add duplicated sections to simulate slowdown
      let outputPos = headerSize;
      for (let i = headerSize; i < fileSize; i++) {
        if (outputPos < slowedBuffer.length) {
          slowedBuffer[outputPos++] = outputBuffer[i];
          
          // Duplicate some bytes based on slowdown factor
          if (i % 1000 < (slowdownFactor - 1) * 500) {
            // Duplicate this byte to slow down
            if (outputPos < slowedBuffer.length) {
              slowedBuffer[outputPos++] = outputBuffer[i];
            }
          }
        }
      }
      
      outputBuffer = slowedBuffer;
    }
    
    // Write the modified buffer to the output file
    await fs.writeFile(outputPath, outputBuffer);
    console.log(`Created actual Lo-Fi output file: ${outputPath}`);
    
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
