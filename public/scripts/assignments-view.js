const firstDayOfWeek = 1;

function displayAssignments() {
	const assignmentsDiv = document.getElementById("assignments");
	assignmentsDiv.innerHTML = "";
	const sortedAssignments = dueAssignments.sort((a, b) => {
		const dateA = dueDateToDate(a.assignment.dueDate, a.assignment.dueTime);
		const dateB = dueDateToDate(b.assignment.dueDate, b.assignment.dueTime);
		return dateA-dateB;
	});
	for (let i = 0; i < dueAssignments.length; i++) {
		const e = dueAssignments[i];
		const dueDate = dueDateToDate(e.assignment.dueDate,e.assignment.dueTime);
		if (i === 0 || weekShift(dueDate.getDay(),1) < weekShift(dueDateToDate(dueAssignments[i-1].assignment.dueDate,dueAssignments[i-1].assignment.dueTime).getDay(),1) || (dueDateToDate(dueAssignments[i-1].assignment.dueDate,dueAssignments[i-1].assignment.dueTime) < new Date() && dueDate > new Date())) {
			const box = document.createElement("div");
			box.classList.add("assignment-box");
			box.classList.add("week-start");
			if (dueDateToDate(e.assignment.dueDate,e.assignment.dueTime).getTime() !== 0 && dueDate < new Date()) {
				box.classList.add("is-missing");
			}
			box.innerHTML = `
				<span>${dueDate.getTime() ? (dueDate > new Date() ? formatDueDateDate(dueDate) : "Missing") : "No due date"}</span>
			`

			assignmentsDiv.append(box);
		}
		const course = courses.filter(e1 => e1.id === e.assignment.courseId)[0];
		const box = document.createElement("div");
		box.classList.add("assignment-box");
		if (dueDateToDate(e.assignment.dueDate,e.assignment.dueTime).getTime() !== 0 && dueDate < new Date()) {
			box.classList.add("is-missing");
		}
		box.innerHTML = safe`
			<div class="level">
				<div class="level-left">
					<a class="assignment-title" target="_blank" href="${e.assignment.alternateLink}">${e.assignment.title}</a>
					<a class="course-name" target="_blank" href="${course.alternateLink}">${course.name}</a>
				</div>
				<div class="level-right">
					<span class="assignment-due-time">
						${dueDate.getTime() ? formatDueDate(dueDate) : "No due date"}
					</span>
				</div>
			</div>
		`;
		box.addEventListener("click", (event) => {
			if (event.target.tagName !== "A") {
				open(e.assignment.alternateLink, "_blank")
			}
		});

		assignmentsDiv.append(box);
	}
}

function assignmentsView() {
	fetchAssignments().then(() => {
		displayAssignments();
		document.getElementById("refresh-button").classList.remove("is-loading");
		document.getElementById("refresh-button").disabled = false;
		document.getElementById("welcome").classList.add("hidden");
		document.getElementById("loading").classList.add("hidden");
		document.getElementById("app").classList.remove("hidden");
		document.getElementById("profile-icon").innerHTML = "<img src=\"" + currentUser.photoURL + "\" alt=\"User profile icon\">";
		document.getElementById("profile-name").innerText = currentUser.displayName;
	});
}


function escapeHtml(unsafe) {
	return unsafe
		.toString()
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

function safe(strings, ...inputs) {
	let output = "";
	for (let i = 0; i < strings.length-1; i++) {
		output+=strings[i];
		output+=escapeHtml(inputs[i]);
	}
	output+=strings[strings.length-1];
	return output;
}

function formatDueDate(date) {
	return safe`${date.toLocaleString(window.navigator.language, {weekday: 'long'})} ${date.getDate()}.${date.getMonth()+1} ${date.getHours()}:${date.getMinutes()}`
}

function formatDueDateDate(date) {
	return safe`${date.toLocaleString(window.navigator.language, {weekday: 'long'})} ${date.getDate()}.${date.getMonth()+1}`;
}

function weekShift(dayOfWeek, firstDayOfWeek) {
	return dayOfWeek-firstDayOfWeek < 0 ? 7+(dayOfWeek-firstDayOfWeek) : dayOfWeek-firstDayOfWeek;
}

function refresh() {
	if (typeof Cookies.get("googleAuthToken") === "undefined" && firebase.auth().currentUser !== null) {
		launchAuth(firebase.auth().currentUser.email);
	}
	document.getElementById("refresh-button").classList.add("is-loading");
	document.getElementById("refresh-button").disabled = true;
	assignmentsView();
}