import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithRouter } from '../../testUtils/renderWithRouter';
import MultiStepRegister from '../MultiStepRegister.jsx';

vi.mock('../../utils/apiClient', () => ({
  default: {
    post: vi.fn(async (url, body) => {
      if (url === '/auth/register') return { data: { ok: true } };
      if (url === '/auth/save-password') return { data: { ok: true } };
      if (url === '/auth/verify-code') {
        if (body.code === '123456') return { data: { ok: true } };
        throw { response: { data: { message: 'Bad code' } } };
      }
      return { data: {} };
    })
  }
}));
vi.mock('../RegisterNavbar.jsx', () => ({ default: () => <nav /> }));
vi.mock('../MultiStepRegister.css', () => ({}), { virtual: true });

import api from '../../utils/apiClient';

describe('MultiStepRegister – krok kódu', () => {
  beforeEach(() => vi.clearAllMocks());

  const goToCodeStep = async () => {
  renderWithRouter(<MultiStepRegister />);
    // email
    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Pokračovat/i }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/auth/register', { email: 'user@example.com' }));
    // password
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'Aa1!tesX' } });
    fireEvent.click(screen.getByTestId('password-submit'));
    await waitFor(() => expect(screen.getByTestId('code-step')).toBeInTheDocument());
  };

  it('resend tlačítko má cooldown', async () => {
    await goToCodeStep();
    const resend = screen.getByTestId('resend-btn');
    expect(resend).toBeDisabled(); // inicializováno cooldownem 30s
  });

  it('chybný kód zobrazí message a správný projde na další krok (PROFILE placeholder)', async () => {
    await goToCodeStep();
    // vyplnit 6 číslic špatně
    const digits = '000000'.split('');
    digits.forEach((d, i) => {
      fireEvent.change(screen.getByTestId(`code-digit-${i}`), { target: { value: d } });
    });
    fireEvent.click(screen.getByTestId('code-submit'));
    await waitFor(() => {
      const errs = screen.getAllByText(/Nesprávný ověřovací kód/i);
      expect(errs.length).toBe(1);
    });

    // Opravit kód
    '123456'.split('').forEach((d, i) => {
      fireEvent.change(screen.getByTestId(`code-digit-${i}`), { target: { value: d } });
    });
    fireEvent.click(screen.getByTestId('code-submit'));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/auth/verify-code', { email: 'user@example.com', code: '123456' }));
    // Po ověření krok PROFILE (ještě není implementován) => zatím kontrola, že nezůstal error
    expect(screen.queryByText(/Nesprávný ověřovací kód/i)).not.toBeInTheDocument();
  });
});
