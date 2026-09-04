import React, { useState } from 'react';
import { Question, QuestionType, PollRoom } from '../types';
import {
  X,
  Plus,
  Trash2,
  Settings2,
  FileQuestion,
  RotateCcw,
  Download,
  Check,
} from 'lucide-react';

interface PollBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: PollRoom;
  onUpdateQuestions: (questions: Question[]) => void;
  onResetVotes: () => void;
  onExportCSV: () => void;
}

export const PollBuilderModal: React.FC<PollBuilderModalProps> = ({
  isOpen,
  onClose,
  room,
  onUpdateQuestions,
  onResetVotes,
  onExportCSV,
}) => {
  const [questions, setQuestions] = useState<Question[]>(room.questions);
  const [activeTab, setActiveTab] = useState<'questions' | 'new' | 'settings'>('questions');

  // New question form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<QuestionType>('multiple_choice');
  const [newOptions, setNewOptions] = useState<string[]>(['Option A', 'Option B', 'Option C']);
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleAddOptionField = () => {
    setNewOptions([...newOptions, `Option ${String.fromCharCode(65 + newOptions.length)}`]);
  };

  const handleRemoveOptionField = (idx: number) => {
    setNewOptions(newOptions.filter((_, i) => i !== idx));
  };

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...newOptions];
    updated[idx] = val;
    setNewOptions(updated);
  };

  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newQ: Question = {
      id: `q-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      type: newType,
      showResults: true,
    };

    if (newType === 'multiple_choice') {
      newQ.options = newOptions.filter(o => o.trim().length > 0).map((txt, i) => ({
        id: `opt-${Date.now()}-${i}`,
        text: txt.trim(),
      }));
    } else if (newType === 'yes_no_abstain') {
      newQ.options = [
        { id: 'opt-yes', text: 'In Favor (Yes)' },
        { id: 'opt-no', text: 'Against (No)' },
        { id: 'opt-abstain', text: 'Abstain' },
      ];
    } else if (newType === 'scale') {
      newQ.scaleMin = 1;
      newQ.scaleMax = 5;
      newQ.scaleMinLabel = '1 - Low';
      newQ.scaleMaxLabel = '5 - High';
    }

    const updated = [...questions, newQ];
    setQuestions(updated);
    onUpdateQuestions(updated);

    // Reset form
    setNewTitle('');
    setNewDesc('');
    setNewOptions(['Option A', 'Option B', 'Option C']);
    setActiveTab('questions');
    triggerSaved();
  };

  const handleDeleteQuestion = (id: string) => {
    if (questions.length <= 1) {
      alert('A voting session requires at least one question.');
      return;
    }
    const updated = questions.filter(q => q.id !== id);
    setQuestions(updated);
    onUpdateQuestions(updated);
    triggerSaved();
  };

  const triggerSaved = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  return (
    <div
      id="poll-builder-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="poll-builder-modal-container"
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Poll Builder & Session Controls</h3>
              <p className="text-xs text-slate-500">
                Manage questions, options, voting resolutions and session data
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50/70 px-6 py-2">
          <button
            onClick={() => setActiveTab('questions')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'questions'
                ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Questions ({questions.length})
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'new'
                ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add New Question</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === 'settings'
                ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Data & Export
          </button>

          {savedNotice && (
            <span className="ml-auto flex items-center gap-1 text-xs font-medium text-emerald-600 animate-fade-in">
              <Check className="h-3.5 w-3.5" /> Saved
            </span>
          )}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* TAB 1: Questions List */}
          {activeTab === 'questions' && (
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-slate-300 transition"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-700">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          {q.type.replace(/_/g, ' ')}
                        </span>
                        {q.options && (
                          <span className="text-xs text-slate-400">
                            {q.options.length} options
                          </span>
                        )}
                      </div>
                      <h4 className="mt-1 text-sm font-semibold text-slate-900">{q.title}</h4>
                      {q.description && (
                        <p className="mt-0.5 text-xs text-slate-500">{q.description}</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                    title="Delete question"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: Add New Question */}
          {activeTab === 'new' && (
            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Question Type
                </label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as QuestionType)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="multiple_choice">Multiple Choice (Single or Multi)</option>
                  <option value="yes_no_abstain">Formal Resolution (In Favor / Against / Abstain)</option>
                  <option value="scale">Rating Scale (1 to 5)</option>
                  <option value="word_cloud">Word Cloud</option>
                  <option value="open_ended">Open Ended Discussion / Q&A</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Question Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Resolution 2: Approval of 2027 Host City"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Context / Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Additional guidance, voting quorum threshold, or notes..."
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Options for multiple choice */}
              {newType === 'multiple_choice' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Options
                  </label>
                  {newOptions.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}.</span>
                      <input
                        type="text"
                        value={opt}
                        onChange={e => handleOptionChange(idx, e.target.value)}
                        className="flex-1 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-hidden"
                      />
                      {newOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionField(idx)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddOptionField}
                    className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Option
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
              >
                Create Question
              </button>
            </form>
          )}

          {/* TAB 3: Session Data & Export */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <h4 className="text-sm font-bold text-slate-900">Official Assembly Voting Report</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Export complete roll-call voting record as CSV for assembly minutes and compliance.
                </p>
                <button
                  onClick={onExportCSV}
                  className="mt-3 flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Voting Audit Trail (CSV)</span>
                </button>
              </div>

              <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
                <h4 className="text-sm font-bold text-rose-900">Reset Session Votes</h4>
                <p className="mt-1 text-xs text-rose-700">
                  Clears all votes submitted across all questions in this session. Member firm roster is preserved.
                </p>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear all cast votes?')) {
                      onResetVotes();
                      triggerSaved();
                    }
                  }}
                  className="mt-3 flex items-center gap-2 rounded-xl border border-rose-300 bg-white px-4 py-2 text-xs font-semibold text-rose-700 shadow-2xs hover:bg-rose-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Clear All Votes</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
