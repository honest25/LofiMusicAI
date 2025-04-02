import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { nanoid } from 'nanoid';
import { insertTrackSchema, effectsSchema, updateEffectsSchema } from "@shared/schema";
import { processAudio, getAudioMetadata } from "./audioProcessor";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Configure multer for file uploads
const uploadDir = path.resolve(process.cwd(), "uploads");
const storage_config = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = nanoid(10);
    cb(null, `${uniqueSuffix}_${file.originalname}`);
  }
});

// Create upload directory if it doesn't exist
try {
  fs.mkdir(uploadDir, { recursive: true });
} catch (error) {
  console.error("Failed to create upload directory:", error);
}

const upload = multer({
  storage: storage_config,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: function (req, file, cb) {
    // Check file types
    const allowedTypes = ['.mp3', '.wav'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only MP3 and WAV files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all tracks
  app.get('/api/tracks', async (req: Request, res: Response) => {
    try {
      const tracks = await storage.getAllTracks();
      res.json(tracks);
    } catch (error) {
      console.error('Error getting tracks:', error);
      res.status(500).json({ message: 'Failed to get tracks' });
    }
  });

  // Get a specific track
  app.get('/api/tracks/:id', async (req: Request, res: Response) => {
    try {
      const trackId = parseInt(req.params.id);
      if (isNaN(trackId)) {
        return res.status(400).json({ message: 'Invalid track ID' });
      }

      const track = await storage.getTrack(trackId);
      if (!track) {
        return res.status(404).json({ message: 'Track not found' });
      }

      res.json(track);
    } catch (error) {
      console.error('Error getting track:', error);
      res.status(500).json({ message: 'Failed to get track' });
    }
  });

  // Upload a new track
  app.post('/api/tracks/upload', upload.single('audioFile'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const file = req.file;
      const filePath = path.resolve(uploadDir, file.filename);
      
      // Get audio metadata
      const metadata = await getAudioMetadata(filePath);
      
      // Create track record
      const trackData = {
        originalFilename: file.originalname,
        originalPath: filePath,
        fileSize: file.size,
        duration: metadata.duration,
        effects: {
          vinylCrackle: 65,
          reverb: 40,
          beatSlowdown: 25,
          bassBoost: 50,
          bitCrushing: 20,
          backgroundNoise: 35
        }
      };
      
      // Validate track data
      const validatedData = insertTrackSchema.parse(trackData);
      
      // Create track in storage
      const track = await storage.createTrack(validatedData);
      
      // Start processing the track
      processTrack(track.id).catch(error => {
        console.error(`Error processing track ${track.id}:`, error);
        storage.updateTrackStatus(track.id, 'error');
      });
      
      res.status(201).json(track);
    } catch (error) {
      console.error('Error uploading track:', error);
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      res.status(500).json({ message: 'Failed to upload track' });
    }
  });

  // Update track effects and regenerate
  app.post('/api/tracks/effects', async (req: Request, res: Response) => {
    try {
      const { trackId, effects } = updateEffectsSchema.parse(req.body);
      
      const track = await storage.getTrack(trackId);
      if (!track) {
        return res.status(404).json({ message: 'Track not found' });
      }
      
      // Update track effects
      const updatedTrack = await storage.updateTrackEffects(trackId, effects);
      
      // Start processing with new effects
      processTrack(trackId).catch(error => {
        console.error(`Error processing track ${trackId}:`, error);
        storage.updateTrackStatus(trackId, 'error');
      });
      
      res.json(updatedTrack);
    } catch (error) {
      console.error('Error updating effects:', error);
      
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      res.status(500).json({ message: 'Failed to update effects' });
    }
  });

  // Delete a track
  app.delete('/api/tracks/:id', async (req: Request, res: Response) => {
    try {
      const trackId = parseInt(req.params.id);
      if (isNaN(trackId)) {
        return res.status(400).json({ message: 'Invalid track ID' });
      }

      const result = await storage.deleteTrack(trackId);
      if (!result) {
        return res.status(404).json({ message: 'Track not found' });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting track:', error);
      res.status(500).json({ message: 'Failed to delete track' });
    }
  });

  // Serve audio files
  app.get('/api/audio/:filename', async (req: Request, res: Response) => {
    try {
      const filename = req.params.filename;
      const filePath = path.resolve(uploadDir, filename);
      
      try {
        await fs.access(filePath);
      } catch (error) {
        return res.status(404).json({ message: 'Audio file not found' });
      }
      
      // Get file stats for Content-Length header
      const stats = await fs.stat(filePath);
      
      // Set headers for audio streaming
      res.setHeader('Content-Type', path.extname(filename) === '.mp3' ? 'audio/mpeg' : 'audio/wav');
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Content-Disposition', `inline; filename=${filename}`);
      
      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error streaming audio:', error);
      res.status(500).json({ message: 'Failed to stream audio file' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to process a track in the background
async function processTrack(trackId: number): Promise<void> {
  try {
    // Get the track
    const track = await storage.getTrack(trackId);
    if (!track) {
      throw new Error(`Track ${trackId} not found`);
    }

    // Update status to processing
    await storage.updateTrackStatus(trackId, 'processing');

    // Process the audio
    const outputPath = await processAudio({
      trackId,
      inputPath: track.originalPath,
      effects: track.effects as any
    });

    // Update the track with the lofi path
    await storage.updateTrackLofiPath(trackId, outputPath);
  } catch (error) {
    console.error(`Error processing track ${trackId}:`, error);
    await storage.updateTrackStatus(trackId, 'error');
    throw error;
  }
}
