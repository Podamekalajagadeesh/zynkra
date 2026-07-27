import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Poll } from './poll';

describe('Poll component', () => {
  it('renders the poll question', () => {
    render(<Poll question="Fav color?" options={['Red', 'Blue']} />);
    expect(screen.getByText('Fav color?')).toBeInTheDocument();
  });

  it('renders all options as buttons', () => {
    render(<Poll question="Pick one" options={['A', 'B', 'C']} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toHaveTextContent('A');
    expect(buttons[1]).toHaveTextContent('B');
    expect(buttons[2]).toHaveTextContent('C');
  });

  it('renders a single option', () => {
    render(<Poll question="Only choice?" options={['Only one']} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveTextContent('Only one');
  });

  it('renders empty options without crashing', () => {
    render(<Poll question="No options?" options={[]} />);
    expect(screen.getByText('No options?')).toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
