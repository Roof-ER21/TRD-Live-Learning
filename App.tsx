/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * TRD Live Learning - Main Application
 * Roof-ER Training Generator with multi-format support
 */

import React, { useState, useEffect, useRef } from 'react';
import { Hero } from './components/Hero';
import { InputArea } from './components/InputArea';
import { LivePreview } from './components/LivePreview';
import { CreationHistory } from './components/CreationHistory';
import { OutputSelector } from './components/OutputSelector';
import { generateTraining, refineApp, autoSelectOutputType } from './services/gemini';
import { fileProcessor } from './services/file-processor';
import { ArrowUpTrayIcon } from '@heroicons/react/24/solid';
import { playUISound } from './utils/sound';

// Import types
import type { Creation, ParsedFile, OutputType } from './types';

const App: React.FC = () => {
  // Core state
  const [activeCreation, setActiveCreation] = useState<Creation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [history, setHistory] = useState<Creation[]>([]);

  // New output selector state
  const [pendingFile, setPendingFile] = useState<ParsedFile | null>(null);
  const [selectedOutputType, setSelectedOutputType] = useState<OutputType | null>(null);
  const [showOutputSelector, setShowOutputSelector] = useState(false);
  const [processingFile, setProcessingFile] = useState(false);
  const [isAutoSelecting, setIsAutoSelecting] = useState(false);

  const importInputRef = useRef<HTMLInputElement>(null);

  // Load history from local storage on mount
  useEffect(() => {
    const initHistory = async () => {
      const saved = localStorage.getItem('trd_training_history');
      let loadedHistory: Creation[] = [];

      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          loadedHistory = parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          }));
        } catch (e) {
          console.error("Failed to load history", e);
        }
      }

      if (loadedHistory.length > 0) {
        setHistory(loadedHistory);
      }
    };

    initHistory();
  }, []);

  // Save history when it changes
  useEffect(() => {
    if (history.length > 0) {
      try {
        localStorage.setItem('trd_training_history', JSON.stringify(history));
      } catch (e) {
        console.warn("Local storage full or error saving history", e);
      }
    }
  }, [history]);

  // Helper to convert file to base64 (for legacy/refinement)
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to convert file to base64'));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  /**
   * Handle file upload - process file and show output selector
   */
  const handleGenerate = async (_promptText: string, file?: File) => {
    if (!file) return;

    setProcessingFile(true);
    playUISound('upload');

    try {
      // Process the file using FileProcessor
      const parsed = await fileProcessor.process(file);
      setPendingFile(parsed);
      setShowOutputSelector(true);
    } catch (error: any) {
      playUISound('error');
      console.error("File processing error:", error);
      alert(`Error processing file: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessingFile(false);
    }
  };

  /**
   * Confirm generation with selected output type
   */
  const handleConfirmGeneration = async () => {
    if (!pendingFile || !selectedOutputType) return;

    let finalOutputType: OutputType = selectedOutputType;

    // Handle auto-select
    if (selectedOutputType === 'auto') {
      setIsAutoSelecting(true);
      playUISound('generate');

      try {
        finalOutputType = await autoSelectOutputType(pendingFile);
        console.log(`AI selected output type: ${finalOutputType}`);
      } catch (error) {
        console.error("Auto-select failed, using fallback:", error);
        // Use fallback based on file type
        finalOutputType = pendingFile.type === 'image' ? 'damage-detective' : 'flashcard-drill';
      } finally {
        setIsAutoSelecting(false);
      }
    }

    setShowOutputSelector(false);
    setIsGenerating(true);
    playUISound('generate');
    setActiveCreation(null);

    try {
      // Generate using new architecture with final output type
      const html = await generateTraining(pendingFile, finalOutputType);

      if (html) {
        playUISound('success');

        // Build preview image from file
        let originalImage: string | undefined;
        if (pendingFile.type === 'image' && pendingFile.extractedContent.rawBase64) {
          originalImage = `data:${pendingFile.mimeType};base64,${pendingFile.extractedContent.rawBase64}`;
        } else if (pendingFile.extractedContent.pages?.[0]?.imageBase64) {
          originalImage = `data:image/png;base64,${pendingFile.extractedContent.pages[0].imageBase64}`;
        } else if (pendingFile.extractedContent.frames?.[0]?.imageBase64) {
          originalImage = `data:image/jpeg;base64,${pendingFile.extractedContent.frames[0].imageBase64}`;
        }

        const newCreation: Creation = {
          id: crypto.randomUUID(),
          name: pendingFile.metadata.fileName,
          html: html,
          originalImage,
          outputType: finalOutputType, // Use the final determined type
          sourceFileType: pendingFile.type,
          metadata: pendingFile.metadata,
          timestamp: new Date(),
        };

        setActiveCreation(newCreation);
        setHistory(prev => [newCreation, ...prev]);
      }
    } catch (error: any) {
      playUISound('error');
      console.error("Generation failed:", error);
      alert(`Generation failed: ${error.message || 'Unknown error'}. Please try again.`);
    } finally {
      setPendingFile(null);
      setSelectedOutputType(null);
      setIsGenerating(false);
    }
  };

  /**
   * Cancel output selection
   */
  const handleCancelSelection = () => {
    setPendingFile(null);
    setSelectedOutputType(null);
    setShowOutputSelector(false);
  };

  /**
   * Refine existing creation with new instructions
   */
  const handleRefine = async (instruction: string, referenceImage?: File) => {
    if (!activeCreation) return;

    setIsRefining(true);
    try {
      let refImageBase64: string | undefined;
      let refMimeType: string | undefined;

      if (referenceImage) {
        refImageBase64 = await fileToBase64(referenceImage);
        refMimeType = referenceImage.type.toLowerCase();
      }

      const newHtml = await refineApp(activeCreation.html, instruction, refImageBase64, refMimeType);

      if (newHtml) {
        playUISound('success');
        const updatedCreation: Creation = {
          ...activeCreation,
          html: newHtml,
          timestamp: new Date(),
        };

        setActiveCreation(updatedCreation);
        setHistory(prev => prev.map(item =>
          item.id === updatedCreation.id ? updatedCreation : item
        ));
      }
    } catch (error) {
      playUISound('error');
      console.error("Refinement failed:", error);
      alert("Failed to refine the training. Please try again.");
    } finally {
      setIsRefining(false);
    }
  };

  /**
   * Reset to home screen
   */
  const handleReset = () => {
    setActiveCreation(null);
    setIsGenerating(false);
    setIsRefining(false);
  };

  /**
   * Select a creation from history
   */
  const handleSelectCreation = (creation: Creation) => {
    setActiveCreation(creation);
  };

  /**
   * Import artifact from JSON file
   */
  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const parsed = JSON.parse(json);

        if (parsed.html && parsed.name) {
          playUISound('success');
          const importedCreation: Creation = {
            ...parsed,
            timestamp: new Date(parsed.timestamp || Date.now()),
            id: parsed.id || crypto.randomUUID()
          };

          setHistory(prev => {
            const exists = prev.some(c => c.id === importedCreation.id);
            return exists ? prev : [importedCreation, ...prev];
          });

          setActiveCreation(importedCreation);
        } else {
          playUISound('error');
          alert("Invalid artifact file format.");
        }
      } catch (err) {
        playUISound('error');
        console.error("Import error", err);
        alert("Failed to import artifact.");
      }
      if (importInputRef.current) importInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const isFocused = !!activeCreation || isGenerating;

  return (
    <div className="h-[100dvh] bg-zinc-950 bg-dot-grid text-zinc-50 selection:bg-blue-500/30 overflow-y-auto overflow-x-hidden relative flex flex-col">

      {/* Main Content Container */}
      <div
        className={`
          min-h-full flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 relative z-10
          transition-all duration-700 cubic-bezier(0.4, 0, 0.2, 1)
          ${isFocused
            ? 'opacity-0 scale-95 blur-sm pointer-events-none h-[100dvh] overflow-hidden'
            : 'opacity-100 scale-100 blur-0'
          }
        `}
      >
        {/* Main Vertical Centering Wrapper */}
        <div className="flex-1 flex flex-col justify-center items-center w-full py-12 md:py-20">

          {/* 1. Hero Section */}
          <div className="w-full mb-8 md:mb-16">
            <Hero />
          </div>

          {/* 2. Input Section */}
          <div className="w-full flex justify-center mb-8">
            <InputArea
              onGenerate={handleGenerate}
              isGenerating={isGenerating || processingFile}
              disabled={isFocused}
            />
          </div>

        </div>

        {/* 3. History Section & Footer */}
        <div className="flex-shrink-0 pb-6 w-full mt-auto flex flex-col items-center gap-6">
          <div className="w-full px-2 md:px-0">
            <CreationHistory history={history} onSelect={handleSelectCreation} />
          </div>

          <div className="text-zinc-600 text-xs font-mono pb-2">
            TRD Live Learning - Roof-ER Training Generator
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <LivePreview
        creation={activeCreation}
        isLoading={isGenerating}
        isRefining={isRefining}
        isFocused={isFocused}
        onReset={handleReset}
        onRefine={handleRefine}
      />

      {/* Output Type Selector Modal */}
      {showOutputSelector && pendingFile && (
        <OutputSelector
          fileType={pendingFile.type}
          fileName={pendingFile.metadata.fileName}
          selectedOutput={selectedOutputType}
          onSelect={setSelectedOutputType}
          onCancel={handleCancelSelection}
          onConfirm={handleConfirmGeneration}
          isAutoSelecting={isAutoSelecting}
        />
      )}

      {/* Import Button */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={handleImportClick}
          className="flex items-center space-x-2 p-2 text-zinc-500 hover:text-zinc-300 transition-colors opacity-60 hover:opacity-100"
          title="Import Artifact"
        >
          <span className="text-xs font-medium uppercase tracking-wider hidden sm:inline">
            Import Artifact
          </span>
          <ArrowUpTrayIcon className="w-5 h-5" />
        </button>
        <input
          type="file"
          ref={importInputRef}
          onChange={handleImportFile}
          accept=".json"
          className="hidden"
        />
      </div>
    </div>
  );
};

export default App;
