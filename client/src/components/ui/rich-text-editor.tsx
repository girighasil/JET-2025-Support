import React, { useState } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { 
  Bold, Italic, Code, List, ListOrdered, Quote, Heading1, Heading2, 
  Link as LinkIcon, Undo, Redo, RemoveFormatting
} from 'lucide-react';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { Separator } from './separator';
import { useToast } from '@/hooks/use-toast';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

// Menu button component
const MenuButton = ({ onClick, disabled, active, title, children }: {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={active ? 'default' : 'ghost'}
            size="icon"
            onClick={onClick}
            disabled={disabled}
            className="h-9 w-9"
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{title}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Menu bar for the rich text editor
const MenuBar = ({ editor }: { editor: Editor | null }) => {
  const [linkUrl, setLinkUrl] = useState<string>('');
  const [showLinkInput, setShowLinkInput] = useState<boolean>(false);
  const { toast } = useToast();

  if (!editor) {
    return null;
  }

  const addLink = () => {
    if (showLinkInput) {
      if (linkUrl) {
        editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
        setLinkUrl('');
      } else {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
      }
      setShowLinkInput(false);
    } else {
      setShowLinkInput(true);
    }
  };

  return (
    <div className="border border-input rounded-t-md bg-background p-1 flex flex-wrap items-center gap-1">
      <MenuButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </MenuButton>
      
      <MenuButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </MenuButton>
      
      <MenuButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editor.can().chain().focus().toggleCode().run()}
        active={editor.isActive('code')}
        title="Code"
      >
        <Code className="h-4 w-4" />
      </MenuButton>
      
      <Separator orientation="vertical" className="mx-1 h-8" />
      
      <MenuButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </MenuButton>
      
      <MenuButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </MenuButton>
      
      <Separator orientation="vertical" className="mx-1 h-8" />
      
      <MenuButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </MenuButton>
      
      <MenuButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="Ordered List"
      >
        <ListOrdered className="h-4 w-4" />
      </MenuButton>
      
      <MenuButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        title="Quote"
      >
        <Quote className="h-4 w-4" />
      </MenuButton>
      
      <Separator orientation="vertical" className="mx-1 h-8" />
      
      <MenuButton
        onClick={addLink}
        active={editor.isActive('link') || showLinkInput}
        title="Link"
      >
        <LinkIcon className="h-4 w-4" />
      </MenuButton>
      
      {showLinkInput && (
        <div className="flex items-center gap-2 ml-1">
          <input
            type="text"
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="px-2 py-1 text-sm border rounded w-64"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addLink();
              }
            }}
            autoFocus
          />
          <Button 
            variant="outline" 
            size="sm"
            onClick={addLink}
          >
            Add
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowLinkInput(false);
              setLinkUrl('');
            }}
          >
            Cancel
          </Button>
        </div>
      )}
      
      <div className="ml-auto flex items-center gap-1">
        <MenuButton
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          title="Clear Formatting"
        >
          <RemoveFormatting className="h-4 w-4" />
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          title="Undo"
        >
          <Undo className="h-4 w-4" />
        </MenuButton>
        
        <MenuButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          title="Redo"
        >
          <Redo className="h-4 w-4" />
        </MenuButton>
      </div>
    </div>
  );
};

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  content, 
  onChange, 
  placeholder = 'Start writing...',
  readOnly = false
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        validate: href => /^https?:\/\//.test(href),
      }),
    ],
    content: content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[150px] max-w-none',
      },
    },
  });

  return (
    <div className="border border-input rounded-md overflow-hidden">
      {!readOnly && <MenuBar editor={editor} />}
      <div className="p-4">
        <EditorContent 
          editor={editor} 
          className="min-h-[150px] outline-none" 
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};

export default RichTextEditor;