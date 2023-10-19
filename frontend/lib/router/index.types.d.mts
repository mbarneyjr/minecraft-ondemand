export interface State {
  head: {
    title?: string;
    description?: string;
  };
  // file-editor state
  filesDirectory?: string;
  currentPath?: string;
  isDirectory?: boolean;
  files?: Array<{ name: string; path: string; isDirectory: boolean }>;
}
