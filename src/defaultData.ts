import { MemberFirm, Question } from './types';

export const DEFAULT_MEMBER_FIRMS: MemberFirm[] = [
  { id: 'firm-1', name: 'Grant & Partners CPAs', country: 'United Kingdom' },
  { id: 'firm-2', name: 'Cabinet Laurent & Associés', country: 'France' },
  { id: 'firm-3', name: 'Müller & Kollegen WP', country: 'Germany' },
  { id: 'firm-4', name: 'Rossi & Moretti Commercialisti', country: 'Italy' },
  { id: 'firm-5', name: 'Atlas Tax & Legal SLP', country: 'Spain' },
  { id: 'firm-6', name: 'Vanderberg & Zonen Accountants', country: 'Netherlands' },
  { id: 'firm-7', name: 'Nordic Assurance Group AB', country: 'Sweden' },
  { id: 'firm-8', name: 'Helvetia Audit & Advisory AG', country: 'Switzerland' },
  { id: 'firm-9', name: 'Tokyo Horizon Advisory LLC', country: 'Japan' },
  { id: 'firm-10', name: 'Apex Chartered Accountants', country: 'Canada' },
  { id: 'firm-11', name: 'Beacon CPAs & Business Advisors', country: 'United States' },
  { id: 'firm-12', name: 'Sydney Harbour Advisory Group', country: 'Australia' },
  { id: 'firm-13', name: 'São Paulo Contabilidade & Perícias', country: 'Brazil' },
  { id: 'firm-14', name: 'Emirates Financial Advisory LLC', country: 'UAE' },
  { id: 'firm-15', name: 'Singa Tax & Corporate Services', country: 'Singapore' },
];

export const DEFAULT_QUESTIONS: Question[] = [
  {
    id: 'q-1',
    type: 'yes_no_abstain',
    title: 'Resolution 1: Approval of the Annual Audited Financial Statements & Executive Budget',
    description: 'Requires a standard majority (>50% of present voting member firms) to pass.',
    options: [
      { id: 'opt-yes', text: 'In Favor (Yes)' },
      { id: 'opt-no', text: 'Against (No)' },
      { id: 'opt-abstain', text: 'Abstain' },
    ],
    showResults: true,
  },
  {
    id: 'q-2',
    type: 'multiple_choice',
    title: 'Which strategic development priority should our international network prioritize in 2026/2027?',
    description: 'Each member firm may select their top priority for joint network investment.',
    options: [
      { id: 'opt-1', text: 'AI & Automated Audit Working Papers Platform' },
      { id: 'opt-2', text: 'ESG & Corporate Sustainability Reporting Framework' },
      { id: 'opt-3', text: 'Cross-Border Transfer Pricing & International Tax Desk' },
      { id: 'opt-4', text: 'Global Young Leaders Academy & Regional Exchange' },
    ],
    allowMultiple: false,
    showResults: true,
  },
  {
    id: 'q-3',
    type: 'scale',
    title: 'How prepared is your firm to comply with mandatory electronic invoicing and real-time reporting?',
    description: 'Rate your firm readiness from 1 (Not prepared at all) to 5 (Fully implemented).',
    scaleMin: 1,
    scaleMax: 5,
    scaleMinLabel: '1 - Just starting',
    scaleMaxLabel: '5 - Fully implemented',
    showResults: true,
  },
  {
    id: 'q-4',
    type: 'word_cloud',
    title: 'In 1 or 2 words, what is your member firm’s highest growth service area right now?',
    description: 'Enter your top practice area (e.g., Cyber Audit, M&A Advisory, R&D Credits).',
    showResults: true,
  },
  {
    id: 'q-5',
    type: 'open_ended',
    title: 'Open Floor: What should be the host city and central theme for the upcoming Annual Conference?',
    description: 'Share your delegation’s suggestions for the executive board review.',
    showResults: true,
  },
];
