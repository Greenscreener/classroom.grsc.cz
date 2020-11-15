function launchAuth(hint) {
	const provider = new firebase.auth.GoogleAuthProvider();
	provider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
	provider.addScope('https://www.googleapis.com/auth/classroom.coursework.me.readonly');
	if (hint) {
		provider.setCustomParameters({
			'login_hint': hint
		})
	}
	firebase.auth().signInWithRedirect(provider);
}

firebase.auth().getRedirectResult().then(result => {
	if (result.credential) {
		Cookies.set('googleAuthToken',result.credential.accessToken, {expires: new Date(Date.now() + 3600000), sameSite:"strict"})
	}
	if (typeof Cookies.get("googleAuthToken") === "undefined" && firebase.auth().currentUser !== null) {
		launchAuth(firebase.auth().currentUser.email);
	} else if (typeof Cookies.get("googleAuthToken") !== "undefined") {
		assignmentsView();
	} else {
		document.getElementById("welcome").classList.remove("hidden");
		document.getElementById("loading").classList.add("hidden");
		document.getElementById("app").classList.add("hidden");

		document.getElementById("assignments").innerHTML = "";
		document.getElementById("profile-name").innerHTML = "";
		document.getElementById("profile-icon").innerHTML = "";
	}
});
let currentUser = undefined;
firebase.auth().onAuthStateChanged((user) => {
	if (user) {
		// User is signed in.
		currentUser = JSON.parse(JSON.stringify(user));
	} else {
		currentUser = undefined;
		Cookies.set('googleAuthToken', '', {expires: 0, sameSite:"strict"});

		document.getElementById("welcome").classList.remove("hidden");
		document.getElementById("loading").classList.add("hidden");
		document.getElementById("app").classList.add("hidden");

		document.getElementById("assignments").innerHTML = "";
		document.getElementById("profile-name").innerHTML = "";
		document.getElementById("profile-icon").innerHTML = "";
	}
});

