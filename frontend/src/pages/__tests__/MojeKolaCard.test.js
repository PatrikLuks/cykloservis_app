import React from 'react';
import { render, screen } from '@testing-library/react';
import InfoCard from '../../components/InfoCard.jsx';

describe('MojeKolaCard', () => {
  const props = { icon: '🚲', title: 'Moje kola', value: '2 aktivní', background: '#fff' };

  it('zobrazuje správné informace', () => {
    render(React.createElement(InfoCard, props));
    expect(screen.getByText('Moje kola')).toBeInTheDocument();
    expect(screen.getByText('2 aktivní')).toBeInTheDocument();
  });

  it('obsahuje ikonu kola', () => {
    render(React.createElement(InfoCard, props));
    expect(screen.getByText('🚲')).toBeInTheDocument();
  });
});
