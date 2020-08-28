const fetch = require("node-fetch");
const fs = require("fs");
var extra = require("fs-extra");

let options = require("./options.json");

let toFetch = [];
options["tests"].forEach(s=>{
	toFetch.push(s+".cc");
	toFetch.push(s+".ok");
});

Promise.all(toFetch.map(s=>fetch(options["testsUrl"]+"/"+s))).then(responses=>{
	return Promise.all(responses.map(response => response.text()));
}).then(data=>{
	let projectPath = options["projectPath"];
	for(let i = 0; i<toFetch.length;i++){
		let filePath = projectPath+"/"+toFetch[i];
		extra.ensureFile(filePath).then(()=>{
			fs.writeFile(filePath,data[i],err=>{
				if(err){
					console.error(err);
				}
			});
		});
	}
});