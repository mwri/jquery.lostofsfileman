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

### Constructor

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
menu        | default is none, but if an array is given, add extra options to the context menu
file_choose | replaces the file selection function, see below

When using **menu**, menu items must be as per
[jquery.easymenu](https://github.com/mwri/jquery.easymenu), for example the
following would add a 'Ping' menu option to the bottom of the filemanagers
context menu:

```js
let fm = $('#some_div').lostofsfileman({
    fs: fs,
    menu: [
		{ label: 'Ping', callback: function () { alert('pong'); } }
	]});
```

When using **file_choose** the default file selection action function is
replaced. The default is usually to download the file, but when integrated
as part of a web app it may be required to select the file for the app
instead. The function provided will be invoked when a file is double clicked
and the file/entity provided as a parameter:

```js
let fm = $('#some_div').lostofsfileman({
    fs: fs,
    file_choose: function (ent) { console.log('choose inode '+ent.inode()); },
	});
```

### Other API calls

#### new_file

```js
fm.lostofsfileman('new_file', 'new_file.txt');
```

Creates a new file in the currently displayed directory. Optionally
the file content may be given as a third parameter.

A promise is returned which resolves to the new file/entity when the
file manager has rerendered.

#### rename

Call to rename a file in the currently displayed directory.

```js
fm.lostofsfileman('rename', 'some_file.txt');
```

There is no replacement filename, this initiates a rename in the
filemanager, i.e. the filename becomes editable and focused.

#### rendered

When an event causes the GUI to be rerendered, a promise is created
during the render (since the render is based on asynchronous access
to a filesystem). This API call returns the promise.

```js
do_thing_that_causes_update(fm);
fm.lostofsfileman('rendered').then(function () {
	do_thing_that_requires_uptodate_render();
});
```

## Events

The 'rendered' event is emitted when ever the plugin finishes rerendering.

## Build

run `npm install` to install the dev/build and demo dependencies, and
`grunt build` to build.

## Running the demo

Run `./node_modules/http-server/bin/http-server demo` (after build).
