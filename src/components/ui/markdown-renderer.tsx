import React from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function parseInline(text: string): React.ReactNode[] {
  if (!text) return [];
  // Matches markdown links [text](url), bold **text**, italic *text*, code `text`
  const regex = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Link [label](url)
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      const [, label, url] = linkMatch;
      return (
        <a
          key={index}
          href={url}
          target={url.startsWith("http") ? "_blank" : undefined}
          rel={url.startsWith("http") ? "noopener noreferrer" : undefined}
          className="text-indigo-400 hover:underline font-semibold"
        >
          {parseInline(label)}
        </a>
      );
    }

    // Bold **text**
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={index} className="font-bold text-white">
          {parseInline(part.slice(2, -2))}
        </strong>
      );
    }

    // Italic *text*
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return (
        <em key={index} className="italic text-slate-300">
          {parseInline(part.slice(1, -1))}
        </em>
      );
    }

    // Code `text`
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code key={index} className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-xs">
          {part.slice(1, -1)}
        </code>
      );
    }

    return part;
  });
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  if (!content) return null;

  const lines = content.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let currentList: { type: "ul" | "ol"; items: string[] } | null = null;
  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const pText = currentParagraph.join("\n");
      const lineParts = pText.split("\n");
      elements.push(
        <p key={`p-${elements.length}`} className="text-slate-300 text-sm leading-relaxed my-3">
          {lineParts.map((line, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <br />}
              {parseInline(line)}
            </React.Fragment>
          ))}
        </p>
      );
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (currentList) {
      if (currentList.type === "ul") {
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc pl-6 space-y-1.5 my-3 text-slate-300 text-sm">
            {currentList.items.map((item, idx) => (
              <li key={idx}>{parseInline(item)}</li>
            ))}
          </ul>
        );
      } else {
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal pl-6 space-y-1.5 my-3 text-slate-300 text-sm">
            {currentList.items.map((item, idx) => (
              <li key={idx}>{parseInline(item)}</li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }

    // Horizontal Rule
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      flushParagraph();
      flushList();
      elements.push(<hr key={`hr-${elements.length}`} className="border-slate-800 my-6" />);
      continue;
    }

    // Heading #
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      const level = headingMatch[1].length;
      const text = headingMatch[2];

      if (level === 1) {
        elements.push(
          <h1 key={`h1-${elements.length}`} className="text-2xl sm:text-3xl font-extrabold text-white mt-6 mb-4 border-b border-slate-800 pb-3">
            {parseInline(text)}
          </h1>
        );
      } else if (level === 2) {
        elements.push(
          <h2 key={`h2-${elements.length}`} className="text-xl font-bold text-white mt-5 mb-3 border-b border-slate-800/80 pb-2">
            {parseInline(text)}
          </h2>
        );
      } else if (level === 3) {
        elements.push(
          <h3 key={`h3-${elements.length}`} className="text-lg font-semibold text-slate-100 mt-4 mb-2">
            {parseInline(text)}
          </h3>
        );
      } else {
        elements.push(
          <h4 key={`h4-${elements.length}`} className="text-base font-semibold text-slate-200 mt-3 mb-2">
            {parseInline(text)}
          </h4>
        );
      }
      continue;
    }

    // Blockquote >
    if (trimmed.startsWith("> ")) {
      flushParagraph();
      flushList();
      const text = trimmed.slice(2);
      elements.push(
        <blockquote key={`bq-${elements.length}`} className="border-l-4 border-indigo-500/80 pl-4 py-2 my-3 text-slate-300 bg-slate-950/50 rounded-r-2xl text-xs italic">
          {parseInline(text)}
        </blockquote>
      );
      continue;
    }

    // Unordered List (- or *)
    const ulMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (ulMatch) {
      flushParagraph();
      if (!currentList || currentList.type !== "ul") {
        flushList();
        currentList = { type: "ul", items: [] };
      }
      currentList.items.push(ulMatch[1]);
      continue;
    }

    // Ordered List (1. 2. or 1) )
    const olMatch = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
    if (olMatch) {
      flushParagraph();
      if (!currentList || currentList.type !== "ol") {
        flushList();
        currentList = { type: "ol", items: [] };
      }
      currentList.items.push(olMatch[2]);
      continue;
    }

    // Normal line in paragraph
    flushList();
    currentParagraph.push(line);
  }

  flushParagraph();
  flushList();

  return <div className={`markdown-body space-y-2 ${className}`}>{elements}</div>;
}
