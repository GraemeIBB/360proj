import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import SearchBar from '../components/SearchBar';

afterEach(() => {
  cleanup();
});

describe('SearchBar component', () => {
  test('submits typed query and clears input', () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByPlaceholderText('Search Books');
    fireEvent.change(input, { target: { value: 'harry potter' } });
    fireEvent.submit(input.closest('form'));

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('harry potter');
    expect(input).toHaveValue('');
  });

  test('does not throw when onSearch is not provided', () => {
    render(<SearchBar />);

    const input = screen.getByPlaceholderText('Search Books');
    fireEvent.change(input, { target: { value: 'dune' } });
    fireEvent.submit(input.closest('form'));

    expect(input).toHaveValue('');
  });
});
