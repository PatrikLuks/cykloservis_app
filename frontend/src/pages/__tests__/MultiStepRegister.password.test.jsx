import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithRouter } from '../../testUtils/renderWithRouter';
import MultiStepRegister from '../MultiStepRegister.jsx';

// Mocks
vi.mock('../../utils/apiClient', () => ({
  default: {
    post: vi.fn(async (url, body) => {
      if (url === '/auth/register') return { data: { ok: true } };
      if (url === '/auth/save-password') return { data: { ok: true } };
      return { data: {} };
    })
  }
}));
vi.mock('../RegisterNavbar.jsx', () => ({ default: () => <nav /> }));
vi.mock('../MultiStepRegister.css', () => ({}), { virtual: true });

import api from '../../utils/apiClient';

describe('MultiStepRegister – krok hesla', () => {
  beforeEach(() => vi.clearAllMocks());

  const goToPasswordStep = async () => {
  renderWithRouter(<MultiStepRegister />);
    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Pokračovat/i }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/auth/register', { email: 'user@example.com' }));
    expect(screen.getByTestId('password-step')).toBeInTheDocument();
  };

  it('zobrazuje kritéria a blokuje tlačítko dokud nejsou splněna', async () => {
    await goToPasswordStep();
  const btn = screen.getByTestId('password-submit');
  expect(btn).toBeDisabled();
  fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'Aa1!tes' } }); // 7 znaků => ještě ne (chybí délka + speciál splněn)
  expect(btn).toBeDisabled();
  fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'Aa1!tesX' } }); // 8 znaků
  expect(btn).not.toBeDisabled();
  });

  it('po splnění kritérií odešle heslo a přejde na krok kódu', async () => {
    await goToPasswordStep();
  fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'Aa1!tesX' } });
  fireEvent.click(screen.getByTestId('password-submit'));
  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/auth/save-password', { email: 'user@example.com', password: 'Aa1!tesX' }));
  expect(screen.getByTestId('code-step')).toBeInTheDocument();
  });
});
