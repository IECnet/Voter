export type QuestionType =
  | 'multiple_choice'
  | 'yes_no_abstain'
  | 'scale'
  | 'word_cloud'
  | 'open_ended';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  options?: QuestionOption[];
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  allowMultiple?: boolean;
  isLocked?: boolean;
  showResults?: boolean;
}

export interface MemberFirm {
  id: string;
  name: string;
  country?: string;
  delegateName?: string;
  claimedBySessionId?: string;
  claimedAt?: number;
}

export interface Vote {
  id: string;
  questionId: string;
  memberFirmId: string;
  memberFirmName: string;
  delegateName?: string;
  sessionId: string;
  value: string | string[] | number;
  timestamp: number;
}

export interface PollRoom {
  id: string;
  title: string;
  code: string;
  currentQuestionIndex: number;
  questions: Question[];
  memberFirms: MemberFirm[];
  votes: Vote[];
  createdAt: number;
  votingLocked: boolean;
  resultsVisible: boolean;
}

export interface RoomSummary {
  id: string;
  title: string;
  code: string;
  totalFirms: number;
  claimedFirms: number;
  totalVotes: number;
  questionsCount: number;
}

export interface ParticipantSession {
  sessionId: string;
  memberFirmId?: string;
  memberFirmName?: string;
  delegateName?: string;
}
