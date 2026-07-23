
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
// Mirrors server/src/forms/entities/question.entity.ts
enum QuestionType {
  SHORT_TEXT = 'SHORT_TEXT',
  EMAIL = 'EMAIL',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  PHONE_NUMBER = 'PHONE_NUMBER',
}
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

interface FormQuestion {
  label: string;
  type: QuestionType;
  options: string[];
}

const createForm = async (formData: unknown) => {
  const res = await fetch('/api/forms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });
  if (!res.ok) {
    throw new Error('Network response was not ok');
  }
  return res.json();
};

export const FormBuilder = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const { activeAccount } = useAuth();
  const { addToast } = useToast();

  const mutation = useMutation({
    mutationFn: createForm,
    onSuccess: () => {
      // Invalidate and refetch
      addToast('Form created successfully!', 'success');
      setTitle('');
      setDescription('');
      setQuestions([]);
    },
    onError: () => {
      addToast('Failed to create form. Please try again.', 'error');
    }
  });

  const addQuestion = () => {
    setQuestions([...questions, { label: '', type: QuestionType.SHORT_TEXT, options: [] }]);
  };

  const handleQuestionChange = (index: number, field: keyof FormQuestion, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAccount?.user?.id) {
      addToast('You must be logged in to create a form', 'error');
      return;
    }
    const formData = { name: title, title, description, ownerId: activeAccount.user.id, questions };
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create a new Form</h2>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Form Title"
        required
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Form Description"
      />

      {questions.map((q, i) => (
        <div key={i}>
          <input
            type="text"
            value={q.label}
            onChange={(e) => handleQuestionChange(i, 'label', e.target.value)}
            placeholder="Question Label"
          />
          <select
            value={q.type}
            onChange={(e) => handleQuestionChange(i, 'type', e.target.value)}
          >
            {Object.values(QuestionType).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      ))}

      <button type="button" onClick={addQuestion}>
        Add Question
      </button>
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? 'Saving...' : 'Save Form'}
      </button>
    </form>
  );
};