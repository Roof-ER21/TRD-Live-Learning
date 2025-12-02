/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * InputArea Component - File upload interface with drag & drop
 * Supports: Images, PDFs, CSV, Excel, Text, Markdown, Video
 */

import React, { useCallback, useState, useEffect } from 'react';
import {
  ArrowUpTrayIcon,
  CpuChipIcon,
  DocumentTextIcon,
  PhotoIcon,
  TableCellsIcon,
  FilmIcon
} from '@heroicons/react/24/outline';
import { playUISound } from '../utils/sound';

interface InputAreaProps {
  onGenerate: (prompt: string, file?: File) => void;
  isGenerating: boolean;
  disabled?: boolean;
}

// Cycling text for the upload prompt
const CyclingText = () => {
  const words = [
    "a pitch script",
    "a training PDF",
    "a roof photo",
    "a data CSV",
    "a demo video",
    "an objection doc",
    "a process timeline"
  ];
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex(prev => (prev + 1) % words.length);
        setFade(true);
      }, 500);
    }, 3000);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <span className={`
      inline-block whitespace-nowrap transition-all duration-500 transform
      ${fade ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 translate-y-2 blur-sm'}
      text-white font-medium pb-1 border-b-2 border-red-500/50
    `}>
      {words[index]}
    </span>
  );
};

// Supported file types configuration
const SUPPORTED_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp'],
  documents: ['application/pdf'],
  data: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  text: ['text/plain', 'text/markdown'],
  video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
};

// Check if file is supported by MIME type or extension
const isFileSupported = (file: File): boolean => {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  // Check MIME types
  if (mime.startsWith('image/')) return true;
  if (mime.startsWith('video/')) return true;
  if (mime === 'application/pdf') return true;
  if (mime === 'text/csv') return true;
  if (mime.includes('spreadsheet') || mime.includes('excel')) return true;
  if (mime.startsWith('text/')) return true;

  // Fallback to extension
  const supportedExtensions = [
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp',
    '.pdf',
    '.csv', '.xlsx', '.xls',
    '.txt', '.md', '.markdown',
    '.mp4', '.webm', '.mov', '.avi', '.mkv'
  ];
  return supportedExtensions.some(ext => name.endsWith(ext));
};

// Get file type icon based on file
const getFileTypeInfo = (file: File): { icon: React.ReactNode; label: string } => {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (mime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(name)) {
    return { icon: <PhotoIcon className="w-5 h-5" />, label: 'Image' };
  }
  if (mime.startsWith('video/') || /\.(mp4|webm|mov|avi|mkv)$/.test(name)) {
    return { icon: <FilmIcon className="w-5 h-5" />, label: 'Video' };
  }
  if (mime === 'text/csv' || name.endsWith('.csv') || mime.includes('spreadsheet') || /\.(xlsx|xls)$/.test(name)) {
    return { icon: <TableCellsIcon className="w-5 h-5" />, label: 'Data' };
  }
  return { icon: <DocumentTextIcon className="w-5 h-5" />, label: 'Document' };
};

export const InputArea: React.FC<InputAreaProps> = ({ onGenerate, isGenerating, disabled = false }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (isFileSupported(file)) {
      playUISound('upload');
      onGenerate("", file);
    } else {
      playUISound('error');
      const supportedList = 'Images, PDFs, CSV, Excel, Text, Markdown, Video';
      alert(`Unsupported file type.\n\nSupported formats:\n${supportedList}`);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isGenerating) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [disabled, isGenerating]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (!disabled && !isGenerating) {
      setIsDragging(true);
    }
  }, [disabled, isGenerating]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto perspective-1000">
      <div
        className={`relative group transition-all duration-300 ${isDragging ? 'scale-[1.01]' : ''}`}
      >
        <label
          className={`
            relative flex flex-col items-center justify-center
            h-56 sm:h-64 md:h-[22rem]
            bg-zinc-900/30
            backdrop-blur-sm
            rounded-xl border border-dashed
            cursor-pointer overflow-hidden
            transition-all duration-300
            ${isDragging
              ? 'border-red-500 bg-zinc-900/50 shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]'
              : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900/40'
            }
            ${isGenerating ? 'pointer-events-none' : ''}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {/* Technical Grid Background */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
              backgroundSize: '32px 32px'
            }}
          />

          {/* Corner Brackets */}
          <div className={`absolute top-4 left-4 w-4 h-4 border-l-2 border-t-2 transition-colors duration-300 ${isDragging ? 'border-red-500' : 'border-zinc-600'}`} />
          <div className={`absolute top-4 right-4 w-4 h-4 border-r-2 border-t-2 transition-colors duration-300 ${isDragging ? 'border-red-500' : 'border-zinc-600'}`} />
          <div className={`absolute bottom-4 left-4 w-4 h-4 border-l-2 border-b-2 transition-colors duration-300 ${isDragging ? 'border-red-500' : 'border-zinc-600'}`} />
          <div className={`absolute bottom-4 right-4 w-4 h-4 border-r-2 border-b-2 transition-colors duration-300 ${isDragging ? 'border-red-500' : 'border-zinc-600'}`} />

          <div className="relative z-10 flex flex-col items-center text-center space-y-6 md:space-y-8 p-6 md:p-8 w-full">
            {/* Upload Icon */}
            <div className={`
              relative w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center
              transition-transform duration-500
              ${isDragging ? 'scale-110' : 'group-hover:-translate-y-1'}
            `}>
              <div className={`
                absolute inset-0 rounded-2xl bg-zinc-800 border border-zinc-700 shadow-xl
                flex items-center justify-center
                ${isGenerating ? 'animate-pulse' : ''}
              `}>
                {isGenerating ? (
                  <CpuChipIcon className="w-8 h-8 md:w-10 md:h-10 text-red-400 animate-spin-slow" />
                ) : (
                  <ArrowUpTrayIcon className={`
                    w-8 h-8 md:w-10 md:h-10 text-zinc-300 transition-all duration-300
                    ${isDragging ? '-translate-y-1 text-red-400' : ''}
                  `} />
                )}
              </div>
            </div>

            {/* Main Text */}
            <div className="space-y-2 md:space-y-4 w-full max-w-3xl">
              <h3 className="flex flex-col items-center justify-center text-xl sm:text-2xl md:text-4xl text-zinc-100 leading-none font-bold tracking-tighter gap-3">
                <span>Turn</span>
                <div className="h-8 sm:h-10 md:h-14 flex items-center justify-center w-full">
                  <CyclingText />
                </div>
                <span>into a simulator</span>
              </h3>
              <p className="text-zinc-500 text-xs sm:text-base md:text-lg font-light tracking-wide">
                <span className="hidden md:inline">Drag & Drop</span>
                <span className="md:hidden">Tap</span> to upload
              </p>
            </div>

            {/* Supported File Types Badges */}
            <div className="flex flex-wrap justify-center gap-2 text-xs text-zinc-500">
              {[
                { icon: <PhotoIcon className="w-3 h-3" />, label: 'Images' },
                { icon: <DocumentTextIcon className="w-3 h-3" />, label: 'PDF' },
                { icon: <TableCellsIcon className="w-3 h-3" />, label: 'CSV/Excel' },
                { icon: <DocumentTextIcon className="w-3 h-3" />, label: 'Text' },
                { icon: <FilmIcon className="w-3 h-3" />, label: 'Video' },
              ].map((item, i) => (
                <span key={i} className="flex items-center gap-1 px-2 py-1 bg-zinc-800/50 rounded-md">
                  {item.icon}
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          <input
            type="file"
            accept="image/*,application/pdf,video/*,text/*,.csv,.xlsx,.xls,.md,.markdown,.txt"
            className="hidden"
            onChange={handleFileChange}
            disabled={isGenerating || disabled}
          />
        </label>
      </div>
    </div>
  );
};

export default InputArea;
