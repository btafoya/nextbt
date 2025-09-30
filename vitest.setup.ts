import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Mock server-only module to prevent errors in tests
vi.mock('server-only', () => ({}))

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Add custom matchers
expect.extend({
  // Add any custom matchers here if needed
})