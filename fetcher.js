const fetch = require("node-fetch");
const fs = require("fs");
const extra = require("fs-extra");
const shell = require('shelljs')

let options = require("./options.json");

//Override fs.readFile to return a Promise
fs.readFileAsync = function(filename,enc){
	return new Promise(function(resolve,reject){
		fs.readFile(filename,enc,function(err,data){
			if(err){
				reject(err);
			}else{
				resolve(data);
			}
		});
	});
}

if(options["fetchAll"]){

	//Delete temp dir
	shell.rm("-rf","./temp");

	//Get files from git
	shell.exec("git clone "+options["gitUrl"]+":"+options["testName"]+" ./temp");
	let files = fs.readdirSync("./temp");

	//Remove .git file
	let index = files.indexOf(".git");
	if(index>-1){
		files.splice(index,1);
	}

	Promise.all(files.map(fileName=>fs.readFileAsync("./temp/"+fileName,"utf8"))).then(data=>{
		copyToProject(files,data);
	});

	//Delete temp dir
	shell.rm("-rf","./temp");
	
}else{
	//Set up the requested test files
	let toFetch = [];
	options["tests"].forEach(s=>{
		toFetch.push(s+".cc");
		toFetch.push(s+".ok");
	});

	//Retrieve all requested tests concurrently
	Promise.all(toFetch.map(s=>fetch(options["websiteUrl"]+"/"+s))).then(responses=>{
		//Map response to text
		return Promise.all(responses.map(response => response.text()));
	}).then(data=>{
		copyToProject(toFetch,data);
	});
}

function copyToProject(namesList, dataList){
	//For each fetched file, write it to the project directory
	let projectPath = options["projectPath"];
	console.log("Copying to "+projectPath+"...");
	for(let i = 0; i<namesList.length;i++){
		let filePath = projectPath+"/"+namesList[i];
		extra.ensureFile(filePath).then(()=>{
			fs.writeFile(filePath,dataList[i],err=>{
				if(err){
					console.error(err);
				}
			});
		});
	}
}