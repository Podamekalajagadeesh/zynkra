
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

const fetchForm = async (id) => {
  const res = await fetch(`/api/forms/${id}`);
  if (!res.ok) {
    throw new Error('Network response was not ok');
  }
  return res.json();
};

const submitForm = async ({ id, answers }) => {
  const res = await fetch(`/api/forms/${id}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) {
    throw new Error('Network response was not ok');
  }
  return res.json();
};

export const InstantForm = () => {
  const { id } = useParams();
  const [answers, setAnswers] = useState({});

  const { data: form, isLoading, error } = useQuery(['form', id], () => fetchForm(id));

  const mutation = useMutation({
    mutationFn: submitForm,
    onSuccess: () => {
      // Show a success message
    },
  });

  const handleAnswerChange = (questionId, value) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submissionData = {
      id,
      answers: Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        value,
      })),
    };
    mutation.mutate(submissionData);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>An error has occurred: {error.message}</div>;

  return (
    <form onSubmit={handleSubmit}>
      <h2>{form.title}</h2>
      <p>{form.description}</p>

      {form.questions.map((q) => (
        <div key={q.id}>
          <label>{q.label}</label>
          <input
            type="text" // This should be dynamic based on q.type
            onChange={(e) => handleAnswerChange(q.id, e.target.value)}
            required
          />
        </div>
      ))}

      <button type="submit" disabled={mutation.isLoading}>
        {mutation.isLoading ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  );
};