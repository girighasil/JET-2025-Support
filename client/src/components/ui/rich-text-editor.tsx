import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Code,
  Heading1,
  Heading2,
  PilcrowSquare,
  Quote,
  Undo,
  Redo
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({ content, onChange, placeholder, className }: RichTextEditorProps) {
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline cursor-pointer',
          rel: 'noopener noreferrer',
          target: '_blank'
        }
      })
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[150px] prose max-w-none dark:prose-invert',
        placeholder,
      },
    },
  });

  if (!editor) {
    return null;
  }

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link')
        .setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setIsLinkDialogOpen(false);
    }
  };

  return (
    <div className={cn("border rounded-md", className)}>
      <div className="flex flex-wrap gap-1 p-2 bg-muted/40 border-b">
        <Button
          variant="ghost"
          size="sm"
          className={cn("p-1 h-8 w-8", editor.isActive('bold') ? 'bg-muted' : '')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn("p-1 h-8 w-8", editor.isActive('italic') ? 'bg-muted' : '')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn("p-1 h-8 w-8", editor.isActive('bulletList') ? 'bg-muted' : '')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn("p-1 h-8 w-8", editor.isActive('orderedList') ? 'bg-muted' : '')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Ordered List"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn("p-1 h-8 w-8", editor.isActive('link') ? 'bg-muted' : '')}
          onClick={() => setIsLinkDialogOpen(true)}
          title="Link"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn("p-1 h-8 w-8", editor.isActive('codeBlock') ? 'bg-muted' : '')}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn("p-1 h-8 w-8", editor.isActive('heading', { level: 1 }) ? 'bg-muted' : '')}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn("p-1 h-8 w-8", editor.isActive('heading', { level: 2 }) ? 'bg-muted' : '')}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn("p-1 h-8 w-8", editor.isActive('paragraph') ? 'bg-muted' : '')}
          onClick={() => editor.chain().focus().setParagraph().run()}
          title="Paragraph"
        >
          <PilcrowSquare className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={cn("p-1 h-8 w-8", editor.isActive('blockquote') ? 'bg-muted' : '')}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </Button>
        <div className="ml-auto flex">
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-8 w-8"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-8 w-8"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLinkDialogOpen && (
        <div className="p-2 bg-muted/20 border-b flex gap-2">
          <input
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Enter URL"
            className="flex-1 px-3 py-1 text-sm border rounded"
          />
          <Button size="sm" onClick={addLink}>Add Link</Button>
          <Button size="sm" variant="outline" onClick={() => setIsLinkDialogOpen(false)}>Cancel</Button>
        </div>
      )}

      <div className="p-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

export default RichTextEditor;