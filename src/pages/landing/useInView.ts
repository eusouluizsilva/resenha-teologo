// Açúcar pra reuso do padrão `whileInView` do framer-motion. Mantido em arquivo
// próprio porque shared.tsx só exporta componentes (regra de Fast Refresh).

export function useInView(threshold = 0.15) {
  return {
    initial: 'hidden',
    whileInView: 'visible',
    viewport: { once: true, amount: threshold },
  }
}
