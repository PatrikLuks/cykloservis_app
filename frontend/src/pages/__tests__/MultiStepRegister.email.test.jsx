import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithRouter } from '../../testUtils/renderWithRouter';
import MultiStepRegister from '../MultiStepRegister.jsx';

// Mock api client
vi.mock('../../utils/apiClient', () => ({
  default: {
    post: vi.fn(async () => ({ data: { ok: true } }))
  }
}));

// Mock RegisterNavbar to keep test lightweight
vi.mock('../RegisterNavbar.jsx', () => ({
  default: () => <nav data-testid="mock-navbar" />
}));

// Silence CSS import (Vite handles, but ensure test resilience)
vi.mock('../MultiStepRegister.css', () => ({}), { virtual: true });

import api from '../../utils/apiClient';

describe('MultiStepRegister – krok email', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validuje špatný email a nezavolá API', async () => {
  renderWithRouter(<MultiStepRegister />);
    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: 'neco-spatne' } });
    fireEvent.click(screen.getByRole('button', { name: /Pokračovat/i }));
    expect(await screen.findByText(/platnou e-mailovou adresu/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('po zadání platného emailu zavolá API a přejde na placeholder dalšího kroku', async () => {
  renderWithRouter(<MultiStepRegister />);
    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Pokračovat/i }));

  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/auth/register', { email: 'test@example.com' }));
  expect(screen.getByTestId('password-step')).toBeInTheDocument();
  });
});
