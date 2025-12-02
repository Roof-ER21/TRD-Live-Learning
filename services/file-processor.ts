/**
 * File Processor Service
 * Unified processing pipeline for all supported file types
 */

import {
  ParsedFile,
  SupportedFileType,
  ExtractedContent,
  FileMetadata,
  PageContent,
  DataRow,
  VideoFrame
} from '../types';

// Declare PDF.js global (loaded via CDN)
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

export class FileProcessor {
  /**
   * Main entry point - process any supported file
   */
  async process(file: File): Promise<ParsedFile> {
    const type = this.detectFileType(file);
    const extractedContent = await this.extractContent(file, type);
    const metadata = this.extractMetadata(file, type, extractedContent);

    return {
      originalFile: file,
      type,
      mimeType: file.type,
      extractedContent,
      metadata
    };
  }

  /**
   * Detect file type from MIME type and extension
   */
  private detectFileType(file: File): SupportedFileType {
    const mime = file.type.toLowerCase();
    const name = file.name.toLowerCase();

    // Check MIME types first
    if (mime.startsWith('image/')) return 'image';
    if (mime === 'application/pdf') return 'pdf';
    if (mime === 'text/csv') return 'csv';
    if (mime.includes('spreadsheet') || mime.includes('excel')) return 'excel';
    if (mime.startsWith('video/')) return 'video';
    if (mime === 'text/markdown') return 'markdown';
    if (mime.startsWith('text/')) return 'text';

    // Fallback to extension
    if (name.endsWith('.csv')) return 'csv';
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) return 'excel';
    if (name.endsWith('.md') || name.endsWith('.markdown')) return 'markdown';
    if (name.endsWith('.txt')) return 'text';
    if (name.endsWith('.pdf')) return 'pdf';
    if (/\.(mp4|mov|webm|avi|mkv)$/.test(name)) return 'video';
    if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(name)) return 'image';

    throw new Error(`Unsupported file type: ${mime || name}`);
  }

  /**
   * Route to appropriate processor based on type
   */
  private async extractContent(file: File, type: SupportedFileType): Promise<ExtractedContent> {
    switch (type) {
      case 'image':
        return this.processImage(file);
      case 'pdf':
        return this.processPdf(file);
      case 'csv':
        return this.processCsv(file);
      case 'excel':
        return this.processExcel(file);
      case 'text':
      case 'markdown':
        return this.processText(file);
      case 'video':
        return this.processVideo(file);
      default:
        throw new Error(`Processor not implemented for: ${type}`);
    }
  }

  /**
   * Build metadata object
   */
  private extractMetadata(
    file: File,
    type: SupportedFileType,
    content: ExtractedContent
  ): FileMetadata {
    return {
      fileName: file.name,
      fileSize: file.size,
      pageCount: content.pages?.length,
      rowCount: content.data?.length,
      columnCount: content.data?.[0] ? Object.keys(content.data[0]).length : undefined
    };
  }

  // ============================================
  // INDIVIDUAL FILE PROCESSORS
  // ============================================

  /**
   * Process image files - convert to base64
   */
  private async processImage(file: File): Promise<ExtractedContent> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1];
          resolve({ rawBase64: base64 });
        } else {
          reject(new Error('Failed to convert image to base64'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
    });
  }

  /**
   * Process PDF files - extract all pages with text and images
   */
  private async processPdf(file: File): Promise<ExtractedContent> {
    if (!window.pdfjsLib) {
      throw new Error('PDF.js library not loaded');
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const pages: PageContent[] = [];
    const maxPages = Math.min(pdf.numPages, 20); // Limit to 20 pages

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);

      // Extract text
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Render page to image
      const scale = 1.5;
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d')!;

      await page.render({ canvasContext: context, viewport }).promise;
      const imageBase64 = canvas.toDataURL('image/png').split(',')[1];

      pages.push({
        pageNumber: i,
        text,
        imageBase64
      });
    }

    // Combine all text for easy access
    const fullText = pages
      .map(p => `[Page ${p.pageNumber}]\n${p.text}`)
      .join('\n\n');

    return {
      pages,
      text: fullText
    };
  }

  /**
   * Process CSV files - parse into structured data
   */
  private async processCsv(file: File): Promise<ExtractedContent> {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
      return { text: '', data: [] };
    }

    const headers = this.parseCsvLine(lines[0]);
    const data: DataRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      const row: DataRow = {};
      headers.forEach((header, idx) => {
        const value = values[idx] || '';
        // Try to parse as number
        const numValue = parseFloat(value);
        row[header] = isNaN(numValue) ? value : numValue;
      });
      data.push(row);
    }

    return {
      data,
      text: this.formatDataAsText(headers, data)
    };
  }

  /**
   * Parse a single CSV line handling quoted fields
   */
  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  /**
   * Format data as readable text for AI
   */
  private formatDataAsText(headers: string[], data: DataRow[]): string {
    let text = `Data with ${data.length} rows and ${headers.length} columns:\n`;
    text += `Columns: ${headers.join(', ')}\n\n`;

    // Include first 20 rows as sample
    const sample = data.slice(0, 20);
    sample.forEach((row, i) => {
      text += `Row ${i + 1}: ${headers.map(h => `${h}="${row[h]}"`).join(', ')}\n`;
    });

    if (data.length > 20) {
      text += `\n... and ${data.length - 20} more rows`;
    }

    return text;
  }

  /**
   * Process Excel files - uses xlsx library
   */
  private async processExcel(file: File): Promise<ExtractedContent> {
    // Dynamic import of xlsx library
    const XLSX = await import('xlsx');

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // Process first sheet only
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(sheet) as DataRow[];

    // Get headers
    const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];

    return {
      data: jsonData,
      text: this.formatDataAsText(headers, jsonData)
    };
  }

  /**
   * Process text/markdown files
   */
  private async processText(file: File): Promise<ExtractedContent> {
    const text = await file.text();
    return { text };
  }

  /**
   * Process video files - extract key frames
   */
  private async processVideo(file: File): Promise<ExtractedContent> {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = url;
    video.muted = true;
    video.preload = 'metadata';

    // Wait for metadata to load
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('Failed to load video'));
      setTimeout(() => reject(new Error('Video load timeout')), 30000);
    });

    const duration = video.duration;
    // Extract 3-10 frames based on duration (roughly 1 per 15 seconds)
    const frameCount = Math.min(10, Math.max(3, Math.ceil(duration / 15)));
    const frames: VideoFrame[] = [];

    for (let i = 0; i < frameCount; i++) {
      const timestamp = (duration / (frameCount + 1)) * (i + 1);
      video.currentTime = timestamp;

      // Wait for seek to complete
      await new Promise<void>(resolve => {
        video.onseeked = () => resolve();
      });

      // Capture frame
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(video.videoWidth, 1280);
      canvas.height = Math.min(video.videoHeight, 720);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      frames.push({
        timestamp,
        imageBase64: canvas.toDataURL('image/jpeg', 0.7).split(',')[1]
      });
    }

    URL.revokeObjectURL(url);

    return {
      frames,
      text: `Video: "${file.name}"\nDuration: ${Math.round(duration)} seconds\nKey frames extracted: ${frames.length}`
    };
  }
}

// Export singleton instance
export const fileProcessor = new FileProcessor();
