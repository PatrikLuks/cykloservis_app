import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithRouter } from '../../testUtils/renderWithRouter';
import MultiStepRegister from '../MultiStepRegister.jsx';

vi.mock('../../utils/apiClient', () => ({
  default: {
    post: vi.fn(async (url, body) => {
      if (url === '/auth/register') return { data: { ok: true } };
      if (url === '/auth/save-password') return { data: { ok: true } };
      if (url === '/auth/verify-code') return { data: { ok: true } };
      if (url === '/auth/complete-profile') return { data: { ok: true } };
      return { data: {} };
    })
  }
}));
vi.mock('../RegisterNavbar.jsx', () => ({ default: () => <nav /> }));
vi.mock('../MultiStepRegister.css', () => ({}), { virtual: true });
// Mock useNavigate, abychom mohli ověřit redirect po dokončení profilu
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (orig) => {
  const actual = await orig();
  return { ...actual, useNavigate: () => mockNavigate };
});

import api from '../../utils/apiClient';

describe('MultiStepRegister – profile krok', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  const goToProfile = async () => {
  renderWithRouter(<MultiStepRegister />);
    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Pokračovat/i }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/auth/register', { email: 'user@example.com' }));
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'Aa1!tesX' } });
    fireEvent.click(screen.getByTestId('password-submit'));
    await waitFor(() => expect(screen.getByTestId('code-step')).toBeInTheDocument());
    '123456'.split('').forEach((d, i) => fireEvent.change(screen.getByTestId(`code-digit-${i}`), { target: { value: d } }));
    fireEvent.click(screen.getByTestId('code-submit'));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/auth/verify-code', { email: 'user@example.com', code: '123456' }));
    await waitFor(() => expect(screen.getByTestId('profile-step')).toBeInTheDocument());
  };

  it('validuje povinná pole a odešle profil', async () => {
    await goToProfile();
    const submit = screen.getByTestId('profile-submit');
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Jméno/i), { target: { value: 'Jan' } });
    fireEvent.change(screen.getByLabelText(/Příjmení/i), { target: { value: 'Novák' } });
    fireEvent.change(screen.getByLabelText(/Datum narození/i), { target: { value: '1990-01-01' } });
    fireEvent.change(screen.getByLabelText(/Pohlaví/i), { target: { value: 'male' } });
    fireEvent.change(screen.getByLabelText(/Lokalita/i), { target: { value: 'Praha' } });
    expect(submit).not.toBeDisabled();
    fireEvent.click(submit);
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/auth/complete-profile', expect.objectContaining({ email: 'user@example.com', firstName: 'Jan', lastName: 'Novák' })));
  expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});
