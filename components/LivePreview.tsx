
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useEffect, useState, useRef } from 'react';
import { ArrowDownTrayIcon, PlusIcon, ViewColumnsIcon, DocumentIcon, CodeBracketIcon, XMarkIcon, SparklesIcon, PaperAirplaneIcon, MicrophoneIcon, PaperClipIcon, StopIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Creation } from './CreationHistory';
import { playUISound } from '../utils/sound';

interface LivePreviewProps {
  creation: Creation | null;
  isLoading: boolean;
  isRefining: boolean;
  isFocused: boolean;
  onReset: () => void;
  onRefine: (instruction: string, referenceImage?: File) => void;
}

// Add type definition for the global pdfjsLib and SpeechRecognition
declare global {
  interface Window {
    pdfjsLib: any;
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const LoadingStep = ({ text, active, completed }: { text: string, active: boolean, completed: boolean }) => (
    <div className={`flex items-center space-x-3 transition-all duration-500 ${active || completed ? 'opacity-100 translate-x-0' : 'opacity-30 translate-x-4'}`}>
        <div className={`w-4 h-4 flex items-center justify-center ${completed ? 'text-green-400' : active ? 'text-blue-400' : 'text-zinc-700'}`}>
            {completed ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : active ? (
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
            ) : (
                <div className="w-1.5 h-1.5 bg-zinc-700 rounded-full"></div>
            )}
        </div>
        <span className={`font-mono text-xs tracking-wide uppercase ${active ? 'text-zinc-200' : completed ? 'text-zinc-400 line-through' : 'text-zinc-600'}`}>{text}</span>
    </div>
);

const PdfRenderer = ({ dataUrl }: { dataUrl: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderPdf = async () => {
      if (!window.pdfjsLib) {
        setError("PDF library not initialized");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Load the document
        const loadingTask = window.pdfjsLib.getDocument(dataUrl);
        const pdf = await loadingTask.promise;
        
        // Get the first page
        const page = await pdf.getPage(1);
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        
        // Calculate scale to make it look good (High DPI)
        const viewport = page.getViewport({ scale: 2.0 });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        setLoading(false);
      } catch (err) {
        console.error("Error rendering PDF:", err);
        setError("Could not render PDF preview.");
        setLoading(false);
      }
    };

    renderPdf();
  }, [dataUrl]);

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-6 text-center">
            <DocumentIcon className="w-12 h-12 mb-3 opacity-50 text-red-400" />
            <p className="text-sm mb-2 text-red-400/80">{error}</p>
        </div>
    );
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center">
        {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        )}
        <canvas 
            ref={canvasRef} 
            className={`max-w-full max-h-full object-contain shadow-xl border border-zinc-800/50 rounded transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
        />
    </div>
  );
};

export const LivePreview: React.FC<LivePreviewProps> = ({ creation, isLoading, isRefining, isFocused, onReset, onRefine }) => {
    const [loadingStep, setLoadingStep] = useState(0);
    const [showSplitView, setShowSplitView] = useState(false);
    const [refinementInput, setRefinementInput] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [refinementImage, setRefinementImage] = useState<File | null>(null);
    const [refinementImagePreview, setRefinementImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);

    // Handle loading animation steps
    useEffect(() => {
        if (isLoading) {
            setLoadingStep(0);
            const interval = setInterval(() => {
                setLoadingStep(prev => (prev < 3 ? prev + 1 : prev));
            }, 2000); 
            return () => clearInterval(interval);
        } else {
            setLoadingStep(0);
        }
    }, [isLoading]);

    // Default to Split View when a new creation with an image is loaded
    useEffect(() => {
        if (creation?.originalImage) {
            setShowSplitView(true);
        } else {
            setShowSplitView(false);
        }
    }, [creation]);

    const handleExport = () => {
        if (!creation) return;
        playUISound('click');
        const dataStr = JSON.stringify(creation, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${creation.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_artifact.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleRefineSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if ((!refinementInput.trim() && !refinementImage) || isRefining) return;
        
        playUISound('refine');
        const finalInstruction = refinementInput.trim() || "Update the app to match the style of the attached image.";

        onRefine(finalInstruction, refinementImage || undefined);
        setRefinementInput('');
        setRefinementImage(null);
        setRefinementImagePreview(null);
    };

    const handleVoiceInput = () => {
        if (isListening) {
            // Stop listening
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsListening(false);
            playUISound('click');
            return;
        }
        
        playUISound('click');
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            alert("Voice input is not supported in this browser. Please use Chrome or Edge.");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        
        recognition.continuous = true; // Keep listening until user stops or submits
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        
        recognition.onend = () => {
            setIsListening(false);
        };
        
        recognition.onerror = (event: any) => {
            console.error("Speech Recognition Error", event.error);
            setIsListening(false);
        };

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            
            if (finalTranscript) {
                setRefinementInput(prev => {
                    const spacer = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
                    return prev + spacer + finalTranscript;
                });
            }
        };

        recognition.start();
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setRefinementImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setRefinementImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                e.preventDefault();
                const file = items[i].getAsFile();
                if (file) {
                    setRefinementImage(file);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setRefinementImagePreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                }
                return;
            }
        }
    };

    const clearImage = () => {
        playUISound('click');
        setRefinementImage(null);
        setRefinementImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

  return (
    <div
      className={`
        fixed z-40 flex flex-col
        rounded-lg overflow-hidden border border-zinc-800 bg-[#0E0E10] shadow-2xl
        transition-all duration-700 cubic-bezier(0.2, 0.8, 0.2, 1)
        ${isFocused
          ? 'inset-2 md:inset-4 opacity-100 scale-100'
          : 'top-1/2 left-1/2 w-[90%] h-[60%] -translate-x-1/2 -translate-y-1/2 opacity-0 scale-95 pointer-events-none'
        }
      `}
    >
      {/* Minimal Technical Header */}
      <div className="bg-[#121214] px-4 py-3 flex items-center justify-between border-b border-zinc-800 shrink-0">
        {/* Left: Controls */}
        <div className="flex items-center space-x-3 w-32">
           <div className="flex space-x-2 group/controls">
                <button 
                  onClick={onReset}
                  className="w-3 h-3 rounded-full bg-zinc-700 group-hover/controls:bg-red-500 hover:!bg-red-600 transition-colors flex items-center justify-center focus:outline-none"
                  title="Close Preview"
                >
                  <XMarkIcon className="w-2 h-2 text-black opacity-0 group-hover/controls:opacity-100" />
                </button>
                <div className="w-3 h-3 rounded-full bg-zinc-700 group-hover/controls:bg-yellow-500 transition-colors"></div>
                <div className="w-3 h-3 rounded-full bg-zinc-700 group-hover/controls:bg-green-500 transition-colors"></div>
           </div>
        </div>
        
        {/* Center: Title */}
        <div className="flex items-center space-x-2 text-zinc-500">
            <CodeBracketIcon className="w-3 h-3" />
            <span className="text-[11px] font-mono uppercase tracking-wider">
                {isLoading ? 'System Processing...' : isRefining ? 'Refining Artifact...' : creation ? creation.name : 'Preview Mode'}
            </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end space-x-1 w-32">
            {!isLoading && creation && (
                <>
                    {creation.originalImage && (
                         <button 
                            onClick={() => { playUISound('click'); setShowSplitView(!showSplitView); }}
                            title={showSplitView ? "Show App Only" : "Compare with Original"}
                            className={`p-1.5 rounded-md transition-all ${showSplitView ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
                        >
                            <ViewColumnsIcon className="w-4 h-4" />
                        </button>
                    )}

                    <button 
                        onClick={handleExport}
                        title="Export Artifact (JSON)"
                        className="text-zinc-500 hover:text-zinc-300 transition-colors p-1.5 rounded-md hover:bg-zinc-800"
                    >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                    </button>

                    <button 
                        onClick={onReset}
                        title="New Upload"
                        className="ml-2 flex items-center space-x-1 text-xs font-bold bg-white text-black hover:bg-zinc-200 px-3 py-1.5 rounded-md transition-colors"
                    >
                        <PlusIcon className="w-3 h-3" />
                        <span className="hidden sm:inline">New</span>
                    </button>
                </>
            )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative w-full flex-1 bg-[#09090b] flex overflow-auto">
        {/* Initial Loading Screen */}
        {isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 w-full z-20 bg-[#09090b]">
             {/* Technical Loading State */}
             <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 mb-6 text-blue-500 animate-spin-slow">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                           <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-zinc-100 font-mono text-lg tracking-tight">Constructing Environment</h3>
                    <p className="text-zinc-500 text-sm mt-2">Interpreting visual data...</p>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 animate-[loading_3s_ease-in-out_infinite] w-1/3"></div>
                </div>

                 {/* Terminal Steps */}
                 <div className="border border-zinc-800 bg-black/50 rounded-lg p-4 space-y-3 font-mono text-sm">
                     <LoadingStep text="Analyzing visual inputs" active={loadingStep === 0} completed={loadingStep > 0} />
                     <LoadingStep text="Identifying UI patterns" active={loadingStep === 1} completed={loadingStep > 1} />
                     <LoadingStep text="Generating functional logic" active={loadingStep === 2} completed={loadingStep > 2} />
                     <LoadingStep text="Compiling preview" active={loadingStep === 3} completed={loadingStep > 3} />
                 </div>
             </div>
          </div>
        ) : creation?.html ? (
          <>
            {/* Split View: Left Panel (Original Image) */}
            {showSplitView && creation.originalImage && (
                <div className="w-full md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-zinc-800 bg-[#0c0c0e] relative flex flex-col shrink-0">
                    <div className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur text-zinc-400 text-[10px] font-mono uppercase px-2 py-1 rounded border border-zinc-800">
                        Input Source
                    </div>
                    <div className="w-full h-full p-6 flex items-center justify-center overflow-hidden">
                        {creation.originalImage.startsWith('data:application/pdf') ? (
                            <PdfRenderer dataUrl={creation.originalImage} />
                        ) : (
                            <img 
                                src={creation.originalImage} 
                                alt="Original Input" 
                                className="max-w-full max-h-full object-contain shadow-xl border border-zinc-800/50 rounded"
                            />
                        )}
                    </div>
                </div>
            )}

            {/* App Preview Panel */}
            <div className={`relative h-full bg-white transition-all duration-500 ${showSplitView && creation.originalImage ? 'w-full md:w-1/2 h-1/2 md:h-full' : 'w-full'}`}>
                 {/* Refinement Loading Overlay */}
                 {isRefining && (
                     <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] z-10 flex items-center justify-center">
                        <div className="bg-zinc-900/90 border border-zinc-700 rounded-xl p-4 flex items-center space-x-3 shadow-2xl">
                             <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                             <span className="text-zinc-200 text-sm font-medium">Applying changes...</span>
                        </div>
                     </div>
                 )}
                 
                 <iframe
                    title="Gemini Live Preview"
                    srcDoc={creation.html}
                    className="w-full h-full"
                    allow="microphone; camera; autoplay; payment"
                    sandbox="allow-scripts allow-forms allow-popups allow-modals allow-same-origin"
                />
                
                {/* Refinement Bar */}
                <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center z-20 px-4 pointer-events-none">
                    
                    {/* Image Preview Bubble */}
                    {refinementImagePreview && (
                        <div className="mb-2 relative pointer-events-auto animate-in fade-in slide-in-from-bottom-2">
                            <div className="relative h-16 w-16 rounded-lg overflow-hidden border border-zinc-600 shadow-lg group">
                                <img src={refinementImagePreview} alt="Refinement context" className="h-full w-full object-cover" />
                                <button 
                                    onClick={clearImage}
                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}

                    <form 
                        onSubmit={handleRefineSubmit}
                        className={`w-full max-w-xl relative group pointer-events-auto transition-all duration-300 ${isRefining ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}
                    >
                        {/* Voice Feedback Visuals */}
                        {isListening && (
                             <div className="absolute -inset-4 flex items-center justify-center pointer-events-none">
                                  <div className="w-full h-full bg-red-500/10 rounded-full blur-xl animate-pulse"></div>
                             </div>
                        )}

                        <div className={`
                            relative flex items-center 
                            bg-[#09090b] 
                            border transition-all duration-500 ease-out
                            ${isListening 
                                ? 'border-red-500/50 shadow-[0_0_40px_-10px_rgba(239,68,68,0.3)] ring-1 ring-red-500/30' 
                                : 'border-zinc-800 shadow-xl'
                            } 
                            rounded-full overflow-hidden
                        `}>
                            
                            {/* Animated Gradient Background for Voice */}
                            <div className={`absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 transition-opacity duration-500 ${isListening ? 'opacity-100 animate-[pulse_3s_ease-in-out_infinite]' : 'opacity-0'}`} />

                            {/* File Input Button */}
                            <button 
                                type="button"
                                onClick={() => { playUISound('click'); fileInputRef.current?.click(); }}
                                className="pl-4 pr-2 relative z-10 text-zinc-400 hover:text-zinc-200 transition-colors focus:outline-none"
                                title="Add reference image (or paste from clipboard)"
                            >
                                <PaperClipIcon className="w-5 h-5" />
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef}
                                onChange={handleImageSelect}
                                accept="image/*"
                                className="hidden" 
                            />

                            <input 
                                type="text" 
                                value={refinementInput}
                                onChange={(e) => setRefinementInput(e.target.value)}
                                onPaste={handlePaste}
                                disabled={isRefining}
                                className={`w-full bg-transparent border-none py-3 pl-2 pr-20 text-sm text-white placeholder:text-zinc-500 focus:ring-0 relative z-10 ${isListening ? 'placeholder:text-red-400 placeholder:animate-pulse' : ''}`}
                                placeholder={isListening ? "Listening..." : "Type commands or paste an image..."} 
                            />
                            
                            {/* Voice Input Button */}
                            <button
                                type="button"
                                onClick={handleVoiceInput}
                                disabled={isRefining}
                                className={`
                                    absolute right-11 z-20 p-2 rounded-full transition-all duration-300
                                    ${isListening 
                                        ? 'bg-red-500 text-white shadow-lg scale-110' 
                                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                                    }
                                `}
                                title={isListening ? "Stop Listening" : "Start Voice Input"}
                            >
                                {isListening ? (
                                    <div className="relative flex items-center justify-center">
                                        <div className="absolute -inset-3 bg-red-500/50 rounded-full animate-ping opacity-75"></div>
                                        <div className="absolute -inset-1 bg-red-400 rounded-full animate-pulse"></div>
                                         {/* Mini waveform animation */}
                                        <div className="relative z-10 flex space-x-0.5 items-center justify-center h-4 w-4">
                                             <div className="w-1 h-3 bg-white rounded-full animate-[bounce_1s_infinite]"></div>
                                             <div className="w-1 h-4 bg-white rounded-full animate-[bounce_1.2s_infinite]"></div>
                                             <div className="w-1 h-2 bg-white rounded-full animate-[bounce_0.8s_infinite]"></div>
                                        </div>
                                    </div>
                                ) : (
                                    <MicrophoneIcon className="w-5 h-5" />
                                )}
                            </button>

                            {/* Submit Button */}
                            <button 
                                type="submit" 
                                disabled={isRefining || (!refinementInput.trim() && !refinementImage)}
                                className="absolute right-1.5 top-1.5 z-20 h-9 w-9 bg-zinc-700 hover:bg-blue-600 text-zinc-200 hover:text-white rounded-full flex items-center justify-center transition-all disabled:opacity-50 disabled:hover:bg-zinc-700"
                            >
                                {isRefining ? (
                                    <SparklesIcon className="w-4 h-4 animate-pulse" />
                                ) : (
                                    <PaperAirplaneIcon className="w-4 h-4 -ml-0.5" />
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
