import { PrivateInstitution } from "@/types/privateInstitution";
import { PRIVATE_GROUP_1 } from "./data/group1";
import { PRIVATE_GROUP_2 } from "./data/group2";
import { PRIVATE_GROUP_3 } from "./data/group3";
import { PRIVATE_GROUP_4 } from "./data/group4";
import { PRIVATE_GROUP_5 } from "./data/group5";
import { PRIVATE_GROUP_6 } from "./data/group6";
import { PRIVATE_GROUP_7 } from "./data/group7";
import { PRIVATE_GROUP_8 } from "./data/group8";
import { PRIVATE_GROUP_9 } from "./data/group9";
import { PRIVATE_GROUP_10 } from "./data/group10";

export const PRIVATE_INSTITUTIONS: PrivateInstitution[] = [
  ...PRIVATE_GROUP_1,
  ...PRIVATE_GROUP_2,
  ...PRIVATE_GROUP_3,
  ...PRIVATE_GROUP_4,
  ...PRIVATE_GROUP_5,
  ...PRIVATE_GROUP_6,
  ...PRIVATE_GROUP_7,
  ...PRIVATE_GROUP_8,
  ...PRIVATE_GROUP_9,
  ...PRIVATE_GROUP_10,
];

const enhanceProgram = (program: any, institution: PrivateInstitution) => {
  const enriched = { ...program } as any;
  // Ensure description
  if (!enriched.description) {
    enriched.description = `${enriched.name} at ${institution.name} is a ${enriched.type ? enriched.type.replace(/-/g,' ') : 'program'}${enriched.duration ? ` that runs for ${enriched.duration}` : ''}${enriched.credits ? ` and awards ${enriched.credits} credits` : ''}${enriched.nqfLevel ? ` at NQF level ${enriched.nqfLevel}` : ''}.`;
  }
  // Ensure faculty: attempt to infer from program.name or type
  if (!enriched.faculty) {
    if (enriched.name && /business|commerce|account/i.test(enriched.name)) enriched.faculty = 'Business & Commerce';
    else if (enriched.name && /engineer|engineering|civil|mechanical|electrical|electronic/i.test(enriched.name)) enriched.faculty = 'Engineering';
    else if (enriched.name && /nurs|health|medical|pharm/i.test(enriched.name)) enriched.faculty = 'Health Sciences';
    else if (enriched.type === 'short-course') enriched.faculty = 'Short Courses';
    else enriched.faculty = undefined;
  }
  // Provide a website fallback to institution contact website
  if (!enriched.website && institution.contact?.website) enriched.website = institution.contact.website;
  // Default career prospects based on type
  if (!enriched.careerProspects || enriched.careerProspects.length === 0) {
    const prospects: string[] = [];
    if (/(engineer|engineering)/i.test(enriched.name || '')) prospects.push('Engineering roles in industry and construction');
    if (/(business|commerce|account|finance|management)/i.test(enriched.name || '')) prospects.push('Roles in business, finance and management');
    if (/(nurs|health|clinical|pharm|medical)/i.test(enriched.name || '')) prospects.push('Clinical and allied health professions');
    if (prospects.length === 0) prospects.push('Graduates may pursue professional or technical roles related to the field');
    enriched.careerProspects = prospects;
  }
  // Ensure subjects array shape if missing
  if (!enriched.subjects) enriched.subjects = [];
  // Requirements placeholder if not present: leave undefined per instruction
  return enriched as Program;
};

export const getPrivateInstitutionById = (id: string): PrivateInstitution | null => {
  const found = PRIVATE_INSTITUTIONS.find((i) => i.id === id) || null;
  if (!found) return null;
  // Return a deep clone with enriched programs so we don't mutate originals
  const institution: PrivateInstitution = {
    ...found,
    programs: (found.programs || []).map((p) => enhanceProgram(p, found)),
  };
  return institution;
};
