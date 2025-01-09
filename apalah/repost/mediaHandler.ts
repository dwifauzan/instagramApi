import { app } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import axios from 'axios';
import ffmpeg from 'fluent-ffmpeg';

interface MediaResult {
  success: boolean;
  mediaPaths?: string[];
  captionPath?: string;
  error?: string;
}

export class MediaHandler {
  private readonly mediaDir: string;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.mediaDir = path.join(userDataPath, 'media');
  }

  async checkFFmpeg(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      ffmpeg.getAvailableCodecs((err, codecs) => {
        if (err) {
          console.error('FFmpeg tidak tersedia:', err);
          reject(new Error('FFmpeg tidak terinstall atau tidak dapat diakses'));
        } else {
          console.log('FFmpeg tersedia dan siap digunakan');
          resolve(true);
        }
      });
    });
  }

  private async processVideo(
    originalPath: string, 
    outputPath: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      ffmpeg(originalPath)
        .size('1080x1350')  // 4:5 aspect ratio
        .autopad(true, 'black')
        .videoCodec('libx264')  // Ensure we're using H.264 codec
        .outputOptions([
          '-pix_fmt yuv420p',   // Ensure compatibility
          '-preset medium',      // Balance between speed and quality
          '-crf 23'             // Quality setting (lower = better quality)
        ])
        .output(outputPath)
        .on('start', () => {
          console.log('Started processing video...');
        })
        .on('progress', (progress) => {
          console.log(`Processing: ${progress.percent}% done`);
        })
        .on('end', async () => {
          try {
            // Verify the output file exists and has size
            const stats = await fs.stat(outputPath);
            if (stats.size === 0) {
              await fs.unlink(outputPath);
              reject(new Error('Processed video file is empty'));
              return;
            }
            
            // Delete original file only after successful processing
            await fs.unlink(originalPath);
            console.log('Video processing completed successfully');
            resolve(outputPath);
          } catch (err) {
            reject(err);
          }
        })
        .on('error', async (err) => {
          console.error('Error processing video:', err);
          // Cleanup on error
          try {
            if (await fs.pathExists(outputPath)) {
              await fs.unlink(outputPath);
            }
          } catch (cleanupErr) {
            console.error('Error during cleanup:', cleanupErr);
          }
          reject(err);
        })
        .run();
    });
  }

  async saveMedia(urls: string[], caption: string, nameArsip: string, feedId: string): Promise<MediaResult> {
    try {
      // Buat folder berdasarkan nameArsip dan feedId
      const folderPath = path.join(this.mediaDir, nameArsip, feedId.toString());
      await fs.ensureDir(folderPath);

      const mediaPaths = await Promise.all(
        urls.map(async (mediaUrl, index) => {
          try {
            console.log(`Downloading media ${index + 1}/${urls.length}...`);
            const response = await axios.get(mediaUrl, { 
              responseType: 'arraybuffer',
              timeout: 30000,
              onDownloadProgress: (progressEvent) => {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / (progressEvent.total ?? 100)
                );
                console.log(`Download Progress: ${percentCompleted}%`);
              }
            });

            if (mediaUrl.includes('.mp4')) {
              console.log(`Processing video ${index + 1}...`);
              const originalMediaFilePath = path.join(folderPath, `media-${index}-original.mp4`);
              const resizedMediaFilePath = path.join(folderPath, `media-${index}.mp4`);

              // Write the downloaded file
              await fs.writeFile(originalMediaFilePath, response.data);
              
              // Process the video and wait for completion
              const processedPath = await this.processVideo(originalMediaFilePath, resizedMediaFilePath);
              console.log(`Video ${index + 1} processed successfully`);
              return processedPath;
            } else {
              const mediaExtension = mediaUrl.match(/\.(jpg|jpeg|png)/) ? 'jpg' : 'jpg';
              const mediaFilePath = path.join(folderPath, `media-${index}.${mediaExtension}`);
              await fs.writeFile(mediaFilePath, response.data);
              console.log(`Image ${index + 1} saved successfully`);
              return mediaFilePath;
            }
          } catch (err) {
            console.error(`Failed to process media ${index + 1}: ${mediaUrl}`, err);
            return null;
          }
        })
      );

      const validMediaPaths = mediaPaths.filter((path): path is string => path !== null);

      return { 
        success: true, 
        mediaPaths: validMediaPaths, 
      };
    } catch (err) {
      console.error('Error saving media and caption:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  }
}
