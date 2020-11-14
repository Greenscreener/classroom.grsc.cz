function launchAuth(noPrompt) {
	const provider = new firebase.auth.GoogleAuthProvider();
	provider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
	provider.addScope('https://www.googleapis.com/auth/classroom.coursework.me.readonly');
	if (noPrompt) {
		provider.setCustomParameters({
			'prompt':'none'
		})
	}
	firebase.auth().signInWithRedirect(provider);
}

firebase.auth().getRedirectResult().then(result => {
	if (result.credential) {
		Cookies.set('googleAuthToken',result.credential.accessToken, {expires: new Date(Date.now() + 3600000), sameSite:"strict"})
	}
});

firebase.auth().onAuthStateChanged((user) => {
	if (user) {
		// User is signed in.
		displayAssignments();
	} else {
		// User is signed out.
		Cookies.set('googleAuthToken', '', {expires: 0, sameSite:"strict"});
		if (confirm("Pls sign in with ur google account")) {
			launchAuth(false);
		}
	}
});

