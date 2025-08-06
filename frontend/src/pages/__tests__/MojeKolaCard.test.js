import React from 'react';
import { render, screen } from '@testing-library/react';
import InfoCard from '../../components/InfoCard';

describe('MojeKolaCard', () => {
  it('zobrazuje správné informace', () => {
    render(<InfoCard icon="🚲" title="Moje kola" value="2 aktivní" background="#fff" />);
    expect(screen.getByText('Moje kola')).toBeInTheDocument();
    expect(screen.getByText('2 aktivní')).toBeInTheDocument();
  });

  it('obsahuje ikonu kola', () => {
    render(<InfoCard icon="🚲" title="Moje kola" value="2 aktivní" background="#fff" />);
    expect(screen.getByText('🚲')).toBeInTheDocument();
  });
});
