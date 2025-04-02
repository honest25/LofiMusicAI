import { tracks, type Track, type InsertTrack, type Effects } from "@shared/schema";
import { nanoid } from "nanoid";
import path from "path";
import fs from "fs/promises";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<any | undefined>;
  getUserByUsername(username: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;
  
  // Track related methods
  getAllTracks(): Promise<Track[]>;
  getTrack(id: number): Promise<Track | undefined>;
  createTrack(track: InsertTrack): Promise<Track>;
  updateTrackStatus(id: number, status: string): Promise<Track | undefined>;
  updateTrackLofiPath(id: number, lofiPath: string): Promise<Track | undefined>;
  updateTrackEffects(id: number, effects: Effects): Promise<Track | undefined>;
  deleteTrack(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, any>;
  private tracks: Map<number, Track>;
  currentUserId: number;
  currentTrackId: number;
  uploadDir: string;

  constructor() {
    this.users = new Map();
    this.tracks = new Map();
    this.currentUserId = 1;
    this.currentTrackId = 1;
    this.uploadDir = path.resolve(process.cwd(), "uploads");
    
    // Create upload directory if it doesn't exist
    this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error("Failed to create upload directory:", error);
    }
  }

  async getUser(id: number): Promise<any | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<any | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: any): Promise<any> {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllTracks(): Promise<Track[]> {
    return Array.from(this.tracks.values()).sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  async getTrack(id: number): Promise<Track | undefined> {
    return this.tracks.get(id);
  }

  async createTrack(insertTrack: InsertTrack): Promise<Track> {
    const id = this.currentTrackId++;
    const createdAt = new Date();
    const track: Track = { 
      ...insertTrack, 
      id, 
      status: "uploading", 
      lofiPath: null, 
      createdAt
    };
    this.tracks.set(id, track);
    return track;
  }

  async updateTrackStatus(id: number, status: string): Promise<Track | undefined> {
    const track = this.tracks.get(id);
    if (!track) return undefined;
    
    const updatedTrack = { ...track, status };
    this.tracks.set(id, updatedTrack);
    return updatedTrack;
  }

  async updateTrackLofiPath(id: number, lofiPath: string): Promise<Track | undefined> {
    const track = this.tracks.get(id);
    if (!track) return undefined;
    
    const updatedTrack = { ...track, lofiPath, status: "completed" };
    this.tracks.set(id, updatedTrack);
    return updatedTrack;
  }

  async updateTrackEffects(id: number, effects: Effects): Promise<Track | undefined> {
    const track = this.tracks.get(id);
    if (!track) return undefined;
    
    const updatedTrack = { ...track, effects, status: "processing" };
    this.tracks.set(id, updatedTrack);
    return updatedTrack;
  }

  async deleteTrack(id: number): Promise<boolean> {
    const track = this.tracks.get(id);
    if (!track) return false;
    
    // Delete the files
    try {
      if (track.originalPath) {
        await fs.unlink(track.originalPath).catch(() => {});
      }
      if (track.lofiPath) {
        await fs.unlink(track.lofiPath).catch(() => {});
      }
    } catch (error) {
      console.error(`Error deleting files for track ${id}:`, error);
    }
    
    return this.tracks.delete(id);
  }
}

export const storage = new MemStorage();
