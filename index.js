const config = require('./config');
const fs = require('fs');
const AWS = require('aws-sdk');
const chokidar = require('chokidar');


function listObjects(config) {
	const s3 = new AWS.S3();
	const params = {
		Bucket: "s3sync-v1",
	}
	s3.listObjects(params, function(err, data) {
		if (err) {
			console.log(err);
		} else {
			console.log(data);
		}
	});
}
listObjects(config);


function s3sync(config) {

	// Initialize watcher.
	const watcher = chokidar.watch(config.directory, { persistent: true });

	watcher
		.on('add', path => add(path))
		.on('change', path => change(path))
		.on('unlink', path => remove(path))

	function add(path) {
		if (path.indexOf('.DS_Store') > 0) {
			return false;
		}
		const parts = path.split('/');
		const fileName = parts[parts.length -1];
		const fileContent = fs.readFileSync(path);
		const params = {
			Bucket: config.bucket,
			Key: fileName, // File name you want to save as in S3
			Body: fileContent
		};

		const s3 = new AWS.S3();
		s3.upload(params, (err, data) => {
			if (err) {
				throw err;
			}
			console.log(`File uploaded successfully. ${data.Location}`);
		});
	}

	function change(path) {
		console.log('change ' + path);
	}

	function remove(path) {
		console.log('remove ' + path)
	}
}
// s3sync(config);



