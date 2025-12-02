/**
 * OutputSelector Component
 * Modal for selecting which training output type to generate
 */

import React from 'react';
import { OutputConfig, SupportedFileType, OutputType } from '../types';
import { getApplicableOutputs } from '../services/output-registry';
import {
  XMarkIcon,
  MicrophoneIcon,
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
  ArrowPathIcon,
  SparklesIcon,
  PuzzlePieceIcon,
  PresentationChartBarIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

interface OutputSelectorProps {
  fileType: SupportedFileType;
  fileName: string;
  selectedOutput: OutputType | null;
  onSelect: (outputType: OutputType) => void;
  onCancel: () => void;
  onConfirm: () => void;
  isAutoSelecting?: boolean;
}

// Map output types to icons (excluding 'auto' which has special treatment)
const OUTPUT_ICONS: Record<Exclude<OutputType, 'auto'>, React.ComponentType<{ className?: string }>> = {
  'field-simulator': MicrophoneIcon,
  'damage-detective': MagnifyingGlassIcon,
  'commission-tycoon': CurrencyDollarIcon,
  'objection-arena': ShieldCheckIcon,
  'inspection-walkthrough': ClipboardDocumentCheckIcon,
  'flashcard-drill': AcademicCapIcon,
  'interactive-timeline': ArrowPathIcon,
  'scenario-builder': PuzzlePieceIcon,
  'pitch-perfector': PresentationChartBarIcon,
};

// File type display names
const FILE_TYPE_LABELS: Record<SupportedFileType, string> = {
  image: 'Image',
  pdf: 'PDF Document',
  csv: 'CSV Data',
  excel: 'Excel Spreadsheet',
  text: 'Text File',
  markdown: 'Markdown',
  video: 'Video'
};

export const OutputSelector: React.FC<OutputSelectorProps> = ({
  fileType,
  fileName,
  selectedOutput,
  onSelect,
  onCancel,
  onConfirm,
  isAutoSelecting = false
}) => {
  const applicableOutputs = getApplicableOutputs(fileType);
  const isAutoSelected = selectedOutput === 'auto';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-xl">
                <SparklesIcon className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Choose Training Type
                </h2>
                <p className="text-zinc-400 text-sm mt-1">
                  Transform{' '}
                  <span className="text-red-400 font-medium truncate max-w-[200px] inline-block align-bottom">
                    {fileName}
                  </span>
                  <span className="text-zinc-500 ml-2">
                    ({FILE_TYPE_LABELS[fileType]})
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              disabled={isAutoSelecting}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-white disabled:opacity-50"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Output Options */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* AUTO-SELECT OPTION - Featured at Top */}
          <div className="mb-4">
            <button
              onClick={() => onSelect('auto')}
              disabled={isAutoSelecting}
              className={`
                w-full p-4 rounded-xl border text-left transition-all duration-200
                ${isAutoSelected
                  ? 'border-amber-500 bg-gradient-to-r from-amber-500/20 to-orange-500/20 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10'
                  : 'border-amber-600/50 hover:border-amber-500 bg-gradient-to-r from-amber-500/5 to-orange-500/5 hover:from-amber-500/10 hover:to-orange-500/10'
                }
                ${isAutoSelecting ? 'animate-pulse' : ''}
              `}
            >
              <div className="flex items-center gap-4">
                <div className={`
                  p-3 rounded-xl transition-colors
                  ${isAutoSelected ? 'bg-amber-500/30 text-amber-300' : 'bg-amber-500/20 text-amber-400'}
                `}>
                  <BoltIcon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold text-lg ${isAutoSelected ? 'text-white' : 'text-amber-200'}`}>
                      AI Auto-Select
                    </h3>
                    <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/30 text-amber-300 rounded-full">
                      RECOMMENDED
                    </span>
                  </div>
                  <p className="text-sm text-amber-200/70 mt-1">
                    {isAutoSelecting
                      ? 'Analyzing your content to find the best training type...'
                      : 'Let AI analyze your content and choose the optimal training type automatically'
                    }
                  </p>
                </div>
                {isAutoSelected && !isAutoSelecting && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
                {isAutoSelecting && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                  </div>
                )}
              </div>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 h-px bg-zinc-700" />
            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Or choose manually</span>
            <div className="flex-1 h-px bg-zinc-700" />
          </div>

          {/* Manual Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {applicableOutputs.map(output => {
              const IconComponent = OUTPUT_ICONS[output.id as Exclude<OutputType, 'auto'>];
              const isSelected = selectedOutput === output.id;

              return (
                <button
                  key={output.id}
                  onClick={() => onSelect(output.id)}
                  disabled={isAutoSelecting}
                  className={`
                    p-4 rounded-xl border text-left transition-all duration-200
                    ${isSelected
                      ? 'border-red-500 bg-red-500/10 ring-2 ring-red-500/30 shadow-lg shadow-red-500/10'
                      : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50'
                    }
                    ${isAutoSelecting ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      p-2 rounded-lg transition-colors
                      ${isSelected ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-400'}
                    `}>
                      {IconComponent && <IconComponent className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                        {output.name}
                      </h3>
                      <p className="text-sm text-zinc-400 mt-1 line-clamp-2">
                        {output.description}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="flex-shrink-0">
                        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {applicableOutputs.length === 0 && (
            <div className="text-center py-8">
              <p className="text-zinc-500">No training types available for this file type.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              {applicableOutputs.length} training type{applicableOutputs.length !== 1 ? 's' : ''} available
            </p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="px-4 py-2.5 text-zinc-400 hover:text-white transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={!selectedOutput}
                className={`
                  px-6 py-2.5 rounded-xl font-semibold transition-all duration-200
                  flex items-center gap-2
                  ${selectedOutput
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40'
                    : 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                  }
                `}
              >
                <SparklesIcon className="w-4 h-4" />
                Generate Training
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutputSelector;
