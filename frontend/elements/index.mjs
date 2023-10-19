import * as Hello from './hello.mjs';
import * as TitleBar from './title-bar.mjs';
import * as FileEditor from './file-editor.mjs';
import * as AdminControlList from './admin-control-list.mjs';

export default {
  [Hello.ELEMENT_NAME]: Hello.element,
  [TitleBar.ELEMENT_NAME]: TitleBar.element,
  [FileEditor.ELEMENT_NAME]: FileEditor.element,
  [AdminControlList.ELEMENT_NAME]: AdminControlList.element,
};
