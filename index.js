const config = require('./config');
const fs = require('fs');
const path = require('path');
const {
	S3Client,
	ListObjectsCommand,
	PutObjectCommand,
	GetObjectCommand
} = require('@aws-sdk/client-s3');

const chokidar = require('chokidar');

const s3 = new S3Client({
	region: config.region,
	accessKeyId: config.accessKeyId,
	secretAccessKey: config.secretAccessKey
})

const downloadUpdate = async (config, diff) => {
	for (let i=0; i<diff.length; i++) {
		const params = {
			Bucket: config.bucket,
			Key: diff[i].Key
		}
		const f = await s3.send(new GetObjectCommand(params));
		const file = path.join(config.directory, diff[i].Key);
		fs.writeFileSync(file, f.Body);
	}
}

const diffStates = (localState, serverState) => {
	const local = localState ? localState.Contents : [];
	const server = serverState ? serverState.Contents : [];

	const diff = server.filter((e, i) => {
		if (! local[i]) {
			return true;
		}
	});
	return diff;
}

const getLocalBucketState = () => {
	try {
		const data = fs.readFileSync('./bucket-state', 'utf-8');
		return JSON.parse(data);
	} catch(err) {
		return null;
	}
}

const getRemoteBucketState = async config => {
	const params = {
		Bucket: config.bucket
	}
	try {
		const data = await s3.send(new ListObjectsCommand(params));
		return data;
	} catch(err) {
		return null;
	}
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
	/*
	watcher
		.on('add', path => add(path))
		.on('change', path => change(path))
		.on('unlink', path => remove(path))
	*/
}


async function run (config) {
	const localBucketState = getLocalBucketState();
	const serverBucketState = await getRemoteBucketState(config);
	const diff = diffStates(localBucketState, serverBucketState);
	await downloadUpdate(config, diff);
	fs.writeFileSync('bucket-state', JSON.stringify(serverBucketState));

	// console.log(d);
	/*
	getBucketUpdates(config)
		.then(data => {
			console.log(data);
			watchDirectory(config);
		});
	*/
}


// entry
run(config);





