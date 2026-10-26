import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from '@/mocks/server'

// jsdom no implementa IntersectionObserver, que `motion` usa para `whileInView`.
// El stub dispara la intersección de inmediato para que las animaciones
// terminen y el contenido quede visible en los tests.
window.IntersectionObserver = ((callback: IntersectionObserverCallback) => ({
  observe: (target: Element) => {
    callback(
      [{ isIntersecting: true, target }] as IntersectionObserverEntry[],
      {} as IntersectionObserver,
    )
  },
  unobserve: () => {},
  disconnect: () => {},
  takeRecords: () => [],
})) as unknown as typeof IntersectionObserver

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
})

afterEach(() => {
  server.resetHandlers()
  cleanup()
})

afterAll(() => {
  server.close()
})