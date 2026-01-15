import { Speaker } from "./types";

export const INITIAL_SPEAKERS: [Speaker, Speaker] = [
  { id: 'speaker_1', name: '', language: 'English' },
  { id: 'speaker_2', name: '', language: 'Spanish' },
];

export const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-12-2025';

export const SAMPLE_RATE_INPUT = 16000;
export const SAMPLE_RATE_OUTPUT = 24000;

export const AUTOMOTIVE_GLOSSARY = `
CRITICAL AUTOMOTIVE GLOSSARY & TRANSLATION RULES:
Use "Concept Mapping" to translate the meaning, not the literal words.

1. Dealership Operations:
- "Up" -> New Prospective Customer
- "Be-Back" -> Returning Potential Buyer
- "T.O." / "Turn Over" -> Manager Intervention / Hand-off
- "Demo" -> Test Drive / Vehicle Showcase
- "Desk" / "Tower" -> Sales Management Desk
- "Four-Square" -> Negotiation Worksheet
- "Switch" -> Change of Vehicle Selection
- "Bird Dog" -> Referral Source
- "One-Legger" -> Solo Buyer (decision cannot be made today)

2. Finance & Insurance (F&I):
- "Money Factor" -> Lease Interest Rate (Distinct from APR)
- "Residual Value" -> Future Resale Value
- "Negative Equity" / "Upside Down" -> Debt exceeding value
- "Buried" -> Deep Negative Equity
- "Buy Rate" -> Dealer's Wholesale Interest Rate
- "Spread" / "Reserve" -> Finance Commission / Rate Markup
- "Straw Purchase" -> Fraudulent Third-Party Purchase
- "Spot Delivery" -> Conditional Delivery / Pending Finance Approval
- "Gap Insurance" -> Total Loss Shortfall Insurance
- "TT&L" -> Registration Fees and Taxes

3. Vehicle Condition:
- "CPO" -> Manufacturer Certified Used Car
- "Program Car" -> Ex-Fleet / Ex-Rental Vehicle
- "Lemon" -> Defective Vehicle
- "Clean Title" -> Accident-Free History
- "Salvage Title" -> Damaged/Rebuilt History
- "Trim Level" -> Equipment Grade / Model Variant

4. Slang / Deal Killers (Translate Intent):
- "We are miles apart" -> "Our price expectations are very different"
- "Sharpen your pencil" -> "Give me a better price"
- "What's the damage?" -> "What is the final price?"
- "Kicking tires" -> "Just looking / Not ready to buy"
`;
