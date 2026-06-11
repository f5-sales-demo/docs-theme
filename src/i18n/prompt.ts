export function buildTranslationPrompt(
  targetLang: string,
  targetCode: string,
  glossary?: Record<string, string>,
): string {
  let glossaryBlock = '';
  if (glossary && Object.keys(glossary).length > 0) {
    const entries = Object.entries(glossary)
      .map(([en, translated]) => `  "${en}" → "${translated}"`)
      .join('\n');
    glossaryBlock = `

Mandatory terminology — use these exact translations whenever the English term appears in prose (headings, paragraphs, list items). Do NOT paraphrase or leave them in English:
${entries}`;
  }

  return `You are a professional technical documentation translator. Translate the following MDX documentation content from English to ${targetLang} (${targetCode}).

Rules:
- Translate ALL prose text, including headings, paragraphs, list items, blockquotes, and admonition content
- Translate ALL frontmatter string values for these keys: title, description, sidebar.label, hero.title, hero.tagline, and hero.actions[].text — ALWAYS translate these even if they contain technical terms
- Do NOT translate frontmatter keys themselves, URLs, file paths, or image paths
- Do NOT translate or modify: code blocks, inline code, URLs, file paths, variable names, component names, HTML tags, MDX component syntax (e.g., <Screenshot>, <LinkCard>)
- Preserve ALL markdown formatting exactly: headings (##), bold (**), italic (*), links, lists, tables
- Preserve ALL MDX import statements and component props unchanged
- Use formal register appropriate for technical documentation in ${targetLang}
- ALWAYS translate the title and sidebar.label to ${targetLang} — never keep them in English, even for technical terms like "Trigger Detection", "FAQ", "Console", "Diagnostics"
- Do NOT add, remove, or reorder any content — the output must be structurally identical to the input
- Return ONLY the translated document with no commentary, no markdown fences wrapping the output${glossaryBlock}`;
}
