var esprima = require("esprima");
var options = {tokens:true, tolerant: true, loc: true, range: true };
var fs = require("fs");
function main()
{
	var git = fs.readFileSync("stage.txt", "utf8");
	lines = git.split('\n');
	flag = 0;
	for(var i = 0; i < lines.length; i++)
	{
		if( lines[i] == 'Changes to be committed:')
		{
			flag = i;
			break;
		}
	}
	var new_file = []
	for( var i = flag+3; i < lines.length; i++)
	{
		if(lines[i].length > 3)
		{
			// console.log(lines[i].split('   '));
			if(lines[i].split('   ')[0].indexOf('new file') > -1 || lines[i].split('   ')[0].indexOf('modified') > -1)
			{
				new_file.push(lines[i].split('   ')[1]);	
			}
		}
		else
		{
			break;
		}
	}
	if(new_file.length > 0) console.log("Files to be committed: ", new_file);

	var suspects = [];
	var ss = {};
	for( var i = 0; i < new_file.length; i++)
	{
		ss[new_file[i]] = []
		if( new_file[i].indexOf('.') > -1)
		{
			var tmp = new_file[i].split('.');
			var type = tmp[tmp.length - 1];
			// console.log(type);
			if(type.toLowerCase() == 'js')
			{
				var tmp = checking(new_file[i]);
				for(var j = 0; j < tmp.length; j++) {
					suspects.push(tmp[j]);
					ss[new_file[i]].push(tmp[j]);
				}
			}
			else if(type.toLowerCase() == 'json')
			{
				// console.log(new_file[i]);
				var json_data = require('./package.json');
				// console.log(json_data);
				traverse_json(json_data,function(key, value)
				{
					if(typeof value == 'string' && value.indexOf('http') < 0 
						&& value.indexOf(' ') < 0 && (value.length == 20 || value.length == 40 || value.length ==64))
					{
						// console.log(value);	
						suspects.push(value);
						ss[new_file[i]].push(value);
					}
				});
			}
			else if(type.toLowerCase() == 'pem' || type.toLowerCase() == 'key')
			{
				var key = fs.readFileSync(new_file[i], "utf8");
				suspects.push(key);
				ss[new_file[i]].push(key);
			}
		}
		else
		{
			var content = fs.readFileSync(new_file[i], "utf8");
			if(content.length > 100 
				&& (content.indexOf('ssh-rsa') > -1 || content.indexOf('PRIVATE KEY') > -1))
			{
				suspects.push(content);
				ss[new_file[i]].push(content);
			}
		};

	};
	var flag = 0;
	for( file in ss)
	{
		if(ss[file].length > 0)
		{
			console.log("\nSuspects detected in " + file + "!!\n ===> " + ss[file]);
			flag = 1;
		}
		else
		{
			console.log("\nSuspects detected not in " + file + "." );	
		}
	}
	if(flag == 0)
	{
		console.log("No suspects detected in all committed files!")
	}
	// if(suspects.length > 0) console.log(suspects);
	// else console.log("No security token detected!")

	// console.log(ss);
	

	// Report
	// for( var node in builders )
	// {
	// 	var builder = builders[node];
	// 	builder.report();
	// }

}

function checking(filePath)
{
	var buf = fs.readFileSync(filePath, "utf8");
	var ast = esprima.parse(buf, options);
	var suspect = []
	traverse(ast, function(node)
	{
		if( node.type == 'Literal')
		{

			// console.log(node);
			if(typeof node.value == 'string' && node.value.indexOf(' ') < 0 && (node.value.length == 20 || node.value.length == 40 || node.value.length == 64))
			{
				suspect.push(node.value);
			}
		}
	});
	return suspect;
}

function traverse(object, visitor) 
{
    var key, child;

    visitor.call(null, object);
    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key];
            if (typeof child === 'object' && child !== null) {
                traverse(child, visitor);
            }
        }
    }
}

// A function following the Visitor pattern but allows canceling transversal if visitor returns false.
function traverseWithCancel(object, visitor)
{
    var key, child;

    if( visitor.call(null, object) )
    {
	    for (key in object) {
	        if (object.hasOwnProperty(key)) {
	            child = object[key];
	            if (typeof child === 'object' && child !== null) {
	                traverseWithCancel(child, visitor);
	            }
	        }
	    }
 	 }
}


function traverse_json(o,func) {
    for (var i in o) {
        func.apply(this,[i,o[i]]);  
        if (o[i] !== null && typeof(o[i])=="object") {
            traverse_json(o[i],func);
        }
    }
}

main();

exports.main = main;
exports.checking = checking;
exports.traverse = traverse;
exports.traverseWithCancel = traverseWithCancel;
exports.traverse_json = traverse_json;