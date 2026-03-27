/// <reference types="vite/client" />

// Déclarations pour les fichiers images
declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.jpeg' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.svg' {
  const src: string
  export default src
}

declare module '*.gif' {
  const src: string
  export default src
}

declare module '*.webp' {
  const src: string
  export default src
}

// Déclarations pour lovable-agent-playwright-config
declare module 'lovable-agent-playwright-config/fixture' {
  export const test: any
  export const expect: any
  export const config: any
  export const setup: any
  export const teardown: any
}

declare module 'lovable-agent-playwright-config/config' {
  export const config: any
  export const browser: any
  export const context: any
  export const page: any
  export default any
}

declare module 'lovable-agent-playwright-config' {
  export const config: any
  export const test: any
  export const expect: any
  export const setup: any
  export const teardown: any
}

// Déclarations génériques pour d'autres modules si nécessaire
declare module '*.css' {
  const content: { [className: string]: string }
  export default content
}

declare module '*.scss' {
  const content: { [className: string]: string }
  export default content
}