
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

const fetchSubmissions = async (id) => {
  const res = await fetch(`/api/forms/${id}/submissions`);
  if (!res.ok) {
    throw new Error('Network response was not ok');
  }
  return res.json();
};

export const SubmissionsViewer = () => {
  const { id } = useParams();

  const { data: submissions, isLoading, error } = useQuery(['submissions', id], () => fetchSubmissions(id));

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>An error has occurred: {error.message}</div>;

  return (
    <div>
      <h2>Form Submissions</h2>
      {submissions.map((submission) => (
        <div key={submission.id}>
          <p>Submitted at: {new Date(submission.submittedAt).toLocaleString()}</p>
          <ul>
            {submission.answers.map((answer) => (
              <li key={answer.id}>
                <strong>{answer.question.label}:</strong> {answer.value}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};