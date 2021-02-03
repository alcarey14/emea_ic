//experimental.js - vanilla js testing
var importLink = document.createElement("div");
    importLink.className = "TopbarPageHeaderGlobalActions-omnibutton"
    importLink.innerHTML = "<input id=\"import-input\" class=\"textInput textInput--medium asana-import\" placeholder=\"project...\" type=\"text\" role=\"combobox\" value=\"\">\
                            <select class=\"Button Button--small asana-import\" id=\"import-micro\">\
                              <option></option>\
                              <option value=\"1199675056706737\">Change Management Microtemplate</option>\
                            </select>\
                            <button class=\"Button Omnibutton Button--primary Button--small asana-import\" id=\"import-button\">Import</button>";

//get complete task list for templates
var getTasks = function () {
  document.getElementById('import-button').onclick = function () {
    x = document.getElementsByClassName("asana-import");
    for (var i = 0; i < x.length; i++) {
      x[i].setAttribute("disabled", true)
    }
    var selector = document.getElementById('import-micro');
    var projectId = selector[selector.selectedIndex].value;
		if (projectId != '') {
      callAsanaApi('GET', `projects/${projectId}/tasks`, {'opt_expand': '(custom_fields|html_notes|resource_subtype)'}, {}, function (response) {
        var tasks = response.data;
        console.log('response', tasks);
        customFields(tasks);
      });
  	}
  }
}

var customFields = function (tasks) {
	if(tasks.length > 0){
		var task = tasks.pop();
		var taskName = task.name
		var taskFields = task.custom_fields
   
    var customFieldsArr = {};
    for(var k = 0; k < taskFields.length; k++) {
      var customId = taskFields[k].gid
      var customType = taskFields[k].enum_value
			if (customType != null) {
        customValue = customType.gid
        console.log(customId, customValue);
        customFieldsArr[customId] = customValue;
      }
    }
	
		var subType = task.resource_subtype
		var notes = task.html_notes
    var input = document.getElementById('import-input');
    var project = input.value;

		if(subType == 'section'){
			dataArr = {
				"name": taskName,
				"projects": project
			}
		} else {
			dataArr = {
        "name": taskName,
        "projects": project,
        "html_notes": notes,
        "resource_subtype": subType,
        "custom_fields": customFieldsArr
			}
    }

		createTask(dataArr, function () {
      console.log("Created a task! Task:", taskName);  //onSuccess
      customFields(tasks);
		},function () { 
			console.log("Failed creating a task! Task:", taskName);  //onFail
		});
	} else {
		console.log("All done!");
    for (var i = 0; i < x.length; i++) {
      x[i].removeAttribute("disabled");
    }
	}
}

//create task, loop back through customFields onSuccess
var createTask = function (dataArr, onSuccess, onFail) {
  callAsanaApi('POST', `tasks`, {}, dataArr, function () {
    if (status >= 200 && status < 300) {
      onSuccess();
    } else {
      onFail();
    }
  });
}

//first load/page reload 
window.addEventListener('load', function () {
  console.log("experimental.js loaded");
  var avatar = document.getElementsByClassName('TopbarPageHeaderGlobalActions-settingsMenuButton')[0];
  document.getElementsByClassName('TopbarPageHeaderGlobalActions')[0].insertBefore(importLink, avatar);
	getTasks();
});

//asana api
var callAsanaApi = function (request, path, options, data, callback) {
  var xhr = new XMLHttpRequest();
  xhr.addEventListener('load', function () {
    callback(JSON.parse(this.response));
  });
  xhr.onreadystatechange = function () {
    status = xhr.status;
    return status;
  };
  var manifest = chrome.runtime.getManifest();
  var client_name = ['chrome-extension', manifest.version, manifest.name].join(':'); // Be polite to Asana API
  var requestData;
  if (request === 'POST' || request === 'PUT') {
    requestData = JSON.stringify({'data': data});
    options.client_name = client_name;
  } else {
    options.opt_client_name = client_name;
  }
  var requestUrl = 'https://app.asana.com/api/1.0/' + path;
  if (Object.keys(options).length) {
    var parameters = '';
    for (var key in options) {
      if (options.hasOwnProperty(key)) {
        parameters += [key, '=', options[key], '&'].join('');
      }
    }
    parameters = parameters.slice(0, -1);
    requestUrl += '?' + parameters;
  }
  console.log(request)
  console.log(requestUrl)
  console.log(requestData)
  xhr.open(request, encodeURI(requestUrl));
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('X-Allow-Asana-Client', '1'); // Required to authenticate for POST & PUT
  xhr.send(requestData);

};