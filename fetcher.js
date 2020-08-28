const fetch = require("node-fetch");
const fs = require("fs");
var extra = require("fs-extra");

let options = require("./options.json");

//Set up the requested test files
let toFetch = [];
options["tests"].forEach(s=>{
	toFetch.push(s+".cc");
	toFetch.push(s+".ok");
});

//Retrieve all requested tests concurrently
Promise.all(toFetch.map(s=>fetch(options["testsUrl"]+"/"+s))).then(responses=>{
	//Map response to text
	return Promise.all(responses.map(response => response.text()));
}).then(data=>{
	//For each fetched file, write it to the project directory
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