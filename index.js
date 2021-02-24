const config = require('./config');
const fs = require('fs');
const AWS = require('aws-sdk');
const chokidar = require('chokidar');


const downloadBucketState = config => {
	return new Promise((resolve, reject) => {
		const s3 = new AWS.S3();
		const params = {
			Bucket: "s3sync-v1",
		}
		s3.listObjects(params, function(err, data) {
			if (err) {
				reject(err)
			} else {
				fs.writeFile('bucket-state', JSON.stringify(data), () => {});
				resolve(data);
			}
		});
	});
}

const ignore = path => {
	return config.ignore.filter(e => path.indexOf(e) > -1)[0];
};

const add = path => {

	if (ignore(path)) {
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

	const s3 = new AWS.S3({
		accessKeyId: config.accessKeyId,
		secretAccessKey: config.secretAccessKey
	});

	s3.upload(params, (err, data) => {
		if (err) {
			throw err;
		}
		console.log(`File uploaded successfully. ${data.Location}`);
	});
}

const remove = path => {
	console.log('remove ' + path)
	if (ignore(path)) {
		return false;
	}
}

const change = path => {
	console.log('change ' + path);
	if (ignore(path)) {
		return false;
	}
}

const watchDirectory = config => {
	// Initialize watcher.
	const watcher = chokidar.watch(config.directory, { persistent: true });
	watcher
		.on('add', path => add(path))
		.on('change', path => change(path))
		.on('unlink', path => remove(path))
}

function run(config) {
	downloadBucketState()
		.then(data => {
			console.log(data);
			watchDirectory(config);
		});
}

// entry
run(config);





