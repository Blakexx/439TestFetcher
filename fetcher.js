const fetch = require("node-fetch");
const fs = require("fs");
var extra = require("fs-extra");
const shell = require('shelljs')

let options = require("./options.json");

//Override fs.readFile to make it return a promise
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

//Remove temp dir
shell.rm("-rf","./temp");

//Get files from git
shell.exec("git clone "+options["gitUrl"]+":"+options["testName"]+" ./temp");
let files = fs.readdirSync("./temp");

//Filter out files
let index = files.indexOf(".git");
if(index>-1){
	files.splice(index,1);
}
if(!options["fetchAll"]){
	let toRetain = options["tests"];
	files = files.filter(fileName=>{
		let index = fileName.lastIndexOf(".");
		let name = fileName.substring(0,index);
		return toRetain.includes(name);
	});
}

//Excecute reads concurrently
Promise.all(files.map(fileName=>fs.readFileAsync("./temp/"+fileName,"utf8"))).then(data=>{
	copyToProject(files,data);
});

//Remove temp dir
shell.rm("-rf","./temp");

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

