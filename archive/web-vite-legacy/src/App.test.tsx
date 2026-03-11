import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('HeySalad web app', () => {
  it('renders the OS shell home workspace', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getAllByText(/workspace/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /mission control/i })).toBeInTheDocument();
    expect(screen.getByText(/company twin/i)).toBeInTheDocument();
  });

  it('renders mission control metrics and approvals', () => {
    render(
      <MemoryRouter initialEntries={['/mission-control']}>
        <App />
      </MemoryRouter>
    );

    expect(screen.getByText(/active lanes/i)).toBeInTheDocument();
    expect(screen.getAllByText(/issue goodwill credits/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/approve launch email batch/i).length).toBeGreaterThan(0);
  });

  it('navigates to products and shows initiative cards', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    await user.click(screen.getAllByRole('link', { name: /products/i })[0]!);
    expect(screen.getByText(/product stack/i)).toBeInTheDocument();
    expect(screen.getAllByText(/salad club/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/owner ava/i)).toBeInTheDocument();
  });
});
