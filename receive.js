const config = require('./config');
const AWS = require('aws-sdk');

const {region, queueURL} = config
AWS.config.update({region});
const sqs = new AWS.SQS({apiVersion: '2012-11-05'});

const params = {
	AttributeNames: [
		"SentTimestamp"
	],
	MaxNumberOfMessages: 10,
	MessageAttributeNames: [
		"All"
	],
	QueueUrl: queueURL,
	VisibilityTimeout: 2,
	WaitTimeSeconds: 20
};

function poll() {
	return new Promise((resolve, reject) => {
		sqs.receiveMessage(params, function(err, data) {
			if (err) {
				reject(err);
			} else if (data.Messages) {
				resolve(data.Messages)
			}
		});
	})
}

poll().then(messages => console.log(messages));
