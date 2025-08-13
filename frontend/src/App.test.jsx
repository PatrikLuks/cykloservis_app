import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

describe('App root render', () => {
  it('renders without crashing', () => {
    const { container } = render(React.createElement(App));
    expect(container.firstChild).toBeTruthy();
  });
});
