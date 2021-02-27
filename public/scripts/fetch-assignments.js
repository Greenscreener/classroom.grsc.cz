let courses = [];
let dueAssignments = [];
// How much requests at a time are we willing to make (since we're nesting it might end up being this number squared)
const requestLimit = 6;
// How far (milliseconds) into the past are we willing to search for unfinished assignments by due time (cos the API for this one is almost as shit as the UI)
const defaultDueTimeLimit = 2*7*24*60*60*1000; // 2 weeks
// How far (milliseconds) into the past are we willing to search for unfinished assignments without a due time by update time. (I hate this)
const defaultUpdateTimeLimit = null; // default is 2*dueTimeLimit


function fetchAssignments(dueTimeLimit = defaultDueTimeLimit, updateTimeLimit = defaultUpdateTimeLimit || dueTimeLimit*2) {
	return new Promise((resolve, reject) => {
		// Fetch all active courses
		fetch('https://classroom.googleapis.com/v1/courses?studentId=me&courseStates=ACTIVE&pageSize=100', {
			headers: {
				Authorization: "Bearer " + Cookies.get("googleAuthToken")
			}
		}).then(response => response.json()).then(json => {
			courses = json.courses;
			dueAssignments = [];
			let debugRequests = 1;
			// Fetch all coursework for each course
			async.eachLimit(courses, requestLimit, (course, callback) => {
				fetch(`https://classroom.googleapis.com/v1/courses/${course.id}/courseWork?pageSize=100&orderBy=dueDate desc`, {
					headers: {
						Authorization: "Bearer " + Cookies.get("googleAuthToken")
					}
				}).then(response => response.json()).then(json => {
					debugRequests++;
					if (typeof json.courseWork === "undefined") { callback(); return; }
					const recentAssignments = json.courseWork.filter(e => {
						// Determine if the assignment is recent enough to make a request about
						return isRecent(e, dueTimeLimit, updateTimeLimit);
					});
					async.eachLimit(recentAssignments, requestLimit, (assignment,callback) => {
						debugRequests++;
						fetch(`https://classroom.googleapis.com/v1/courses/${course.id}/courseWork/${assignment.id}/studentSubmissions?pageSize=1&userId=me`,{
							headers: {
								Authorization: "Bearer " + Cookies.get("googleAuthToken")
							}
						}).then(response => {
							if (response.status === 404 && assignment.assigneeMode !== "ALL_STUDENTS") {
								callback();
							} else {
								response.json().then(json => {
									if (["TURNED_IN","RETURNED"].indexOf(json.studentSubmissions[0].state) === -1) {
										dueAssignments.push({assignment: assignment, submission: json.studentSubmissions[0], defaultRecent: isRecent(assignment, defaultDueTimeLimit, defaultUpdateTimeLimit)});
									}
									callback();
								});
							}
						})
					}).then(() => callback())
				});
			}).then(() => { console.log("Number of requests made: ", debugRequests); resolve() });
		});
	});
}

function dueDateToDate(dueDate = {}, dueTime = {}) {
	if (typeof dueDate.year === "undefined") {
		return new Date(0);
	}
	return new Date(zeropad`${dueDate.year || 0}-${dueDate.month || 0}-${dueDate.day || 0}T${dueTime.hours || 0}:${dueTime.minutes || 0}:${dueTime.seconds || 0}Z`);
}

function zeropad(strings, ...inputs) {
	let output = "";
	for (let i = 0; i < strings.length-1; i++) {
		output+=strings[i];
		output+=inputs[i].toString().padStart(2,"0");
	}
	output+=strings[strings.length-1];
	return output;
}

function isRecent(e, dueTimeLimit, updateTimeLimit) {
	return (typeof e.dueDate === "undefined" && new Date(e.updateTime) > new Date(Date.now()-updateTimeLimit)) || dueDateToDate(e.dueDate, e.dueTime) > new Date(Date.now()-dueTimeLimit);
}
