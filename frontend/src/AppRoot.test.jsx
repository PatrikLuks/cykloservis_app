import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App.jsx';

describe('App root', () => {
  it('mounts without crash', () => {
    const { container } = render(<App />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders test marker in test env routing mode', () => {
    render(<App />);
    expect(screen.getByTestId('app-root-test')).toBeInTheDocument();
  });
});
