# jquery.lostofsfileman [![Build Status](https://travis-ci.org/mwri/jquery.lostofsfileman.svg?branch=master)](https://travis-ci.org/mwri/jquery.lostofsfileman)

jQuery file manager plugin for [LOSTOFS](https://github.com/mwri/lostofs).

[LOSTOFS](https://github.com/mwri/lostofs) (LOcal STOrage FileSystem) could
be interfaced to GUIs in various ways, this jQuery plugin implements a simple
traditional looking file manager.

A demo is available (in the 'demo' folder of the jquery.lostofsfileman
distribution). To access the demo, run `npm install` and `grunt build`
to, among other, things build a [LOSTOFS](https://github.com/mwri/lostofs)
bundle, and then `./node_modules/http-server/bin/http-server demo` to run
a HTTP server for the demo files.

In a production environment it will probably be more efficient to build
your own webpack or browserify bundle.

## Usage

A [LOSTOFS](https://github.com/mwri/lostofs) filesystem object must be
passed to the jquery.lostofsfileman object, which is just an interface
to the filesystem.

```js
let fs = new lostofs_fs({unformatted:'format'});

$('#some_div').lostofsfileman({
    fs: fs
    });
```

Besides the mandatory `fs` parameter, `dir` and `menu_shform` are additional
optional parameters.

Parameter   | Description
:--         | :--
dir         | set the directory displayed (default is /, the root)
menu_shform | default false, adds a 'format' option to the file manager menu if true
no_header   | default is false, removes the header (with the current dir) if true
single_dir  | default is false, removes . and .. and 'make directory' from the menu

## Build

run `npm install` to install the dev/build and demo dependencies, and
`grunt build` to build.

## Running the demo

Run `./node_modules/http-server/bin/http-server demo` (after build).
