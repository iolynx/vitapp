function greCaptcha(data: any) {
	console.log('Data Received: ', data);
	setToken(data.siteKey);
	console.log("Submitting Form with:", data.siteKey);
	const submitForm = `
					(function() {
						// Clear previous intervals
						if (typeof captchaInterval !== 'undefined') clearInterval(captchaInterval);
						if (typeof executeInterval !== 'undefined') clearInterval(executeInterval);

						// Select the form
						const loginForm = document.querySelector('#vtopLoginForm');
						if (!loginForm) {
							window.ReactNativeWebView.postMessage(JSON.stringify({ error: 'Login form not found' }));
							return;
						}

						// Fill in login fields
						loginForm.querySelector('[name="username"]').value = '${username.replace(/'/g, "\\'")}';
						loginForm.querySelector('[name="password"]').value = '${password.replace(/'/g, "\\'")}';
						//loginForm.querySelector('[name="captchaStr"]').value = '${data.siteKey.replace(/'/g, "\\'")}';
						loginForm.querySelector('[name="gResponse"]').value = '${data.siteKey.replace(/'/g, "\\'")}';

						// Submit the Form
						loginForm.submit();

						// Submit the Form
						setTimeout(() => {
						  let responseText = document.body.innerText;
						  window.ReactNativeWebView.postMessage(responseText);
						}, 7000); // Wait 7s for content to load
					})();
					`;
	console.log(submitForm);
	webViewRef.current.injectJavaScript(submitForm);
	console.log('Submitted Form');
	setCurrentStep('HOME_PAGE')
	console.log("going to home page now");
	break;

}
