// NOTE: Duplicate root test retained because file deletions haven't persisted (FS anomaly).
// Preferred canonical test: AppRoot.test.jsx. This file can be deleted once FS issue resolved.
import React from 'react';
import { render } from '@testing-library/react';
import App from './App.jsx';

describe.skip('App root render (duplicate; see comment)', () => {
  it('renders without crashing', () => {
  const { container } = render(<App />);
    expect(container.firstChild).toBeTruthy();
  });
});
