<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/temp/1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


# Como alterar tokens / temas

- Tokens principais ficam em `src/index.css` dentro de `:root` (cores, raio, sombras).
- Para adicionar/ajustar uma cor: altere `--color-primary` / `--color-bg` etc.
- Para alterar dark mode: ajuste a classe `.dark` (mesmas variáveis sobrescritas).
- O Tailwind está configurado para usar essas variáveis via `tailwind.config.cjs`. Use classes utilitárias normalmente e nossas classes custom (`.card`, `.btn`, `.input`) quando quiser comportamento pré-definido.
- Tema é alternado pelo hook `useTheme()` e persistido em `localStorage`.
