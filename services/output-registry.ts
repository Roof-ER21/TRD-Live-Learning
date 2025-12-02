/**
 * Output Registry - Central definition of all training output types
 * Each output type has specific prompts and applicable input types
 */

import { OutputConfig, OutputType, SupportedFileType } from '../types';

export const OUTPUT_REGISTRY: Record<OutputType, OutputConfig> = {
  // ============================================
  // EXISTING OUTPUT TYPES
  // ============================================

  'field-simulator': {
    id: 'field-simulator',
    name: 'Field Simulator',
    description: 'Voice-enabled door-to-door roleplay training with real-time feedback',
    icon: 'microphone',
    applicableInputs: ['text', 'markdown', 'pdf'],
    promptFragment: `Build a **Roof-ER Field Simulator** with:

VISUAL SCENE:
- CSS-art realistic front door scene with house facade (brick/siding)
- Dynamic weather effects: If content mentions "storm", "hail", or "damage", add CSS rain/thunder animations
- Homeowner SVG avatar that reacts: eyebrows raise (confusion), smile (success), frown (objection)
- Glassmorphism HUD overlays (dark semi-transparent panels)

GAMIFICATION:
- Commission Tracker in top-right: "Potential Commission: $0"
- Award money for each successful step (+$250 opening, +$500 building rapport, +$1000 close)
- Save score to localStorage under 'roofER_commission'
- Patience Meter: Visual bar that decreases on bad answers or 10s silence
- After 2 failed attempts, show Coach popup with hint

VOICE INTEGRATION:
- Use window.speechSynthesis for Homeowner dialogue (select English voice)
- Use window.webkitSpeechRecognition for User input
- Show real-time transcript in scrolling log panel
- Pulse interface RED when actively listening
- Display "Listening..." indicator prominently

CONVERSATION ENGINE:
- Break script into small steps (one concept each)
- Loose keyword matching: requiredKeywords array per step
- Validation: if 40%+ keywords match, advance; else trigger soft objection
- Soft objections like "I'm busy..." require "quick" or "10 minutes" to save
- Include Skip button for each step (for testing/training)

DIFFICULTY:
- Toggle: "Rookie" (hints visible) vs "Pro" (no hints, faster patience decay)
- Randomize homeowner mood on load: Friendly, Skeptical, or Rushed

END SUMMARY (show when complete):
- Total commission earned
- Time taken for full conversation
- Conversation transcript log
- Mistakes made and correct responses
- Grade: A/B/C/D based on performance
- "Download Summary (PDF)" button using window.print()
- Include @media print styles for clean PDF output`
  },

  'damage-detective': {
    id: 'damage-detective',
    name: 'Damage Detective',
    description: 'Interactive damage identification with clickable hotspots',
    icon: 'magnifying-glass',
    applicableInputs: ['image', 'pdf'],
    promptFragment: `Build a **Damage Detective** training app with:

VISUAL DISPLAY:
- Full-screen image display with zoom capability (CSS transform on hover)
- Overlay grid pattern to help locate areas
- Magnifying glass cursor effect
- Dark theme background with image as focal point

HOTSPOT SYSTEM:
- Create 5-8 clickable hotspot regions based on image content
- Each hotspot: circular pulse animation when not found
- On correct click: Green checkmark, reveal damage type
- On wrong click: Red X, -25 points, brief explanation why
- Hotspots should cover: hail marks, wind damage, granule loss, soft metal damage

SCORING:
- Start with 0 points
- +100 for finding damage
- -25 for wrong clicks
- Bonus +50 for identifying damage TYPE correctly
- Track found/total in progress bar
- Save high score to localStorage

EDUCATIONAL POPUPS:
- On each correct find, show modal with:
  - Damage type name (Hail, Wind, Granule Loss)
  - Brief description
  - What to tell homeowner
  - "Got it!" dismiss button

COMPLETION:
- When all hotspots found, show summary report
- List all damage types found
- Suggested talking points for homeowner
- "Play Again" button to reset

END SUMMARY (show when complete):
- Final score and accuracy percentage
- Time taken to find all damage
- List of all damage types identified with descriptions
- Wrong clicks and what they actually were
- Key talking points for homeowner (based on findings)
- "Download Inspection Report (PDF)" button using window.print()
- Include @media print styles for professional report format`
  },

  'commission-tycoon': {
    id: 'commission-tycoon',
    name: 'Commission Tycoon',
    description: 'Quiz-based commission calculation and knowledge game',
    icon: 'currency-dollar',
    applicableInputs: ['text', 'markdown', 'csv', 'excel', 'pdf'],
    promptFragment: `Build a **Commission Tycoon** quiz game with:

GAME SETUP:
- Title screen with "Start Game" button
- Virtual wallet starting at $0
- Generate 10 questions from the uploaded content
- Questions should test: product knowledge, commission rates, pitch techniques

QUESTION FORMAT:
- Multiple choice: 4 options per question
- 30-second timer with visual countdown ring
- Money earned indicator: "$250 potential"
- Progress dots showing question number (1 of 10)

SCORING LOGIC:
- Correct answer: +$250 base
- Speed bonus: +$50 if answered in <10 seconds
- Streak bonus: 3 correct in a row = 2x next question
- Wrong answer: $0, show correct answer with explanation
- Track total earnings persistently in localStorage

VISUAL STYLE:
- Casino/game show aesthetic with neon accents
- Confetti animation on correct answers
- Screen shake on wrong answers
- Final "Winner!" screen with total earnings
- Compare to "Top Earners" leaderboard (localStorage)

END SUMMARY (show when complete):
- Total earnings with breakdown (base + speed bonus + streak bonus)
- Questions answered correctly vs incorrectly
- Time taken per question (average)
- List of wrong answers with correct answers
- Key facts to review (from missed questions)
- "Download Earnings Report (PDF)" button using window.print()
- Include @media print styles for certificate-style output`
  },

  // ============================================
  // NEW OUTPUT TYPES
  // ============================================

  'objection-arena': {
    id: 'objection-arena',
    name: 'Objection Battle Arena',
    description: 'Practice handling customer objections with scoring and timer',
    icon: 'shield',
    applicableInputs: ['text', 'markdown', 'pdf'],
    promptFragment: `Build an **Objection Battle Arena** training simulator with:

ARENA VISUALS:
- Dark arena-style background with dramatic spotlight on center
- Animated homeowner avatar (CSS-only) showing emotions:
  - Crossed arms (skeptical)
  - Hand up (stop/objection)
  - Nodding (convinced)
  - Smiling (won over)
- Battle HUD with health/points bar for trainee
- Particle effects on successful rebuttals

OBJECTION PRESENTATION:
- Extract objections from uploaded content OR use common ones:
  - "I'm not interested"
  - "My roof is new"
  - "I don't have time"
  - "I need to talk to my spouse"
  - "Insurance won't cover it"
  - "We already have a roofer"
- Present objection in speech bubble with typing animation
- Play dramatic sound cue (Web Audio API beep)

REBUTTAL SYSTEM:
- Show 4 rebuttal options as clickable cards
- Only 1 is best, 1 is acceptable, 2 are wrong
- 15-second countdown timer with visual ring
- If timer expires, auto-fail

SCORING:
- Best rebuttal: +100 points, "PERFECT!" animation
- Acceptable: +25 points, "Good try!"
- Wrong: -50 points, health bar decreases, show correct answer
- Track "Mastered" objections (3 consecutive correct)
- Save progress to localStorage

PROGRESSION:
- Start with easy objections, increase difficulty
- Show total objections mastered at end
- "Battle Again" to practice weak areas
- Victory screen when all objections mastered

END SUMMARY (show when complete):
- Total score and battle grade (S/A/B/C/D)
- Objections mastered vs needs practice
- Best rebuttal responses used
- Mistakes made with better alternatives
- Quick reference card of all objections + best rebuttals
- "Download Battle Report (PDF)" button using window.print()
- Include @media print styles for training record format`
  },

  'inspection-walkthrough': {
    id: 'inspection-walkthrough',
    name: 'Inspection Walkthrough',
    description: 'Step-by-step guided inspection checklist simulator',
    icon: 'clipboard-check',
    applicableInputs: ['image', 'pdf', 'text', 'markdown'],
    promptFragment: `Build an **Inspection Walkthrough** simulator with:

VISUAL LAYOUT:
- Split screen: Left = visual diagram, Right = checklist
- Progress bar at top showing completion percentage
- Current step highlighted with glow effect
- Timer showing total inspection time

STEP SYSTEM:
- Extract inspection steps from content OR use standard Roof-ER inspection:
  1. Approach & Introduction
  2. Perimeter Walk (gutters, downspouts)
  3. Soft Metal Check (vents, flashing)
  4. Ground Assessment (granules, debris)
  5. Ladder Setup & Safety
  6. Ridge Line Inspection
  7. Shingle Surface Check
  8. Valley & Flashing Inspection
  9. Documentation Photos
  10. Findings Summary

INTERACTION:
- Cannot skip steps (sequential progression)
- Each step has checkbox to mark complete
- "Tips" button shows contextual help for current step
- "What to look for" expandable section
- Simulated "Take Photo" button (shows camera icon animation)

CHECKLIST FEATURES:
- Sub-items under each main step
- Notes field for each step
- "Flag for follow-up" toggle
- Red/Yellow/Green status indicators

COMPLETION:
- Auto-generate summary report at end
- List all flagged items
- Total time taken
- "Download Report" button (creates text summary)
- Save completion to localStorage

END SUMMARY (show when complete):
- Inspection completion certificate
- Total time taken
- All steps completed with notes entered
- Flagged items requiring follow-up
- Findings summary with recommendations
- "Download Inspection Report (PDF)" button using window.print()
- Include @media print styles for professional inspection report format`
  },

  'flashcard-drill': {
    id: 'flashcard-drill',
    name: 'Flashcard Drill',
    description: 'Q&A flashcards with spaced repetition for memorization',
    icon: 'academic-cap',
    applicableInputs: ['text', 'markdown', 'csv', 'excel', 'pdf'],
    promptFragment: `Build a **Flashcard Drill** app with:

CARD DESIGN:
- 3D flip animation (CSS transform rotateY)
- Question on front (large text, centered)
- Answer on back (with explanation if available)
- Card number indicator (e.g., "Card 3 of 20")
- Category label in corner

INTERACTION:
- Click/tap card to flip
- Or press SPACE to flip
- After seeing answer, two buttons:
  - "Got it!" (green) - card mastered
  - "Need Practice" (orange) - card returns to deck sooner

SPACED REPETITION:
- Cards marked "Need Practice" appear again after 3 other cards
- "Got it" cards move to end of deck
- Track mastery per card in localStorage
- Show mastery percentage per category

NAVIGATION:
- Arrow keys or swipe for next/previous
- Progress bar showing position in deck
- "Shuffle" button to randomize order
- Category tabs if content has sections

STATISTICS:
- Session stats: cards reviewed, accuracy rate
- "Weak areas" highlight cards failed 2+ times
- Streak counter for consecutive correct
- Best streak saved to localStorage

VISUAL POLISH:
- Smooth card transitions
- Subtle shadow and depth effects
- Green glow on mastered cards
- Celebration animation on 100% mastery

END SUMMARY (show when complete):
- Total cards mastered vs needs review
- Session time and cards per minute
- Accuracy rate by category
- List of "weak" cards that need more practice
- All Q&A pairs for reference
- "Download Study Guide (PDF)" button using window.print()
- Include @media print styles for flashcard study sheet format`
  },

  'interactive-timeline': {
    id: 'interactive-timeline',
    name: 'Interactive Timeline',
    description: 'Clickable process and sequence explorer',
    icon: 'arrow-path',
    applicableInputs: ['text', 'markdown', 'pdf', 'csv'],
    promptFragment: `Build an **Interactive Timeline** with:

TIMELINE LAYOUT:
- Horizontal scrolling timeline with CSS scroll-snap
- Nodes connected by animated line (pulse effect)
- Current position indicator
- Overview mini-map at bottom showing full timeline

NODE DESIGN:
- Circular nodes with icons or numbers
- Node states: locked, available, completed
- Hover preview shows title
- Click to expand full content
- Glow effect on current/selected node

CONTENT PANEL:
- Slides in from right on node click
- Title, description, key points
- Related tips or warnings
- "Mark Complete" checkbox
- "Next Step" button

PROCESS STAGES (extract from content or use):
- Sales Process: Lead → Contact → Pitch → Inspect → Sign → Install → Close
- Inspection Process: Arrive → Introduce → Perimeter → Roof → Document → Present
- Claim Process: File → Adjuster → Approval → Materials → Schedule → Complete

QUIZ MODE:
- Toggle "Quiz Mode" button
- Hides node labels
- "What comes next?" prompt
- Drag to reorder or click to select
- Score based on correct sequence

FEATURES:
- Keyboard navigation (left/right arrows)
- Touch swipe support
- Progress saves to localStorage
- Reset button to start over
- Export timeline as text summary

END SUMMARY (show when complete):
- Timeline completion status
- Time spent exploring each stage
- Quiz mode score (if used)
- Full process overview with all stages
- Key points from each stage
- "Download Process Guide (PDF)" button using window.print()
- Include @media print styles for process documentation format`
  },

  // ============================================
  // NEW OUTPUT TYPES (9 and 10)
  // ============================================

  'scenario-builder': {
    id: 'scenario-builder',
    name: 'Scenario Builder',
    description: 'Create branching "choose your path" scenarios with multiple outcomes',
    icon: 'puzzle-piece',
    applicableInputs: ['text', 'markdown', 'pdf', 'csv'],
    promptFragment: `Build a **Scenario Builder** interactive training with:

SCENARIO STRUCTURE:
- Start screen with scenario title and context
- Branching decision tree: each choice leads to different outcomes
- Extract scenarios from content OR create realistic sales situations
- Minimum 3 decision points, each with 2-4 options
- Different endings based on choices made (Success, Partial Success, Need Improvement)

VISUAL DESIGN:
- Story card style with dramatic scene descriptions
- Character portraits using CSS art (homeowner, manager, team member)
- Choice buttons with hover effects and consequence hints
- Progress indicator showing path taken
- Background changes based on scenario mood (sunny=success, cloudy=uncertain)

GAMIFICATION:
- Score tracking: +100 for optimal choices, +50 for acceptable, -25 for poor
- Time pressure option: 30 second decision timer (toggleable)
- Achievement badges: "Quick Thinker", "Diplomat", "Closer"
- Track best path and score in localStorage

SCENARIOS TO INCLUDE (extract from content or use):
- "The Hesitant Homeowner" - overcome objections
- "The Busy Professional" - get commitment despite time constraints
- "The Price Shopper" - demonstrate value over cost
- "The Skeptical Spouse" - win over the decision maker

FEEDBACK:
- After each choice, show brief explanation why it was good/bad
- End screen with full path review and improvement tips
- "Try Again" button to explore different paths
- Share score feature (copy to clipboard)

END SUMMARY (show when complete):
- Final outcome achieved (Success/Partial/Needs Improvement)
- Total score and decision grade
- Path taken with all choices made
- Analysis of each decision (good/bad/why)
- Achievements earned
- "Download Scenario Report (PDF)" button using window.print()
- Include @media print styles for decision analysis format`
  },

  'pitch-perfector': {
    id: 'pitch-perfector',
    name: 'Pitch Perfector',
    description: 'Practice and score your sales pitch with real-time feedback',
    icon: 'presentation-chart',
    applicableInputs: ['text', 'markdown', 'pdf'],
    promptFragment: `Build a **Pitch Perfector** training app with:

PITCH STAGES:
- Break the pitch into 5-7 key segments from the content
- Each segment has: target script, key points to hit, time goal
- Segments: Introduction, Hook, Value Prop, Social Proof, Close, Objection Handle

PRACTICE MODE:
- Display current segment's key points as bullet checklist
- Timer showing elapsed time vs target time
- Real-time voice transcription using webkitSpeechRecognition
- Live keyword detection: highlight words as you say them
- Confidence meter based on pace and keyword coverage

SCORING SYSTEM:
- Keyword coverage: % of key terms mentioned (0-100)
- Pacing score: how close to target time (penalty for too fast/slow)
- Completeness: all key points covered?
- Overall grade: A/B/C/D/F with specific feedback
- Track improvement over sessions in localStorage

VISUAL FEEDBACK:
- Teleprompter-style scrolling script (optional hint mode)
- Color-coded progress: green (on track), yellow (lagging), red (off track)
- Applause animation on A-grade performance
- Waveform visualizer when speaking

PRACTICE FEATURES:
- "Slow Motion" mode: extra time, more hints
- "Speed Run" mode: beat the clock challenge
- Record and playback (using MediaRecorder API if available)
- Side-by-side comparison: your version vs ideal script
- Focus mode: practice just one segment repeatedly

LEADERBOARD:
- Personal best scores per segment
- Overall pitch score history graph
- Streak counter for daily practice
- Milestone badges: "100 Pitches", "Perfect Score", "Speed Demon"

END SUMMARY (show when complete):
- Overall pitch grade (A/B/C/D/F)
- Score breakdown by segment
- Keywords hit vs missed
- Pacing analysis (too fast/slow/perfect)
- Transcript of your pitch attempt
- Comparison to ideal pitch (side by side)
- Areas for improvement with tips
- "Download Pitch Report (PDF)" button using window.print()
- Include @media print styles for performance review format`
  },

  'auto': {
    id: 'auto',
    name: 'Auto-Select (AI Recommended)',
    description: 'Let AI analyze your content and choose the best training type',
    icon: 'sparkles',
    applicableInputs: ['image', 'pdf', 'csv', 'excel', 'text', 'markdown', 'video'],
    promptFragment: '' // Not used - auto-select uses analysis function
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all output types applicable for a given file type
 * Excludes 'auto' as it's handled separately in the UI
 */
export function getApplicableOutputs(fileType: SupportedFileType): OutputConfig[] {
  return Object.values(OUTPUT_REGISTRY).filter(
    config => config.id !== 'auto' && config.applicableInputs.includes(fileType)
  );
}

/**
 * Get a specific output configuration by ID
 */
export function getOutputConfig(outputType: OutputType): OutputConfig {
  return OUTPUT_REGISTRY[outputType];
}

/**
 * Get all output types as an array
 */
export function getAllOutputTypes(): OutputConfig[] {
  return Object.values(OUTPUT_REGISTRY);
}

/**
 * Check if an output type is applicable for a file type
 */
export function isOutputApplicable(outputType: OutputType, fileType: SupportedFileType): boolean {
  return OUTPUT_REGISTRY[outputType].applicableInputs.includes(fileType);
}
