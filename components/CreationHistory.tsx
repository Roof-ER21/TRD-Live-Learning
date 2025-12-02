/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * CreationHistory Component - Archive of generated training modules
 */

import React from 'react';
import {
  ClockIcon,
  ArrowRightIcon,
  DocumentIcon,
  PhotoIcon,
  TableCellsIcon,
  FilmIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import type { Creation, SupportedFileType } from '../types';

interface CreationHistoryProps {
  history: Creation[];
  onSelect: (creation: Creation) => void;
}

// Get icon based on source file type
const getFileIcon = (creation: Creation) => {
  const fileType = creation.sourceFileType;

  if (fileType === 'image') {
    return <PhotoIcon className="w-4 h-4 text-zinc-400" />;
  }
  if (fileType === 'video') {
    return <FilmIcon className="w-4 h-4 text-zinc-400" />;
  }
  if (fileType === 'csv' || fileType === 'excel') {
    return <TableCellsIcon className="w-4 h-4 text-zinc-400" />;
  }
  if (fileType === 'text' || fileType === 'markdown') {
    return <DocumentTextIcon className="w-4 h-4 text-zinc-400" />;
  }
  if (fileType === 'pdf') {
    return <DocumentIcon className="w-4 h-4 text-zinc-400" />;
  }

  // Fallback based on originalImage
  if (creation.originalImage?.startsWith('data:application/pdf')) {
    return <DocumentIcon className="w-4 h-4 text-zinc-400" />;
  }
  if (creation.originalImage) {
    return <PhotoIcon className="w-4 h-4 text-zinc-400" />;
  }

  return <DocumentIcon className="w-4 h-4 text-zinc-400" />;
};

// Get output type label
const getOutputLabel = (creation: Creation): string | null => {
  if (!creation.outputType) return null;

  const labels: Record<string, string> = {
    'field-simulator': 'Simulator',
    'damage-detective': 'Detective',
    'commission-tycoon': 'Tycoon',
    'objection-arena': 'Arena',
    'inspection-walkthrough': 'Walkthrough',
    'flashcard-drill': 'Flashcards',
    'interactive-timeline': 'Timeline'
  };

  return labels[creation.outputType] || null;
};

export const CreationHistory: React.FC<CreationHistoryProps> = ({ history, onSelect }) => {
  if (history.length === 0) return null;

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center space-x-3 mb-3 px-2">
        <ClockIcon className="w-4 h-4 text-zinc-500" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Training Archive</h2>
        <div className="h-px flex-1 bg-zinc-800"></div>
        <span className="text-xs text-zinc-600">{history.length} items</span>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="flex overflow-x-auto space-x-4 pb-2 px-2 scrollbar-hide">
        {history.map((item) => {
          const outputLabel = getOutputLabel(item);

          return (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className="group flex-shrink-0 relative flex flex-col text-left w-48 h-32 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 rounded-lg transition-all duration-200 overflow-hidden"
            >
              <div className="p-4 flex flex-col h-full">
                <div className="flex items-start justify-between mb-2">
                  <div className="p-1.5 bg-zinc-800 rounded group-hover:bg-zinc-700 transition-colors border border-zinc-700/50">
                    {getFileIcon(item)}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-mono text-zinc-600 group-hover:text-zinc-400">
                      {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {outputLabel && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded">
                        {outputLabel}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-auto">
                  <h3 className="text-sm font-medium text-zinc-300 group-hover:text-white truncate">
                    {item.name}
                  </h3>
                  <div className="flex items-center space-x-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-blue-400">Open</span>
                    <ArrowRightIcon className="w-3 h-3 text-blue-400" />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default CreationHistory;
