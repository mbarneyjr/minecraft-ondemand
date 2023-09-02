import * as Hello from './hello.mjs';
import * as TitleBar from './title-bar.mjs';

export default {
  [Hello.ELEMENT_NAME]: Hello.element,
  [TitleBar.ELEMENT_NAME]: TitleBar.element,
};
