import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Highlight } from '@tiptap/extension-highlight';

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt('URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);
    
    if (url === null) {
      return;
    }
    
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addYoutubeVideo = () => {
    const url = prompt('Enter YouTube URL');
    if (url) {
      editor.commands.setYoutubeVideo({
        src: url,
        width: 640,
        height: 480,
      });
    }
  };

  return (
    <div className="tiptap-toolbar d-flex flex-wrap gap-1 p-2 bg-light border-bottom">
      <button 
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()} 
        disabled={!editor.can().chain().focus().toggleBold().run()} 
        className={`btn btn-sm ${editor.isActive('bold') ? 'btn-secondary' : 'btn-outline-secondary'}`}
        title="Bold"
      >
        <i className="bi bi-type-bold"></i>
      </button>
      <button 
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()} 
        disabled={!editor.can().chain().focus().toggleItalic().run()} 
        className={`btn btn-sm ${editor.isActive('italic') ? 'btn-secondary' : 'btn-outline-secondary'}`}
        title="Italic"
      >
        <i className="bi bi-type-italic"></i>
      </button>
      <button 
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()} 
        disabled={!editor.can().chain().focus().toggleStrike().run()} 
        className={`btn btn-sm ${editor.isActive('strike') ? 'btn-secondary' : 'btn-outline-secondary'}`}
        title="Strike"
      >
        <i className="bi bi-type-strikethrough"></i>
      </button>

      <div className="vr mx-1"></div>

      <button 
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} 
        className={`btn btn-sm ${editor.isActive('heading', { level: 1 }) ? 'btn-secondary' : 'btn-outline-secondary'}`}
      >
        H1
      </button>
      <button 
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} 
        className={`btn btn-sm ${editor.isActive('heading', { level: 2 }) ? 'btn-secondary' : 'btn-outline-secondary'}`}
      >
        H2
      </button>
      <button 
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} 
        className={`btn btn-sm ${editor.isActive('heading', { level: 3 }) ? 'btn-secondary' : 'btn-outline-secondary'}`}
      >
        H3
      </button>

      <div className="vr mx-1"></div>

      <button 
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('left').run()} 
        className={`btn btn-sm ${editor.isActive({ textAlign: 'left' }) ? 'btn-secondary' : 'btn-outline-secondary'}`}
      >
        <i className="bi bi-text-left"></i>
      </button>
      <button 
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('center').run()} 
        className={`btn btn-sm ${editor.isActive({ textAlign: 'center' }) ? 'btn-secondary' : 'btn-outline-secondary'}`}
      >
        <i className="bi bi-text-center"></i>
      </button>
      <button 
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('right').run()} 
        className={`btn btn-sm ${editor.isActive({ textAlign: 'right' }) ? 'btn-secondary' : 'btn-outline-secondary'}`}
      >
        <i className="bi bi-text-right"></i>
      </button>
      
      <div className="vr mx-1"></div>

      <button 
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()} 
        className={`btn btn-sm ${editor.isActive('bulletList') ? 'btn-secondary' : 'btn-outline-secondary'}`}
      >
        <i className="bi bi-list-ul"></i>
      </button>
      <button 
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()} 
        className={`btn btn-sm ${editor.isActive('orderedList') ? 'btn-secondary' : 'btn-outline-secondary'}`}
      >
        <i className="bi bi-list-ol"></i>
      </button>
      <button 
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()} 
        className={`btn btn-sm ${editor.isActive('blockquote') ? 'btn-secondary' : 'btn-outline-secondary'}`}
      >
        <i className="bi bi-quote"></i>
      </button>

      <div className="vr mx-1"></div>

      <button 
        type="button"
        onClick={setLink} 
        className={`btn btn-sm ${editor.isActive('link') ? 'btn-secondary' : 'btn-outline-secondary'}`}
      >
        <i className="bi bi-link-45deg"></i>
      </button>
      <button 
        type="button"
        onClick={addImage} 
        className="btn btn-sm btn-outline-secondary"
      >
        <i className="bi bi-image"></i>
      </button>
      <button 
        type="button"
        onClick={addYoutubeVideo} 
        className="btn btn-sm btn-outline-secondary"
      >
        <i className="bi bi-youtube"></i>
      </button>

      <div className="vr mx-1"></div>

      <input
        type="color"
        onInput={event => editor.chain().focus().setColor(event.target.value).run()}
        value={editor.getAttributes('textStyle').color || '#000000'}
        data-testid="setColor"
        title="Text Color"
        style={{ width: '30px', height: '30px', padding: '0', border: 'none', cursor: 'pointer' }}
      />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={`btn btn-sm ${editor.isActive('highlight') ? 'btn-warning' : 'btn-outline-warning'}`}
        title="Highlight"
      >
        <i className="bi bi-highlighter"></i>
      </button>
    </div>
  );
};

const RichTextEditor = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
      }),
      Youtube.configure({
        controls: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Color,
      TextStyle,
      Highlight,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  return (
    <div className="border rounded overflow-hidden">
      <MenuBar editor={editor} />
      <div className="tiptap-content-wrapper p-3 bg-white" style={{ minHeight: '300px' }}>
        <EditorContent editor={editor} />
      </div>
      <style>{`
        .tiptap-content-wrapper .ProseMirror {
          outline: none;
          min-height: 280px;
        }
        .tiptap-content-wrapper .ProseMirror img {
          max-width: 100%;
          height: auto;
        }
        .tiptap-content-wrapper .ProseMirror iframe {
          max-width: 100%;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
