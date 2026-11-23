/**
 * kami-publish — publication design derived from book metadata.
 *
 * TypeScript only. Project-local output: `book/publication.md` (adjacent to
 * `book/meta.json`). No `~/.config`, no Python, no kami-anything naming.
 * Rolled into the existing `/buchbinder publish` flow.
 */

import fs from 'fs-extra';
import path from 'path';

/** Book metadata shape used to derive the publication design. */
export interface BookMeta {
  title: string;
  author: string;
  series?: string;
  seriesNumber?: number;
  language?: string;
  subtitle?: string;
  description?: string;
  license?: string;
  publisher?: string;
  isbn?: string;
}

/** Derived publication design written to book/publication.md. */
export interface PublicationDesign {
  title: string;
  author: string;
  series?: string;
  seriesNumber?: number;
  language: string;
  subtitle?: string;
  description?: string;
  license: string;
  publisher?: string;
  isbn?: string;
  brandColor: string;
  font: string;
  coverStyle: string;
  outputPath: string;
}

/** Derive a publication design from book metadata. */
export function brandFromBookMeta(meta: BookMeta): PublicationDesign {
  const language = meta.language || 'en';
  const brandColor = deriveBrandColor(meta.title, meta.author);
  const font = deriveFont(language);
  const coverStyle = deriveCoverStyle(meta.series);

  return {
    title: meta.title || 'Untitled',
    author: meta.author || 'Unknown Author',
    series: meta.series,
    seriesNumber: meta.seriesNumber,
    language,
    subtitle: meta.subtitle,
    description: meta.description,
    license: meta.license || 'All Rights Reserved',
    publisher: meta.publisher,
    isbn: meta.isbn,
    brandColor,
    font,
    coverStyle,
    outputPath: path.join('book', 'publication.md'),
  };
}

/** Deterministic brand color from title + author (no randomness). */
function deriveBrandColor(title: string, author: string): string {
  const seed = `${title}|${author}`.toLowerCase();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 45%, 55%)`;
}

/** Font choice by language (no Chinese-writing variants). */
function deriveFont(language: string): string {
  switch (language) {
    case 'en':
    case 'en-US':
    case 'en-GB':
      return 'Georgia, serif';
    case 'de':
      return 'Palatino, serif';
    case 'fr':
      return 'Garamond, serif';
    case 'es':
      return 'Merriweather, serif';
    case 'it':
      return 'Bodoni, serif';
    case 'nl':
      return 'Hoefler Text, serif';
    case 'pt':
      return 'Minion Pro, serif';
    case 'ru':
      return 'Times New Roman, serif';
    case 'ja':
      return 'Hiragino Mincho ProN, serif';
    case 'ko':
      return 'Nanum Myeongjo, serif';
    default:
      return 'Georgia, serif';
  }
}

/** Cover style hint by series presence. */
function deriveCoverStyle(series?: string): string {
  return series ? 'series-branded cover' : 'standalone cover';
}

/** Write the publication design to book/publication.md. */
export async function writePublication(
  projectRoot: string,
  design: PublicationDesign,
): Promise<string> {
  const outDir = path.join(projectRoot, 'book');
  await fs.ensureDir(outDir);
  const filePath = path.join(outDir, 'publication.md');

  const lines: string[] = [];
  lines.push(`# ${design.title}`);
  if (design.subtitle) lines.push(`*${design.subtitle}*`);
  lines.push('');
  lines.push(`**By ${design.author}**`);
  if (design.publisher) lines.push(`*${design.publisher}*`);
  if (design.isbn) lines.push(`ISBN: ${design.isbn}`);
  if (design.series) {
    lines.push(`${design.series}${design.seriesNumber ? ` #${design.seriesNumber}` : ''}`);
  }
  lines.push('');
  lines.push(`License: ${design.license}`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('## Publication Design');
  lines.push('');
  lines.push(`- **Language**: ${design.language}`);
  lines.push(`- **Brand color**: ${design.brandColor}`);
  lines.push(`- **Body font**: ${design.font}`);
  lines.push(`- **Cover style**: ${design.coverStyle}`);
  lines.push('');
  lines.push('## Source');
  lines.push(`Derived from `);
  lines.push(`book/meta.json via `);
  lines.push(`brandFromBookMeta().`);
  lines.push('');

  await fs.writeFile(filePath, lines.join('\n'), 'utf-8');
  return filePath;
}
