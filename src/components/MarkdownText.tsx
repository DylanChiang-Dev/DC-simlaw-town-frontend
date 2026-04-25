import { Fragment, type ReactNode } from 'react';

type MarkdownBlock =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] };

type Props = {
  className?: string;
  fallback?: string;
  text?: string;
};

export function MarkdownText({ className = '', fallback = '', text = '' }: Props) {
  const source = text.trim() || fallback.trim();
  if (!source) return null;

  const blocks = parseMarkdownBlocks(source);
  return (
    <div className={`markdown-text ${className}`.trim()}>
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}

export function parseMarkdownBlocks(source: string): MarkdownBlock[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: MarkdownBlock[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();
    if (!trimmed) {
      index += 1;
      continue;
    }

    const heading = /^(#{1,4})\s+(.+)$/.exec(trimmed);
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2].trim() });
      index += 1;
      continue;
    }

    const quote = /^>\s?(.*)$/.exec(trimmed);
    if (quote) {
      const items: string[] = [];
      while (index < lines.length) {
        const next = /^>\s?(.*)$/.exec(lines[index].trim());
        if (!next) break;
        items.push(next[1].trim());
        index += 1;
      }
      blocks.push({ type: 'quote', text: items.join('\n') });
      continue;
    }

    const listMarker = getListItem(trimmed);
    if (listMarker) {
      const ordered = listMarker.ordered;
      const items: string[] = [];
      while (index < lines.length) {
        const item = getListItem(lines[index].trim());
        if (!item || item.ordered !== ordered) break;
        items.push(item.text);
        index += 1;
      }
      blocks.push({ type: 'list', ordered, items });
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const current = lines[index].trim();
      if (!current || /^(#{1,4})\s+/.test(current) || /^>\s?/.test(current) || getListItem(current)) {
        break;
      }
      paragraphLines.push(current);
      index += 1;
    }
    blocks.push({ type: 'paragraph', text: paragraphLines.join('\n') });
  }

  return blocks;
}

function getListItem(line: string): { ordered: boolean; text: string } | null {
  const unordered = /^[-*+]\s+(.+)$/.exec(line);
  if (unordered) return { ordered: false, text: unordered[1].trim() };

  const ordered = /^\d+[.)]\s+(.+)$/.exec(line);
  if (ordered) return { ordered: true, text: ordered[1].trim() };

  return null;
}

function renderBlock(block: MarkdownBlock, index: number): ReactNode {
  if (block.type === 'heading') {
    const HeadingTag = (`h${Math.min(block.level + 2, 6)}`) as keyof JSX.IntrinsicElements;
    return <HeadingTag key={index}>{renderInline(block.text)}</HeadingTag>;
  }

  if (block.type === 'quote') {
    return <blockquote key={index}>{renderInline(block.text)}</blockquote>;
  }

  if (block.type === 'list') {
    const ListTag = block.ordered ? 'ol' : 'ul';
    return (
      <ListTag key={index}>
        {block.items.map((item, itemIndex) => (
          <li key={`${index}-${itemIndex}`}>{renderInline(item)}</li>
        ))}
      </ListTag>
    );
  }

  return <p key={index}>{renderInline(block.text)}</p>;
}

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  const lines = text.split('\n');

  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) nodes.push(<br key={`br-${lineIndex}`} />);
    let cursor = 0;
    for (const match of line.matchAll(pattern)) {
      if (match.index === undefined) continue;
      if (match.index > cursor) {
        nodes.push(line.slice(cursor, match.index));
      }

      const token = match[0];
      const key = `${lineIndex}-${match.index}`;
      if (token.startsWith('**')) {
        nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
      } else if (token.startsWith('`')) {
        nodes.push(<code key={key}>{token.slice(1, -1)}</code>);
      } else {
        nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
      }
      cursor = match.index + token.length;
    }
    if (cursor < line.length) nodes.push(line.slice(cursor));
  });

  return nodes.map((node, index) => (
    <Fragment key={typeof node === 'string' ? `${index}-${node}` : index}>{node}</Fragment>
  ));
}
