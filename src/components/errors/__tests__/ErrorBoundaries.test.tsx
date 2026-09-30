
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { BrowserRouter } from 'react-router';
import { ErrorBoundary } from '../ErrorBoundary';
import { PageErrorBoundary } from '../PageErrorBoundary';
import { SectionErrorBoundary } from '../SectionErrorBoundary';

const Bomb = ({ shouldThrow }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Boom!');
  }
  return <div>Safe</div>;
};

describe('Error Boundaries', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ErrorBoundary renders children when safe', () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.getByText('Safe')).toBeTruthy();
  });

  it('ErrorBoundary renders fallback when error', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>
    );
    expect(screen.getByText('Something went wrong')).toBeTruthy();
  });

  it('PageErrorBoundary renders fallback on error', () => {
    render(
      <BrowserRouter>
        <PageErrorBoundary>
          <Bomb shouldThrow />
        </PageErrorBoundary>
      </BrowserRouter>
    );
    expect(screen.getByText('Page Error')).toBeTruthy();
  });

  it('SectionErrorBoundary renders fallback on error', () => {
    render(
      <SectionErrorBoundary sectionName="test section">
        <Bomb shouldThrow />
      </SectionErrorBoundary>
    );
    expect(screen.getByText('Failed to load test section')).toBeTruthy();
  });
});
