import { useRef, useEffect } from 'react';
import { Editor } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css';
import '@/styles/features/admin/RichTextEditor.css';

interface RichTextEditorProps {
  /** Current markdown value */
  value: string;
  /** Callback when content changes */
  onChange: (markdown: string) => void;
  /** Placeholder text shown when editor is empty */
  placeholder?: string;
  /** Height of the editor (default: 240px for ~8 rows) */
  height?: string;
  /** Whether the editor is disabled */
  disabled?: boolean;
}

/**
 * RichTextEditor - A reusable markdown editor component using Toast UI Editor
 * 
 * Features:
 * - Outputs markdown format
 * - Basic toolbar: Bold, Italic, Headings, Lists
 * - Dark theme to match admin panel aesthetic
 */
const RichTextEditor = ({
  value,
  onChange,
  placeholder = 'Enter content...',
  height = '240px',
  disabled = false,
}: RichTextEditorProps) => {
  const editorRef = useRef<Editor>(null);
  const isInternalChange = useRef(false);

  // Handle content changes from the editor
  const handleChange = () => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    
    const editorInstance = editorRef.current?.getInstance();
    if (editorInstance) {
      const markdown = editorInstance.getMarkdown();
      onChange(markdown);
    }
  };

  // Sync external value changes to editor (e.g., when loading data for edit)
  useEffect(() => {
    const editorInstance = editorRef.current?.getInstance();
    if (editorInstance) {
      const currentMarkdown = editorInstance.getMarkdown();
      // Only update if value is different to avoid cursor jump
      if (value !== currentMarkdown) {
        isInternalChange.current = true;
        editorInstance.setMarkdown(value || '');
      }
    }
  }, [value]);

  return (
    <div className={`rich-text-editor-wrapper ${disabled ? 'rich-text-editor-disabled' : ''}`}>
      <Editor
        ref={editorRef}
        initialValue={value || ''}
        placeholder={placeholder}
        previewStyle="tab"
        height={height}
        initialEditType="wysiwyg"
        useCommandShortcut={true}
        onChange={handleChange}
        hideModeSwitch={true}
        toolbarItems={[
          ['heading', 'bold', 'italic', 'strike'],
          ['ul', 'ol'],
          ['hr'],
        ]}
      />
    </div>
  );
};

export default RichTextEditor;
