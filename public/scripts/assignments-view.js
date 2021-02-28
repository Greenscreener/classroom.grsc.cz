const firstDayOfWeek = 1;

function displayAssignments() {
	const courseLinksDiv = document.getElementById("course-links");
	courseLinksDiv.innerHTML = "";
	for (let i = 0; i < courses.length; i++) {
		const courseLink = document.createElement("a");
		courseLink.classList.add("course-link");
		courseLink.href = courses[i].alternateLink + "?authuser=" + currentUser.email;
		courseLink.target = "_blank";
		courseLink.innerText = courses[i].name;
		courseLink.style.backgroundColor = courseColor(courses[i]);
		courseLinksDiv.appendChild(courseLink);
	}

	const assignmentsDiv = document.getElementById("assignments");
	assignmentsDiv.innerHTML = "";
	dueAssignments.sort((a, b) => {
		const dateA = dueDateToDate(a.assignment.dueDate, a.assignment.dueTime);
		const dateB = dueDateToDate(b.assignment.dueDate, b.assignment.dueTime);
		return dateA-dateB;
	});
	if (dueAssignments.length === 0) {
		assignmentsDiv.innerHTML = `<div class="section has-text-centered"><h1 style="font-weight: normal; font-size: 3rem;">All done!</h1></div>`;
	}
	for (let i = 0; i < dueAssignments.length; i++) {
		const e = dueAssignments[i];
		const dueDate = dueDateToDate(e.assignment.dueDate,e.assignment.dueTime);
		const prevDueDate = i > 0 ? dueDateToDate(dueAssignments[i-1].assignment.dueDate,dueAssignments[i-1].assignment.dueTime) : null;
		const startOfTheWeek = getStartOfWeek(dueDate, firstDayOfWeek);
		if (
			i === 0 ||
			(dueDate > new Date() && prevDueDate < startOfTheWeek) ||
			(prevDueDate.getTime() === 0 && dueDate.getTime() !== 0)  ||
			(prevDueDate < new Date() && dueDate > new Date())
		) {
			const box = document.createElement("div");
			box.classList.add("assignment-box");
			box.classList.add("week-start");
			if (dueDateToDate(e.assignment.dueDate,e.assignment.dueTime).getTime() !== 0 && dueDate < new Date()) {
				box.classList.add("is-missing");
			}
			box.innerHTML = `
				<span>${dueDate.getTime() ? (dueDate > new Date() ? weekHeader(dueDate, firstDayOfWeek) : "Missing") : "No due date"}</span>
			`
			assignmentsDiv.append(box);
		}
		const course = courses.filter(e1 => e1.id === e.assignment.courseId)[0];
		const box = document.createElement("div");
		box.classList.add("assignment-box");
		if (dueDateToDate(e.assignment.dueDate,e.assignment.dueTime).getTime() !== 0 && dueDate < new Date()) {
			box.classList.add("is-missing");
		}
		box.style.borderLeftColor = courseColor(course);
		box.innerHTML = safe`
			<div class="level">
				<div class="level-left">
							<a class="assignment-title" target="_blank" href="${e.assignment.alternateLink + "?authuser=" + currentUser.email}">
								${e.assignment.title}
							</a>
							<a class="course-name" target="_blank" href="${course.alternateLink + "?authuser=" + currentUser.email}">
								${course.name}
							</a>
				</div>
				<div class="level-right">
					<span class="assignment-due-time">
						${dueDate.getTime() ? formatDueDate(dueDate) : "No due date"}
						<svg class="not-recent-warning" style="display: ${e.defaultRecent ? "none" : "inline-block"};" xmlns=\"http://www.w3.org/2000/svg\" height=\"24\" viewBox=\"0 0 24 24\" width=\"24\"><path d=\"M0 0h24v24H0z\" fill=\"none\"/><path d=\"M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z\"/></svg>
					</span>
				</div>
			</div>
		`;
		if (!e.defaultRecent) {
			box.title = "This assignment will be shown only in Long Refresh mode.";
		}
		box.addEventListener("click", (event) => {
			if (event.target.tagName !== "A") {
				open(e.assignment.alternateLink + "?authuser=" + currentUser.email, "_blank")
			}
		});

		assignmentsDiv.append(box);
	}
}

function assignmentsView(dueTimeLimit, updateTimeLimit) {
	fetchAssignments(dueTimeLimit, updateTimeLimit).then(() => {
		displayAssignments();
		[...document.getElementsByClassName("refresh-buttons")].forEach(e => e.classList.remove("is-loading"));
		[...document.getElementsByClassName("refresh-buttons")].forEach(e => e.disabled = false);
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
	return safe`${date.toLocaleString(window.navigator.language, {weekday: 'long'})} ${date.getDate()}.${date.getMonth()+1}. ${date.getHours()}:${date.getMinutes().toString().padStart(2,"0")}`
}

function formatDueDateDate(date) {
	return safe`${date.toLocaleString(window.navigator.language, {weekday: 'long'})} ${date.getDate()}.${date.getMonth()+1}.`;
}

function weekShift(dayOfWeek, firstDayOfWeek) {
	return dayOfWeek-firstDayOfWeek < 0 ? 7+(dayOfWeek-firstDayOfWeek) : dayOfWeek-firstDayOfWeek;
}

function getStartOfWeek(date, firstDayOfWeek) {
	const startOfWeek = new Date(date.getTime() - weekShift(date.getDay(), firstDayOfWeek)*24*60*60*1000);
	startOfWeek.setHours(0,0,0,0);
	return startOfWeek;
}

function getEndOfWeek(date, firstDayOfWeek) {
	const endOfWeek = new Date(date.getTime() + (6-weekShift(date.getDay(),firstDayOfWeek))*24*60*60*1000);
	endOfWeek.setHours(23,59,59,999);
	return endOfWeek;
}

function weekHeader(date, firstDayOfWeek) {
	const firstDayDate = getStartOfWeek(date, firstDayOfWeek);
	const lastDayDate = getEndOfWeek(date, firstDayOfWeek)
	return formatDueDateDate(firstDayDate) + " – " + formatDueDateDate(lastDayDate);
}

function refresh(dueTimeLimit, updateTimeLimit) {
	if (typeof Cookies.get("googleAuthToken") === "undefined" && firebase.auth().currentUser !== null) {
		launchAuth(firebase.auth().currentUser.email);
	}
	[...document.getElementsByClassName("refresh-buttons")].forEach(e => e.classList.add("is-loading"));
	[...document.getElementsByClassName("refresh-buttons")].forEach(e => e.disabled = true);
	assignmentsView(dueTimeLimit, updateTimeLimit);
}

function hardRefresh() {
	refresh(100*365*24*60*60*1000);
}

function courseColor(course) {
	const colors = [
		"#C62828",
		"#AD1457",
		"#6A1B9A",
		"#4527A0",
		"#283593",
		"#1565C0",
		"#0277BD",
		"#00838F",
		"#00695C",
		"#2E7D32",
		"#558B2F",
		"#827717",
		"#F57F17",
		"#FF6F00",
		"#E65100",
		"#D84315",
		"#4E342E",
		"#616161",
		"#37474F",
		"#000000"
	]
	return colors[parseInt(sha1(course.id + course.name).slice(5,12), 16) % colors.length];
}

