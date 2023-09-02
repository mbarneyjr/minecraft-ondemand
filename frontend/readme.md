# Frontend Template

This template largely relies on [Enhance SSR](https://github.com/enhance-dev/enhance-ssr) for server-side rendering.
Everything in the `lib/` directory should be relatively static and not require modification.
The other directories you will modify to add your own content to are the following:

**elements**

This is where you'll put Enhance element functions to compose re-usable components.
You'll want to make sure you register the elements in `./elements/index.mjs`.

**pages**

This is where you'll put each page of your site.
You'll also want to register these in `./pages/register.mjs`.

**head**

This is where you can configure a custom `<head>` tag for your site.
