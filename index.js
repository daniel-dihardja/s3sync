const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const chokidar = require('chokidar');

const config = {
	directory: '/Users/danieldihardja/s3sync',
	bucket: '',
	region: '',
	ignore: ['.DS_Store']
}

function s3sync(config) {

	// Initialize watcher.
	const watcher = chokidar.watch(config.directory, { persistent: true });

	watcher
		.on('add', path => add(path))
		.on('change', path => change(path))
		.on('unlink', path => remove(path))

	function add(path) {
		console.log('add ' + path);
	}

	function change(path) {
		console.log('change ' + path);
	}

	function remove(path) {
		console.log('remove ' + path)
	}
}

s3sync(config);



