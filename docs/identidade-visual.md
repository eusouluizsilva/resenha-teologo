# Identidade Visual Oficial — Resenha do Teólogo

> Documento oficial de identidade visual e direção de experiência do produto.
> Toda decisão visual deve ser baseada neste documento.

---

## 1. Visão Geral da Marca

A plataforma une dois universos:
1. Profundidade editorial e acadêmica — leitura, Bíblia, formação, biblioteca, reflexão e estudo sério
2. Clareza e sofisticação de produto digital moderno — dashboard, experiência fluida, interface limpa e tecnologia confiável

**Direção estética oficial:**
> editorial teológico premium com estrutura SaaS moderna

A plataforma **não deve parecer:** site genérico de curso, landing page de infoproduto, interface infantil, estética religiosa caricata, startup fria sem alma.

A plataforma **deve parecer:** sólida, inteligente, premium, reverente, moderna, limpa, editorial, confiável, sofisticada, altamente legível.

---

## 2. Estratégia Visual — Modo Dual

### Dark First — Modo Institucional
Usado em: landing page, hero sections, páginas institucionais, marketing, onboarding, áreas de autoridade da marca, dashboards executivos.

### Light First — Modo de Estudo
Usado em: área do aluno, leitor bíblico, eBooks, caderno digital, comentários, fóruns, conteúdos longos, páginas de leitura intensa.

**Regra:** dark para sofisticação, marca e impacto. Light para conforto, leitura e permanência prolongada.

---

## 3. Paleta de Cores Oficial

### Cores Principais
```
Primary Deep Navy:      #1E2430
Primary Secondary Navy: #313842
Accent Orange:          #F37E20
Soft Ivory:             #F7F5F2
Warm Stone:             #E8E1D8
Pure White:             #FEFEFE
Ink Dark:               #111827
```

### Superfícies Dark
```
Background Dark:        #0F141A
Panel Dark:             #151B23
Card Dark:              #1B2430
Border Dark:            #2A313B
Text Muted Dark:        rgba(255,255,255,0.72)
Text Primary Dark:      rgba(255,255,255,0.92)
```

### Superfícies Light
```
Background Light:       #FFFFFF
Background Editorial:   #F7F5F2
Background Warm Alt:    #E8E1D8
Border Light:           #E2E8F0
Text Primary Light:     #111827
Text Secondary Light:   #6B7280
```

### Cores Semânticas
```
Success:  #22C55E
Warning:  #F59E0B
Error:    #EF4444
Info:     #3B82F6
```

### Regra de Proporção
- **80%** neutros e superfícies
- **15%** azuis institucionais e tons escuros
- **5%** laranja de destaque

**Laranja apenas em:** botão primário, links importantes, estados ativos, progresso de curso, badges principais, aula concluída, CTA, foco visual importante. Nunca em grandes áreas de fundo.

---

## 4. Tipografia Oficial

| Camada | Fonte | Uso |
|--------|-------|-----|
| Camada 1 | **Plus Jakarta Sans** | Títulos e branding |
| Camada 2 | **Inter** | Interface, dashboards, formulários, botões, labels, corpo principal |
| Camada 3 | **Source Serif 4** | Uso editorial pontual — versículos, citações, certificados, áreas premium |

**Source Serif 4 apenas em:** blocos de versículo destacados, citações especiais, cabeçalhos de leitura teológica, certificados, manifesto institucional. A interface principal nunca é serifada.

### Hierarquia
```
Hero Title:     56–64px
Page Title:     36–40px
Section Title:  24–30px
Card Title:     18–20px
Body:           16px
Secondary Body: 14px
Caption:        12–13px
```

**Regras:** line-height 1.5–1.7 em textos longos, 1.15–1.3 em títulos. Sem bold excessivo. Espaçamento vertical generoso.

---

## 5. Componentes

### Botões
- Primário: laranja sólido, cantos suaves (não excessivos)
- Secundário: navy ou superfície escura com borda sutil
- Hover discreto e elegante, foco acessível

### Cards
- Espaçamento interno generoso
- Borda muito sutil ou sombra leve
- Sem efeito plástico, sem sombras fortes

### Inputs
- Muito limpos, excelente legibilidade
- Foco com borda laranja ou azul institucional
- Fundo neutro, bordas suaves

### Sidebar
- Sólida, estável, escura, fundo profundo
- Ícones discretos, tipografia clara, destaque ativo elegante

### Progress Bars
- Visuais fortes e limpas
- Laranja como cor principal
- Fundo neutro conforme contexto

### Badges
- Acadêmicas e elegantes — nada infantil, nada de jogo casual
- Cores: laranja, navy, warm stone, neutros

---

## 6. Linguagem Visual Teológica

**Usar:** blocos de versículos elegantes, áreas de leitura com respiro editorial, citações com hierarquia clara, serif pontual em áreas de conhecimento, sensação de biblioteca contemporânea.

**Evitar:** cruzes decorativas, pergaminhos, ornamentos religiosos óbvios, dourado excessivo, visual de igreja tradicional, texturas exageradas.

---

## 7. Microinterações e Animações

### Tokens de Motion
```
Fast:     160ms
Normal:   240ms
Moderate: 360ms
Slow:     520ms
```

### Easings
- ease-out suave para entrada
- ease-in-out para transições
- Sem bounce exagerado

### Variantes Reutilizáveis (Framer Motion)
- `fadeUp` — fade in + translateY leve (12–24px)
- `fadeIn` — apenas opacidade
- `staggerContainer` — delay entre filhos
- `pageEnter` / `pageExit` — transições de página
- `scaleSoft` — scale sutil
- `slideSoft` — deslizamento horizontal sutil

### Reveal on Scroll
- Fade in + translateY leve ao entrar no viewport
- Stagger discreto entre elementos irmãos
- Duração 0.45s–0.8s

### Transições de Página
- Fade + slight slide, duração 0.25s–0.45s
- Sensação de rapidez e continuidade
- Sem transições cinematográficas longas

### Regras de Animação
- Sempre respeitar `prefers-reduced-motion`
- Nunca comprometer performance
- Nada chamativo, nada infantil, nada exagerado

---

## 8. Implementação Técnica

```
Animações principais:     Framer Motion
Reveal on scroll:         Intersection Observer
Interações simples:       CSS transitions
```

---

## 9. Experiência por Área

| Área | Modo | Características |
|------|------|----------------|
| Landing page | Dark | Impacto, contraste, emocional, hero forte, animações suaves |
| Área do aluno | Light | Conforto, continuidade, leitura, progresso |
| Área do criador | Dark/híbrida | Técnica, métricas, gestão, organizada |
| Leitor bíblico / Caderno | Light editorial | Contemplativa, funcional, respiro, hierarquia clara |
| Fórum / Comentários | Light | Limpo, sério, hierárquico, separação visual clara |
| Certificados | Formal | Sóbrio, acadêmico, elegante, Source Serif 4 |

---

## 10. White Label

**Permitir personalização em:** logo, cor de destaque secundária, imagem de capa, avatar, pequenos detalhes de branding.

**Não permitir:** alterações que destruam legibilidade, sofisticação ou a estrutura base do sistema.

A base estrutural, tipografia, layout e superfícies sempre preservam o padrão premium.

---

## 11. Regra Final

> Sempre escolha o mais **elegante** sobre o mais chamativo.
> Sempre escolha o mais **legível** sobre o mais visualmente pesado.
> Sempre escolha **profundidade editorial** sobre o genérico de startup — mantendo a clareza do produto digital.

**A identidade visual oficial é:**
> editorial teológico premium com estrutura SaaS moderna, dark institucional, light para estudo, navy profundo, laranja estratégico, serif pontual em áreas de conhecimento, microinterações elegantes e transições suaves.
