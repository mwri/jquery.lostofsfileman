// Author: Michael Wright <mjw@methodanalysis.com>
// Copyright (C) 2017 Michael Wright <mjw@methodanalysis.com>, all rights reserved.


(function ($) {


	'use strict';


	$.fn.lostofsfileman = function (first_arg) {

		if (typeof first_arg === 'string') {
			return jqp_method(this, arguments);
		} else if (typeof first_arg === 'object') {
			return jqp_method(this, ['constructor', first_arg]);
		} else {
			throw 'lostofsfileman requires a string (method) or object (constructor) first parameter';
		}

	};


	function jqp_method (this_jqo, args) {

		let method = args[0];

		if (method in methods) {
			args[0] = jQuery.data(this_jqo, 'lostofsfileman');
			return methods[method].apply(this_jqo, args);
		}

		throw 'lostofsfileman has no method "'+method+'"';

	}


	let methods = {

		constructor: function (data, params) {

			this.addClass('lsfsfm_fileman');
			let dir_div = $('<div class="lsfsfm_dir"/>');
			this.append(dir_div);

			let fs       = params.fs;
			let dir_path = params.dir;

			if (dir_path === undefined)
				dir_path = '/';

			let single_dir = typeof params.single_dir !== 'undefined'
				? params.single_dir
				: false;

			let show_hdr = typeof params.no_header !== 'undefined'
				? !params.no_header
				: single_dir ? false : true;

			data = {
				fs:          fs,
				dir_path:    dir_path,
				menu_shform: params.menu_shform || false,
				show_hdr:    show_hdr,
				single_dir:  single_dir,
				menu_extra:  typeof params.menu !== 'undefined' ? params.menu : [],
				file_choose: params.file_choose,
				};
			
			jQuery.data(this, 'lostofsfileman', data);

			let this_jqo = this;

			fs.ready().then(function () {

				fs.get(data.dir_path).then(function (dir) {

					if (dir.type() !== 'dir')
						throw 'path "'+data.dir_path+'" is not a directory';

					data.inode = dir.inode();

					render_dir(this_jqo, data, params);

					fs.on('create', function (dir_ent, ent_name, ent) {
						if (dir_ent.inode() !== data.inode)
							return;
						render_dir(this_jqo, data, params);
					}).on('move', function (src_dir_ent, old_name, dst_dir_ent, new_name, new_path) {
						if (src_dir_ent.inode() !== data.inode && dst_dir_ent.inode() !== data.inode)
							return;
						render_dir(this_jqo, data, params);
					}).on('remove', function (dir_ent, name) {
						if (dir_ent.inode() !== data.inode)
							return;
						render_dir(this_jqo, data, params);
					}).on('ready', function () {
						render_dir(this_jqo, data, params);
					}).on('format', function () {
						data.dir_path = '/';
					});
		
				});

			});

		},

		rendered: function (data) {

			return data.render_prom;

		},

		rename: function (data, name) {

			start_rename(this.find('.lsfsfm_ent[data-entname="'+name+'"]'));

		},

		new_file: function (data, name, content, options) {

			return data.fs.get(data.dir_path).then(function (cur_dir) {
				if (typeof content === 'undefined')
					content = '';
				return cur_dir.mkfile(name, content, options).then(function (new_file) {
					return data.render_prom.then(function () {
						return new_file;
					});
				});
			});

		},

	};


	function render_dir (this_jqo, data, params) {

		let fs       = data.fs;
		let dir_path = data.dir_path;

		let dir_div = this_jqo.find('> .lsfsfm_dir');

		dir_div.find('.lsfsfm_dir_container')
			.off('dragenter')
			.off('dragleave')
			.off('dragover')
			.off('drop');

		let dragenter_count = 0;

		data.render_prom = fs.get(dir_path).then(function (cur_dir) {
			return cur_dir.ls().then(function (ent_ls) {

				dir_div.empty();

				let dir_container = $('<div class="lsfsfm_dir_container" data-dir-path="'+dir_path+'"/>');
				dir_div.append(dir_container);

				if (data.show_hdr) {
					let dir_hdr = $('<div class="lsfsfm_dir_hdr">Location: '+dir_path+'</div>');
					dir_container.append(dir_hdr);
				}

				let dir_entlist = $('<div class="lsfsfm_dir_entlist"/>');
				dir_container.append(dir_entlist);

				let dir_entlist_table = $('<table></table>');
				dir_entlist.append(dir_entlist_table);
				let tbody = $('<tbody/>');
				dir_entlist_table.append(tbody);

				let file_input = $('<input type="file" name="files[]" style="display:none;">');
				dir_container.append(file_input);
				file_input.get(0).addEventListener('change', function (event) {
					let files = event.target.files;
					let file = files[0];
					let filename = file.name;
					let reader = new FileReader();
					reader.onload = (function(theFile) {
						return function(e) {
							cur_dir.mkfile(
								filename,
								e.target.result,
								{ mod_time: file.lastModifiedDate,
									mime_type: file.type,
									free_name: true,
									}
							).catch(function (err) {
								console.log(err);
								alert('create file failed: '+err);
							});
						};
					})(file);
					reader.readAsArrayBuffer(file);
					return false;
				}, false);

				let menu = $('<table/>');
				dir_container.append(menu);
				create_menu(this_jqo, data, menu, fs, cur_dir, file_input).easymenu('attach', dir_container);

				ent_ls = ent_ls.sort(function (a, b) {
					return a[0].toLowerCase() < b[0].toLowerCase()
						? -1
						: a[0].toLowerCase() > b[0].toLowerCase()
							? 1
							: 0;
				});

				for (let i = 0; i < ent_ls.length; i++) {
					if (data.single_dir && (ent_ls[i][0] === '.' || ent_ls[i][0] === '..'))
						continue;
					let ent_name = ent_ls[i][0];
					let ent = ent_ls[i][1];
					let icon_class = ent.type() === 'dir' ? 'lsfsfm_dir_icon' : 'lsfsfm_ent_icon';
					if (ent.type() === 'file' && ent.mime_type() !== undefined)
						icon_class += ' lsfsfm_'+ent.mime_type().replace(/[\/-]/g, '_');
					let tr = $('<tr class="lsfsfm_ent" draggable="true" data-inode="'+ent.inode()+'" data-entname="'+ent_name+'"/>');
					tbody.append(tr);
					let td1 = $('<td/>');
					tr.append(td1);
					let a = $('<a download="'+ent_name+'" href="#"/>');
					td1.append(a);
					let ent_menu = $('<table/>');
					td1.append(ent_menu);
					let icon_span = $('<span class="'+icon_class+'" data-entname="'+ent_name+'"/>');
					td1.append(icon_span);
					let td2 = $('<td/>');
					tr.append(td2);
					let entname_span = $('<span class="lsfsfm_entname" data-entname="'+ent_name+'">'+ent_name+'</span>');
					td2.append(entname_span);
					let td3 = $('<td>'+mod_time_descr(ent.mod_time())+'</td>');
					tr.append(td3);
					let td4 = ent.type() === 'dir'
						? $('<td/>')
						: $('<td>'+size_descr(ent.size())+'</td>');
					tr.append(td4);
					create_menu(
						this_jqo, data, ent_menu, fs, cur_dir, file_input, ent_name, ent, tr
						).easymenu('attach', tr);
					entname_span.blur(function (ev) { // jshint ignore:line
						finish_rename(cur_dir, $(ev.target));
					});
					tr.on('dragstart', function (ev) { // jshint ignore:line
						ev.originalEvent.dataTransfer.setData("text", ev.target.id);
						$(ev.target).addClass('lsfsfm_dragging');
						dragenter_count = 0;
					}).on('dragend', function (ev) { // jshint ignore:line
						ev.preventDefault();
						ev.stopPropagation();
						$('.lsfsfm_dragging').removeClass('lsfsfm_dragging');
					});
					if (ent.type() === 'file') {
						tr.on('dblclick', function (ev) { // jshint ignore:line
							let tr = ev.target;
							while (tr.tagName !== 'TR') {
								tr = tr.parentElement;
							}
							cur_dir.get($(a).attr('download')).then(function (ent) {
								if (typeof data.file_choose === 'undefined')
									data_download(a.get(0), ent, $(a).attr('download'));
								else
									data.file_choose(ent);
								return true;
							}).catch(function (err) {
								console.log(err);
							});
							ev.preventDefault();
							ev.stopPropagation();
							return false;
						});
					} else {
						tr.on('dblclick', function (ev) { // jshint ignore:line
							if (ent_name === '..') {
								if (data.dir_path !== '/') {
									let match = /^(.*)\/[^\/]+$/.exec(data.dir_path);
									if (match) {
										data.dir_path = match[1] === '' ? '/' : match[1];
										fs.get(data.dir_path).then(function(new_dir) {
											data.inode = new_dir.inode();
											render_dir(this_jqo, data, params);
										});
									}
								}
							} else if (ent_name !== '.') {
								data.dir_path = data.dir_path === '/'
									? '/'+ent_name
									: data.dir_path+'/'+ent_name;
								fs.get(data.dir_path).then(function(new_dir) {
									data.inode = new_dir.inode();
									render_dir(this_jqo, data, params);
								});
							}
						});
					}
				}

				dir_container
					.on('dragenter', function (ev) {
						ev.preventDefault();
						ev.stopPropagation();
						if (dragenter_count === 0)
							dir_container.addClass('lsfsfm_dir_draghover');
						dragenter_count++;
						})
					.on('dragleave', function (ev) {
						ev.preventDefault();
						ev.stopPropagation();
						dragenter_count--;
						if (dragenter_count === 0)
							dir_container.removeClass('lsfsfm_dir_draghover');
						return false;
						})
					.on('dragover', false) 
					.on('drop', function (ev_drop) {
						dir_container.removeClass('lsfsfm_dir_draghover');
						dragenter_count = 0;
						ev_drop.preventDefault();
						ev_drop.stopPropagation();
						let files = ev_drop.originalEvent.dataTransfer.files;
						let drag_tr = $('.lsfsfm_dragging');
						if (files.length > 0) {
							for (var i = 0; i < files.length; i++) {
								let reader = new FileReader();
								reader.onload = function (ev_readeronload) { // jshint ignore:line
									cur_dir.mkfile(
										files[i].name,
										ev_readeronload.target.result,
										{ mod_time: files[i].lastModifiedDate,
											mime_type: files[i].type,
											free_name: true,
											}
									).catch(function (err) {
										console.log(err);
										alert(err);
									});
								};
								reader.readAsArrayBuffer(files[i]);
								return false;
							}
						} else if (drag_tr.length > 0) {
							let dragged_ent_name = $('.lsfsfm_dragging').find('.lsfsfm_entname').text();
							let dragged_dir_path = $('.lsfsfm_dragging')
								.closest('.lsfsfm_dir_container')
								.attr('data-dir-path');
							let dragged_ent_path = dragged_dir_path+'/'+dragged_ent_name;
							fs.get(dragged_dir_path).then(function(dragged_dir_ent) {
								return dragged_dir_ent.move(dragged_ent_name, dir_path+'/'+dragged_ent_name);
							}).catch(function (err) {
								console.log(err);
								alert(err);
							});
						}
						return false;
					});

			});

		}).catch(function (err) {
			console.log(err);
			throw err;
		});

	}


	function create_menu (this_jqo, data, menu, fs, cur_dir, file_input, ent_name, ent, tr) {

		let menu_items = [];
		if (!data.single_dir) {
			menu_items.push(
				{ label: 'New directory',
					title: 'Create a new directory',
					callback: function () {
							cur_dir.mkdir('New directory', {free_name: true}).then(function (new_dir) {
								return data.render_prom.then(function () {
									start_rename(this_jqo.find('.lsfsfm_ent[data-inode="'+new_dir.inode()+'"]'));
								});
							}).catch(function (err) {
								console.log(err);
								console.log(err);
							});
						},
					}
				);
		}
		menu_items.push(
			{ label: 'Upload file',
				title: 'Specify a file for upload to the directory',
				classes: ['lsfsfm_upload'],
				callback: function () {
						file_input.focus().trigger('click');
					},
				}
			);
		if (ent !== undefined) {
			menu_items.push(
				{ type: 'separator' }
				);
			menu_items.push(
				{ label: 'Rename',
					title: 'Change the name of the file or directory',
					callback: function () {
							start_rename(tr);
						},
					}
				);
			menu_items.push(
				{ label: 'Delete',
					title: 'Delete the file or directory',
					callback: function () {
							cur_dir.remove(ent_name).catch(function (err) {
								console.log(err);
								alert(err);
							});
						},
					}
				);
		}
		if (data.menu_shform) {
			menu_items.push(
				{ type: 'separator' }
				);
			menu_items.push(
				{ label: 'Format FS',
					title: 'Format the filesystem, ALL DATA WILL BE LOST!',
					callback: function () {
							if (confirm('ARE YOU SURE? Formatting will ERASE all data! Click OK to proceed or cancel to abort.')) {
								fs.format().catch(function (err) {
									alert(err);
								});
							}
						},
					}
				);
		}

		if (data.menu_extra.length > 0) {
			menu_items.push(
				{ type: 'separator' }
				);
			for (let i = 0; i < data.menu_extra.length; i++)
				menu_items.push(data.menu_extra[i]);
		}

		return menu.easymenu({
			menu_items: menu_items,
			});

	}


	function start_rename (tr) {

		let entname_span = tr.find('.lsfsfm_entname');
	
		entname_span
			.attr('contenteditable', 'true')
			.attr('spellcheck', 'false')
			.attr('data-renaming', 'true')
			.keypress(function(ev) {
				if (ev.which === 13) {
					$(document.activeElement).blur();
					return false;
				} else {
					return true;
				}
			});

		entname_span.focus();
		document.execCommand("selectall", null, false);

	}


	function finish_rename (cur_dir, entname_span) {

		if (entname_span.attr('data-renaming') !== 'true')
			return;

		entname_span.attr('data-renaming', 'false');

		let old_name = entname_span.attr('data-entname');
		let new_name = entname_span.text();

		if (old_name !== new_name) {
			cur_dir.move(old_name, new_name).then(function () {
				entname_span.attr('data-entname', new_name);
			}).catch(function (err) {
				entname_span.attr('data-entname', old_name);
				entname_span.text(old_name);
				console.log(err);
				alert('rename failed: '+err);
			});
		}

		entname_span.attr('contenteditable', 'false');

	}


	function data_download (a, file, name) {

		return file.data().then(function (content) {
			let mime_type = file.mime_type() || 'application/octet-binary';
			var blob      = new Blob([content], {type: mime_type});
			var url       = window.URL.createObjectURL(blob);
			a.href        = url;
			a.download    = name;
			a.click();
			window.URL.revokeObjectURL(url);
		}).catch(function (err) {
			console.log(err);
			alert('file download failed: '+err);
		});

	}


	function size_descr (size) {

		return size > 1000000000
				? Math.round(size/100000000)/10 + ' GB'
			: size > 1000000
				? Math.round(size/100000)/10 + ' MB'
			: size > 1000
				? Math.round(size/100)/10 + ' KB'
			: size + ' bytes';

	}


	function mod_time_descr (date) {

		let mod_date = new Date(date);
		let today    = new Date();
		let descr    = '';

		if (mod_date.getDate() !== today.getDate()
				|| mod_date.getMonth() !== today.getMonth()
				|| mod_date.getYear() !== today.getYear()
				) {
			descr += mod_date.getFullYear();
			descr += '/';
			descr += mod_date.getMonth() > 9
				? mod_date.getMonth()
				: '0'+mod_date.getMonth();
			descr += '/';
			descr += mod_date.getDate() > 9
				? mod_date.getDate()
				: '0'+mod_date.getDate();
		} else {
			descr += mod_date.getHours() > 9
				? mod_date.getHours()
				: '0'+mod_date.getHours();
			descr += ':';
			descr += mod_date.getMinutes() > 9
				? mod_date.getMinutes()
				: '0'+mod_date.getMinutes();
			descr += ':';
			descr += mod_date.getSeconds() > 9
				? mod_date.getSeconds()
				: '0'+mod_date.getSeconds();
		}

		return descr;

	}


} (jQuery));
