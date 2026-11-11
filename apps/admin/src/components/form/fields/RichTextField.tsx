import Image from '@tiptap/extension-image';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  SquareCode,
  Strikethrough,
  Undo2,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { MediaPickerModal } from '@/components/media/MediaPickerModal';
import { cn } from '@/lib/cn';

interface Tool {
  label: string;
  icon: LucideIcon;
  run: (editor: Editor) => void;
  isActive?: (editor: Editor) => boolean;
}

function editLink(editor: Editor) {
  const current = editor.getAttributes('link').href as string | undefined;
  const href = window.prompt('Link URL (leave empty to remove the link)', current ?? 'https://');
  if (href === null) return;
  const chain = editor.chain().focus().extendMarkRange('link');
  if (href.trim()) chain.setLink({ href: href.trim() }).run();
  else chain.unsetLink().run();
}

/** Toolbar buttons, in groups. The tags they produce are the ones the API's sanitizer keeps. */
const TOOL_GROUPS: Tool[][] = [
  [
    {
      label: 'Bold',
      icon: Bold,
      run: (e) => e.chain().focus().toggleBold().run(),
      isActive: (e) => e.isActive('bold'),
    },
    {
      label: 'Italic',
      icon: Italic,
      run: (e) => e.chain().focus().toggleItalic().run(),
      isActive: (e) => e.isActive('italic'),
    },
    {
      label: 'Strikethrough',
      icon: Strikethrough,
      run: (e) => e.chain().focus().toggleStrike().run(),
      isActive: (e) => e.isActive('strike'),
    },
    {
      label: 'Inline code',
      icon: Code,
      run: (e) => e.chain().focus().toggleCode().run(),
      isActive: (e) => e.isActive('code'),
    },
  ],
  [
    {
      label: 'Heading',
      icon: Heading2,
      run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: (e) => e.isActive('heading', { level: 2 }),
    },
    {
      label: 'Subheading',
      icon: Heading3,
      run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: (e) => e.isActive('heading', { level: 3 }),
    },
    {
      label: 'Bullet list',
      icon: List,
      run: (e) => e.chain().focus().toggleBulletList().run(),
      isActive: (e) => e.isActive('bulletList'),
    },
    {
      label: 'Numbered list',
      icon: ListOrdered,
      run: (e) => e.chain().focus().toggleOrderedList().run(),
      isActive: (e) => e.isActive('orderedList'),
    },
    {
      label: 'Quote',
      icon: Quote,
      run: (e) => e.chain().focus().toggleBlockquote().run(),
      isActive: (e) => e.isActive('blockquote'),
    },
    {
      label: 'Code block',
      icon: SquareCode,
      run: (e) => e.chain().focus().toggleCodeBlock().run(),
      isActive: (e) => e.isActive('codeBlock'),
    },
  ],
  [{ label: 'Link', icon: LinkIcon, run: editLink, isActive: (e) => e.isActive('link') }],
];

const HISTORY_TOOLS: Tool[] = [
  { label: 'Undo', icon: Undo2, run: (e) => e.chain().focus().undo().run() },
  { label: 'Redo', icon: Redo2, run: (e) => e.chain().focus().redo().run() },
];

function ToolButton({ tool, editor }: { tool: Tool; editor: Editor }) {
  const active = tool.isActive?.(editor) ?? false;
  return (
    <button
      type="button"
      title={tool.label}
      aria-label={tool.label}
      aria-pressed={tool.isActive ? active : undefined}
      // Keep the cursor in the editor, so typing continues right after a click.
      onMouseDown={(event) => event.preventDefault()}
      onClick={() => tool.run(editor)}
      className={cn(
        'cursor-pointer rounded-md p-1.5 text-muted hover:bg-raised hover:text-fg',
        active && 'bg-accent/20 text-fg',
      )}
    >
      <tool.icon className="size-4" />
    </button>
  );
}

/** The editor keeps an empty paragraph after the last block for the cursor; it is not content. */
const toCleanHtml = (html: string) => html.replace(/(<p><\/p>)+$/, '');

interface RichTextFieldProps {
  value: string;
  onChange: (html: string) => void;
}

/** Rich text editor that reads and writes HTML. */
export default function RichTextField({ value, onChange }: RichTextFieldProps) {
  const [pickingImage, setPickingImage] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false } }),
      Image,
    ],
    content: value,
    editorProps: { attributes: { class: 'rich-text min-h-64 px-4 py-3 focus:outline-none' } },
    // An empty document is "<p></p>"; report it as empty so "required" checks work.
    onUpdate: ({ editor: current }) =>
      onChange(current.isEmpty ? '' : toCleanHtml(current.getHTML())),
  });

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-bg focus-within:border-accent">
      <div
        role="toolbar"
        aria-label="Formatting"
        className="flex flex-wrap items-center gap-0.5 border-b border-border bg-surface px-2 py-1.5"
      >
        {TOOL_GROUPS.map((group, index) => (
          <div key={index} className="flex items-center gap-0.5 border-r border-border pr-1.5 mr-1">
            {group.map((tool) => (
              <ToolButton key={tool.label} tool={tool} editor={editor} />
            ))}
          </div>
        ))}
        <button
          type="button"
          title="Image"
          aria-label="Image"
          onClick={() => setPickingImage(true)}
          className="cursor-pointer rounded-md p-1.5 text-muted hover:bg-raised hover:text-fg"
        >
          <ImagePlus className="size-4" />
        </button>
        <div className="ml-auto flex items-center gap-0.5">
          {HISTORY_TOOLS.map((tool) => (
            <ToolButton key={tool.label} tool={tool} editor={editor} />
          ))}
        </div>
      </div>

      <EditorContent editor={editor} />

      <MediaPickerModal
        open={pickingImage}
        onClose={() => setPickingImage(false)}
        defaultFolder="blog"
        onPick={(media) =>
          editor
            .chain()
            .focus()
            .setImage({ src: media.url, alt: media.alt ?? '' })
            .run()
        }
      />
    </div>
  );
}
