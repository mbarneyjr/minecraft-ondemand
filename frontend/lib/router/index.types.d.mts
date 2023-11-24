interface FileEditorFile {
  name: string;
  fileType: 'binary' | 'text' | 'directory';
}
export interface State {
  head: {
    title?: string;
    description?: string;
  };
  /** file editor state */
  fileEditor?: {
    /** the currently explored directory */
    currentDirectory: string;
    /** the list of files in the current directory */
    files: Array<FileEditorFile>;
    /** if selected, the currently selected file */
    currentFile?: FileEditorFile;
    /** if selected, the content of the currently selected file */
    currentFileContent?: string;
  };
}
