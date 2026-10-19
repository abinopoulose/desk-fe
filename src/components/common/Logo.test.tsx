import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Logo, LogoIcon } from './Logo';
import { APP_NAME } from '../../constants';

describe('Logo Component', () => {
  it('renders LogoIcon with default attributes and accessibility label', () => {
    render(<LogoIcon size={44} />);
    const svg = screen.getByLabelText(`${APP_NAME} logo`);
    expect(svg).toBeDefined();
    expect(svg.getAttribute('width')).toBe('44');
    expect(svg.getAttribute('height')).toBe('44');
  });

  it('renders full Logo with app name and subtitle', () => {
    render(<Logo showText={true} subtitle="Cloud" />);
    expect(screen.getByText(APP_NAME)).toBeDefined();
    expect(screen.getByText('Cloud')).toBeDefined();
  });

  it('can hide text when showText is false', () => {
    render(<Logo showText={false} />);
    expect(screen.queryByText('Enterprise Hub')).toBeNull();
  });
});
