/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// eslint-disable-next-line import/no-unresolved
import * as components from '@mbarneyjr/webcomponents';

components.utils.theme.init();

const themeToggle = document.getElementById('theme-toggle');
themeToggle?.addEventListener('click', components.utils.theme.toggleTheme);
