const child = require('child_process').spawn;
const dcm2json = `${__rootDir}/dcmtk/${osType}/dcm2json${((mac)?'':'.exe')}`;
const dcmodify = `${__rootDir}/dcmtk/${osType}/dcmodify{((mac)?'':'.exe')}`;

class DCMTK {
	constructor() {}

	async getTags(file) {
		return new Promise((resolve, reject) => {
			let cmd = child(dcm2json, [file, '-fc']);
			let str = '';
			let json;

			let filterResults = () => {
				json = JSON.parse(str);
				for (let prop in json) {
					if (json[prop].InlineBinary) {
						delete json[prop];
					}
				}
				resolve(json);
			}

			cmd.stdout.on('data', (data) => {
				data = data.toString();
				if (data.includes('"7fe00010"')) {
					data = data.split(/,\s*"7fe00010"/)[0];
					str += data + '}';
					cmd.kill('SIGINT');
					filterResults();
				} else {
					str += data;
				}
			});

			cmd.on('end', filterResults);

			cmd.on('error', (err, item) => reject(err, item));
		});
	}

	async modifyTags(file, tags) {
		let args = [file];

		for (let tag of tags) {
			args.push('-i');
			args.push(`${tag.idx}=${tag.val}`);
		}
		await spawn(dcmodify, args, {
			stdio: 'inherit'
		});
		return file + '.bak';
	}
}

module.exports = new DCMTK();
