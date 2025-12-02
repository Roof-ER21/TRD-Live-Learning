/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Gemini AI Service for TRD Live Learning
 * Handles all AI generation for training modules
 */

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ParsedFile, OutputType, SupportedFileType } from '../types';
import { getOutputConfig } from './output-registry';

// Model configuration - using stable model
const GEMINI_MODEL = 'gemini-2.0-flash';
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// ============================================
// ROOF-ER KNOWLEDGE BASE
// ============================================

const ROOF_ER_KNOWLEDGE = `
ROOF-ER SALES TRAINING CONTEXT:

1. **Core Values**: Integrity, Quality, Simplicity.

2. **The 5 Non-Negotiables**:
   - Who you are (your name, friendly introduction)
   - Who we are (Roof-ER, local roofing company)
   - Make it relatable (mention neighbors, recent storms)
   - What you're there to do (Free inspection)
   - Go for the close (Agreement to inspect)

3. **The Pitch**:
   - Opening: "Hi, I'm [Name] with Roof-ER, we're a local roofing company."
   - Hook: "We've had a lot of storms recently and we're working with your neighbors."
   - Value: "We help homeowners get their roof replaced, paid by insurance."
   - Close: "The inspection takes 10-15 mins... we check the perimeter then the roof... gives you peace of mind."

4. **Damage Identification**:
   - **Hail Damage**: Circular divots, black marks, soft metal damage (gutters, vents)
   - **Wind Damage**: Creased shingles, lifted edges, missing shingles
   - **Granule Loss**: Check gutters for granule buildup, indicates wear
   - **Collateral Damage**: Always check soft metals first (easier to spot)

5. **Common Objections & Rebuttals**:
   - "Not interested" → "No worries, just offering a free peace of mind inspection while I'm here."
   - "My roof is new" → "Great! We can verify it's still in perfect condition after the recent storm."
   - "I don't have time" → "It only takes 10-15 minutes, and I can do it while you continue with your day."
   - "Need to talk to spouse" → "Absolutely! Would it help if I left some information for them?"
   - "Already have a roofer" → "That's great you have someone. We just want to make sure you have all your options."

6. **Commission Structure**:
   - $1000 paid on Downpayment
   - 10+ Sign ups: 16% commission
   - 8-9 Sign ups: 10% commission
   - Goal: Quality over quantity

7. **Inspection Process**:
   1. Introduction at door
   2. Perimeter walk (gutters, downspouts, siding)
   3. Soft metal inspection (vents, flashing, caps)
   4. Ground-level assessment
   5. Ladder setup & safety check
   6. Roof surface inspection
   7. Documentation (photos)
   8. Present findings to homeowner
`;

// ============================================
// NEW GENERATION FUNCTION (Uses Output Registry)
// ============================================

/**
 * Generate training module using new architecture
 * @param parsedFile - Processed file with extracted content
 * @param outputType - Type of training output to generate
 * @param additionalInstructions - Optional extra instructions
 */
export async function generateTraining(
  parsedFile: ParsedFile,
  outputType: OutputType,
  additionalInstructions?: string
): Promise<string> {
  const outputConfig = getOutputConfig(outputType);
  const systemPrompt = buildSystemPrompt(outputConfig);
  const contentParts = buildContentParts(parsedFile, additionalInstructions);

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: { parts: contentParts },
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.5,
      },
    });

    let text = response.text || "<!-- Failed to generate content -->";
    return cleanResponse(text);
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
}

/**
 * Auto-select the best output type based on content analysis
 * @param parsedFile - The processed file to analyze
 * @returns The recommended OutputType
 */
export async function autoSelectOutputType(parsedFile: ParsedFile): Promise<OutputType> {
  const analysisPrompt = `Analyze this content and determine the BEST training type for a roofing sales training platform.

AVAILABLE TRAINING TYPES (choose ONE):
1. "field-simulator" - For: dialogue scripts, pitch conversations, door-to-door scenarios. Best when content has speaker turns or conversation flow.
2. "damage-detective" - For: roof images, damage photos, visual inspection content. Best for images showing roof conditions.
3. "commission-tycoon" - For: facts, figures, commission rates, product info. Best for quiz-able factual content.
4. "objection-arena" - For: objection handling, rebuttals, customer concerns. Best when content lists objections and responses.
5. "inspection-walkthrough" - For: process steps, checklists, procedures. Best for sequential how-to content.
6. "flashcard-drill" - For: terminology, definitions, Q&A pairs. Best for memorization content.
7. "interactive-timeline" - For: processes, workflows, stages. Best for linear progression content.
8. "scenario-builder" - For: case studies, decision scenarios, what-if situations. Best for branching narrative content.
9. "pitch-perfector" - For: sales scripts, pitch content, presentation text. Best for practicing delivery.

CONTENT TO ANALYZE:
File type: ${parsedFile.type}
File name: ${parsedFile.metadata.fileName}
${parsedFile.extractedContent.text ? `Text preview: ${parsedFile.extractedContent.text.substring(0, 1500)}` : ''}
${parsedFile.extractedContent.data ? `Data rows: ${parsedFile.metadata.rowCount}, columns: ${parsedFile.metadata.columnCount}` : ''}
${parsedFile.extractedContent.pages ? `PDF pages: ${parsedFile.metadata.pageCount}` : ''}
${parsedFile.extractedContent.frames ? `Video frames: ${parsedFile.extractedContent.frames.length}` : ''}

RESPOND WITH ONLY the training type ID (e.g., "field-simulator"). Nothing else.`;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: { parts: [{ text: analysisPrompt }] },
      config: { temperature: 0.1 }, // Low temperature for consistent results
    });

    const result = (response.text || '').trim().toLowerCase().replace(/['"]/g, '');

    // Validate the response is a valid output type
    const validTypes: OutputType[] = [
      'field-simulator', 'damage-detective', 'commission-tycoon',
      'objection-arena', 'inspection-walkthrough', 'flashcard-drill',
      'interactive-timeline', 'scenario-builder', 'pitch-perfector'
    ];

    if (validTypes.includes(result as OutputType)) {
      return result as OutputType;
    }

    // Fallback logic based on file type
    return getDefaultOutputType(parsedFile.type);
  } catch (error) {
    console.error("Auto-select error:", error);
    return getDefaultOutputType(parsedFile.type);
  }
}

/**
 * Get default output type based on file type (fallback)
 */
function getDefaultOutputType(fileType: SupportedFileType): OutputType {
  switch (fileType) {
    case 'image':
      return 'damage-detective';
    case 'video':
      return 'inspection-walkthrough';
    case 'csv':
    case 'excel':
      return 'commission-tycoon';
    case 'pdf':
    case 'text':
    case 'markdown':
    default:
      return 'flashcard-drill';
  }
}

/**
 * Build system prompt from output configuration
 * CRITICAL: Do NOT include hardcoded knowledge - use uploaded content only
 */
function buildSystemPrompt(outputConfig: any): string {
  return `You are an expert interactive training content architect.

CRITICAL PRIORITY: Transform the UPLOADED CONTENT into training.
The uploaded content is your PRIMARY and ONLY source material.
Do NOT invent or add information not present in the uploaded source.

YOUR TASK:
${outputConfig.promptFragment}

CRITICAL REQUIREMENTS:

1. **USE UPLOADED CONTENT ONLY**:
   - Base ALL questions, scenarios, flashcards, and content on the uploaded material
   - Do NOT invent facts, names, numbers, or details not in the source
   - If the source has sales data, ask about THAT data
   - If the source has a checklist, use THOSE checklist items
   - Extract real information from what was uploaded

2. **SELF-CONTAINED HTML**:
   - Return a SINGLE HTML file with embedded CSS and JavaScript
   - NO external dependencies (no CDN links, no external images)
   - All styling must be inline or in <style> tags
   - All functionality in <script> tags

3. **VISUAL STYLE**:
   - Primary Color: Red (#EF4444)
   - Secondary: White (#FFFFFF), Zinc (#71717A)
   - Background: Dark zinc (#18181B) or gradients
   - Use glassmorphism for overlays (backdrop-blur, semi-transparent)
   - Modern, professional, game-like aesthetic
   - CSS-only graphics (no external images)

4. **INTERACTIVITY**:
   - All buttons must be functional
   - Include visual feedback (hover states, click animations)
   - Add sound effects using Web Audio API (beeps, success sounds)
   - Save progress to localStorage where applicable

5. **FALLBACKS**:
   - Include "Skip" buttons where appropriate for testing
   - Handle edge cases gracefully
   - Show clear error messages if something fails

6. **MOBILE RESPONSIVE**:
   - Use flexbox/grid for layout
   - Touch-friendly button sizes (min 44px)
   - Readable text sizes

7. **SCROLLABLE CONTENT**:
   - Ensure body has overflow-y: auto or overflow: auto
   - Content should be scrollable if it exceeds viewport
   - Use min-height: 100vh for full-page layouts

8. **END-OF-TRAINING SUMMARY (REQUIRED)**:
   - When training is complete, show a SUMMARY SCREEN with:
     * Final score/grade (if applicable)
     * Time spent
     * Key stats (questions answered, accuracy %, items completed)
     * List of mistakes/areas to review
     * Key takeaways from the training content
   - Include a "Download Summary (PDF)" button that:
     * Uses window.print() to trigger browser print dialog
     * Include @media print CSS to hide buttons and format nicely for PDF
     * Print styles: white background, black text, clean layout
   - Example print button code:
     \`\`\`javascript
     function downloadPDF() {
       window.print();
     }
     \`\`\`
   - Include these print styles:
     \`\`\`css
     @media print {
       body { background: white !important; color: black !important; }
       button, .no-print { display: none !important; }
       .summary-content { padding: 20px; }
     }
     \`\`\`

RESPONSE FORMAT:
Return ONLY the raw HTML code. Do not wrap in markdown code blocks.
Start immediately with: <!DOCTYPE html>`;
}

/**
 * Build content parts array for Gemini API
 * User-uploaded content has HIGHEST PRIORITY
 */
function buildContentParts(parsedFile: ParsedFile, additionalInstructions?: string): any[] {
  const parts: any[] = [];

  // Main instruction - emphasize using uploaded content
  parts.push({
    text: `CREATE AN INTERACTIVE TRAINING MODULE FROM THIS UPLOADED CONTENT.
IMPORTANT: Use ONLY the content below. Do NOT add external information.
${additionalInstructions ? `\nADDITIONAL INSTRUCTIONS: ${additionalInstructions}\n` : ''}`
  });

  // Add extracted text content - CLEARLY MARKED AS PRIMARY SOURCE
  if (parsedFile.extractedContent.text) {
    parts.push({
      text: `\n========================================
PRIMARY SOURCE CONTENT (USE THIS DATA ONLY)
File: ${parsedFile.metadata.fileName}
========================================\n${parsedFile.extractedContent.text}\n========================================
END OF PRIMARY SOURCE
========================================\n`
    });
  }

  // Add all pages for multi-page PDFs
  if (parsedFile.extractedContent.pages && parsedFile.extractedContent.pages.length > 0) {
    parts.push({ text: `\n=== PDF DOCUMENT (${parsedFile.extractedContent.pages.length} pages) ===\n` });

    parsedFile.extractedContent.pages.forEach((page, i) => {
      parts.push({ text: `\n--- PAGE ${page.pageNumber} ---\n${page.text}\n` });

      // Add page image if available (limit to first 5 pages to avoid token limits)
      if (page.imageBase64 && i < 5) {
        parts.push({
          inlineData: {
            data: page.imageBase64,
            mimeType: 'image/png'
          }
        });
      }
    });

    parts.push({ text: `\n=== END PDF ===\n` });
  }

  // Add data tables (CSV/Excel) - PRIMARY SOURCE DATA
  if (parsedFile.extractedContent.data && parsedFile.extractedContent.data.length > 0) {
    const headers = Object.keys(parsedFile.extractedContent.data[0]);
    const rows = parsedFile.extractedContent.data.slice(0, 50); // Limit to 50 rows

    let tableText = `\n========================================
PRIMARY DATA TABLE (USE THIS DATA FOR TRAINING)
File: ${parsedFile.metadata.fileName}
========================================\n`;
    tableText += `Total Rows: ${parsedFile.metadata.rowCount}, Columns: ${headers.length}\n`;
    tableText += `Column Headers: ${headers.join(' | ')}\n\n`;
    tableText += `ACTUAL DATA FROM UPLOADED FILE:\n`;

    rows.forEach((row, i) => {
      tableText += `Row ${i + 1}: ${headers.map(h => `${h}="${row[h] || ''}"`).join(', ')}\n`;
    });

    if (parsedFile.extractedContent.data.length > 50) {
      tableText += `\n... plus ${parsedFile.extractedContent.data.length - 50} more rows in source\n`;
    }
    tableText += `\n========================================
END OF PRIMARY DATA
========================================\n`;

    parts.push({ text: tableText });
  }

  // Add video frames
  if (parsedFile.extractedContent.frames && parsedFile.extractedContent.frames.length > 0) {
    parts.push({
      text: `\n=== VIDEO CONTENT ===\nExtracted ${parsedFile.extractedContent.frames.length} key frames:\n`
    });

    parsedFile.extractedContent.frames.forEach((frame, i) => {
      parts.push({
        text: `\nFrame ${i + 1} at ${Math.round(frame.timestamp)} seconds:`
      });
      parts.push({
        inlineData: {
          data: frame.imageBase64,
          mimeType: 'image/jpeg'
        }
      });
    });

    parts.push({ text: `\n=== END VIDEO ===\n` });
  }

  // Add raw image for image files
  if (parsedFile.extractedContent.rawBase64 && parsedFile.type === 'image') {
    parts.push({ text: `\n=== IMAGE FILE ===\nAnalyze this image and create training content based on what you see:\n` });
    parts.push({
      inlineData: {
        data: parsedFile.extractedContent.rawBase64,
        mimeType: parsedFile.mimeType
      }
    });
    parts.push({ text: `\n=== END IMAGE ===\n` });
  }

  return parts;
}

/**
 * Clean response - remove markdown wrappers
 */
function cleanResponse(text: string): string {
  return text
    .replace(/^```html\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

// ============================================
// LEGACY FUNCTIONS (Backward Compatibility)
// ============================================

const LEGACY_SYSTEM_INSTRUCTION = `You are the AI Training Architect for "Roof-ER".
Your goal is to take user uploads—photos, scripts, or diagrams—and turn them into **Advanced Interactive Simulators**.

${ROOF_ER_KNOWLEDGE}

CORE DIRECTIVES FOR GENERATED APP:

1. **CONTENT ANALYSIS & CLASSIFICATION**:
   - **Scenario A: CONVERSATIONAL SCRIPT (High Priority)**:
     - *Trigger*: Text contains dialogue, "I say/You say", pitch scripts.
     - *Output*: Build a **"Roof-ER Field Simulator"**.
   - **Scenario B: VISUAL/DIAGRAM**:
     - *Trigger*: Photo of roof/hail/shingles.
     - *Output*: Build a **"Damage Detective"** app with clickable hotspots.
   - **Scenario C: INFO/MANUAL**:
     - *Trigger*: Lists, definitions, timelines.
     - *Output*: Build a **"Commission Tycoon"** quiz game.

2. **VISUAL STYLE**:
   - **Branding**: Roof-ER Red (#EF4444), White, Zinc.
   - **UI**: "HUD" style overlays for the Commission and Transcript.
   - **Assets**: NO external images (use placeholders or CSS generation).

RESPONSE FORMAT:
Return ONLY the raw HTML code. Do not wrap it in markdown. Start immediately with <!DOCTYPE html>.`;

/**
 * Legacy function - auto-classifies content and generates
 * @deprecated Use generateTraining() instead
 */
export async function bringToLife(
  prompt: string,
  fileBase64?: string,
  mimeType?: string
): Promise<string> {
  const parts: any[] = [];

  const finalPrompt = fileBase64
    ? `Analyze this file content.

       STEP 1: CLASSIFY.
       - Script/Dialogue? -> Build **Roof-ER Field Simulator**.
       - Visual/Roof? -> Build **Damage Detective**.
       - Info? -> Build **Commission Tycoon**.

       STEP 2: GENERATE THE SIMULATOR.
       - If Simulator: Include **Dynamic Weather** (CSS Rain if appropriate), **Commission Scoreboard** (Earn $$ for correct lines), and **Real-time Transcript Log**.
       - **Strict Keyword Logic**: Don't enforce exact sentences. Check for concepts (e.g. "Name", "Roof-ER", "Inspection").
       - **Visuals**: Realistic Door, interactive avatar.

       Ensure robust fallback logic (Skip buttons) so training never deadlocks.`
    : prompt || "Create a Roof-ER training simulator with a realistic door scene, commission tracking, and voice feedback.";

  parts.push({ text: finalPrompt });

  if (fileBase64 && mimeType) {
    parts.push({
      inlineData: {
        data: fileBase64,
        mimeType: mimeType,
      },
    });
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: { parts: parts },
      config: {
        systemInstruction: LEGACY_SYSTEM_INSTRUCTION,
        temperature: 0.5,
      },
    });

    let text = response.text || "<!-- Failed to generate content -->";
    return cleanResponse(text);
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
}

/**
 * Refine existing HTML with new instructions
 */
export async function refineApp(
  currentHtml: string,
  instruction: string,
  refineImageBase64?: string,
  refineImageMimeType?: string
): Promise<string> {
  const parts: any[] = [];

  const prompt = `
You are an expert Web Developer and Roof-ER Sales Coach.
I am providing the HTML of an existing training simulator.

USER INSTRUCTION: "${instruction}"

TRAINING CONTEXT (DO NOT LOSE THIS):
${ROOF_ER_KNOWLEDGE}

ENHANCEMENT CHECKLIST:
1. **Gamification**: Ensure the Commission/Money tracker works and persists (localStorage).
2. **Simulator Integrity**: Maintain the Atmosphere (Weather), Transcript Log, and Voice Integration. Do not remove them unless asked.
3. **Logic**: Ensure loose semantic matching (keywords) instead of exact strings.
4. **Visuals**: If adding realism, use CSS animations for the Door/Avatar.
5. **Self-Contained**: Keep all CSS and JS inline, no external dependencies.

CURRENT HTML:
${currentHtml}

OUTPUT:
Return ONLY the raw, updated HTML code. Start immediately with <!DOCTYPE html>.
`;

  parts.push({ text: prompt });

  if (refineImageBase64 && refineImageMimeType) {
    parts.push({
      inlineData: {
        data: refineImageBase64,
        mimeType: refineImageMimeType
      }
    });
  }

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: { parts: parts },
      config: {
        temperature: 0.4,
      },
    });

    let text = response.text || currentHtml;
    return cleanResponse(text);
  } catch (error) {
    console.error("Gemini Refinement Error:", error);
    throw error;
  }
}
