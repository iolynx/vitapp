import { WebView } from "react-native-webview";
import React, { useRef, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import CaptchaHandler from "@/components/CaptchaHandler";
import CaptchaDialog from "@/components/CaptchaDialog";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";

// export default function fetchUserData({ onDataFetched }) {


interface FetchUserDataProps {
	username: string,
	password: string,
	onDataFetched: (data: any) => void;
}

const FetchUserData: React.FC<FetchUserDataProps> = ({ username, password, onDataFetched }) => {
	const webViewRef = useRef<WebView | null>(null);
	const [loading, setLoading] = useState(true);
	const [status, setStatus] = useState('Loading...');
	const [currentStep, setCurrentStep] = useState('INIT')
	const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
	const [captchaImage, setCaptchaImage] = useState('');
	const [showCaptchaDialog, setShowCaptchaDialog] = useState(false);
	const [token, setToken] = useState("");
	const [url, setUrl] = useState('https://vtopcc.vit.ac.in/');
	const [count, setCount] = useState(0);
	const [semesters, setSemesters] = useState([]);
	const [lastMessage, setLastMessage] = useState(null);

	let isHandlingMessage = false;


	const handleCaptchaSubmit = (text: string) => {
		console.log("Solved captcha:", text);
		setShowCaptchaDialog(false);
		webViewRef.current?.injectJavaScript(`
						(function() {
							// Clear previous intervals
							if (typeof captchaInterval !== 'undefined') clearInterval(captchaInterval);
							if (typeof executeInterval !== 'undefined') clearInterval(executeInterval);

							const loginForm = document.querySelector('#vtopLoginForm');
							if (!loginForm) {
								window.ReactNativeWebView.postMessage(JSON.stringify({ error: 'Login form not found' }));
								return;
							}

							// Fill login form fields
							loginForm.querySelector('[name="username"]').value = '${username.replace(/'/g, "\\'")}';
							loginForm.querySelector('[name="password"]').value = '${password.replace(/'/g, "\\'")}';
							loginForm.querySelector('[name="captchaStr"]').value = '${text.replace(/'/g, "\\'")}';
							//loginForm.querySelector('[name="gResponse"]').value = '${text.replace(/'/g, "\\'")}';

							// Submit the Form
							loginForm.submit(); 
							setTimeout(() => {
							  let responseText = document.body.innerText;
							  window.ReactNativeWebView.postMessage(responseText);
							}, 5000); // Wait 3s for content to load
						})();
					`
		);
		console.log('Form Submitted');
		setCurrentStep('HOME_PAGE');
	};


	const detectPage = `
        (function() {
            const response = { page_type: 'LANDING' };
			console.log("this is from the injected script")
            
            if (document.querySelector('input[id="authorizedIDX"]')) {
                response.page_type = 'HOME';
            }
            
            if (document.querySelector('form[id="vtopLoginForm"]')) {
                response.page_type = 'LOGIN';
            }
            
            // Send result back to React Native
            window.ReactNativeWebView.postMessage(JSON.stringify(response));
        })();
    `;

	const openSignIn = `
		(function() {
			document.forms['stdForm'].submit();
			setTimeout(() => {
				window.ReactNativeWebView.postMessage(JSON.stringify({ success: true }));
			}, 2000); 
		})();
	`
	const openSignInOld = `
		(function() {
			const response = { success: false };
			const formData = new URLSearchParams(new FormData(document.getElementById("stdForm")));

			fetch("https://vtopcc.vit.ac.in/vtop/prelogin/setup", {
				method: "POST",
				body: formData
			})
			.then(res => {
				response.success = res.ok; // Mark success if HTTP status is OK (200-299)
			})
			.catch(() => {
				response.success = false;
			})
			.finally(() => {
				window.ReactNativeWebView.postMessage(JSON.stringify(response));
			});
		})();
    `;

	const getCaptchaType = `
	(function() {
		try {
			const response = { captcha_type: 'DEFAULT' };

			// Check for presence of the element without jQuery
			if (document.querySelector('input#gResponse')) {
				response.captcha_type = 'GRECAPTCHA';
			}

			window.ReactNativeWebView.postMessage(JSON.stringify(response));
		} catch (error) {
			window.ReactNativeWebView.postMessage(JSON.stringify({ error: error.message }));
		}
	})();
	`;

	const getCaptchaTypeOld = `
		(function() {
				const response = {
						captcha_type: 'DEFAULT'
				};

				if ($('input[id="gResponse"]').length === 1) {
						response.captcha_type = 'GRECAPTCHA';
				}

			window.ReactNativeWebView.postMessage(JSON.stringify(response));
		})();
	`;

	const getCaptcha = `
		(function() {
			try {
				const captchaImg = document.querySelector('#captchaBlock img');
				const captchaSrc = captchaImg ? captchaImg.src : null;

				window.ReactNativeWebView.postMessage(JSON.stringify({
					captcha: captchaSrc
				}));
			} catch (error) {
				window.ReactNativeWebView.postMessage(JSON.stringify({
					error: error.message
				}));
			}
		})();
	`;

	const greCaptcha = `
		(function() {
			const siteKey = document.querySelector('.g-recaptcha')?.getAttribute('data-sitekey');
			window.ReactNativeWebView.postMessage(JSON.stringify({ siteKey }));
		})();
	`;

	const fetchSemesters = `
		(async function () {
			const authorizedID = document.getElementById('authorizedIDX')?.value;
			const csrfToken = document.querySelector('input[name="_csrf"]')?.value;
			const timestamp = new Date().getTime();

			const data = new URLSearchParams({
				verifyMenu: "true",
				authorizedID: authorizedID || "",
				_csrf: csrfToken || "",
				nocache: timestamp
			});

			let response = {};

			try {
				const res = await fetch("academics/common/StudentTimeTableChn", {
					method: "POST",
					headers: {
						"Content-Type": "application/x-www-form-urlencoded",
					},
					body: data.toString(),
				});

				const text = await res.text();
				const lowerText = text.toLowerCase();

				if (lowerText.includes("not authorized")) {
					response = {
						error_code: 1,
						error_message: "Unauthorised user agent"
					};
				} else if (lowerText.includes("time table")) {
					const parser = new DOMParser();
					const doc = parser.parseFromString(text, "text/html");
					const options = doc.querySelectorAll("#semesterSubId option");

					response.semesters = Array.from(options)
						.filter(option => option.value)
						.map(option => ({
							name: option.innerText,
							id: option.value
						}));
				}
			} catch (error) {
				console.error("Error fetching timetable:", error);
			}

			window.ReactNativeWebView.postMessage(JSON.stringify(response));
		})();
		`;

	const handleMessage = (event: any) => {
		try {
			const data = JSON.parse(event.nativeEvent.data);

			if (JSON.stringify(data) === JSON.stringify(lastMessage) && currentStep !== 'HOME_PAGE') {
				return;
			}

			setLastMessage(data); // Store the last message

			// console.log('WebView Response:', data);

			processMessage(event);
		} catch (error) {
			console.error('Error parsing WebView message:', error);
		}
	};

	const processMessage = (event: any) => {
		const data = JSON.parse(event.nativeEvent.data);
		console.log('-------------------');
		console.log('Current Step: ', currentStep);
		console.log('WebView Response: ', data);
		// console.log('Current Status: ', status);

		if (timeoutId) {
			clearTimeout(timeoutId);
			setTimeoutId(null);
		}

		if (webViewRef.current) {
			switch (currentStep) {
				case 'INIT':
					webViewRef.current.injectJavaScript(detectPage);
					switch (data.page_type) {
						case 'LANDING':
							console.log('Count: ', count);
							if (count > 10) {
								console.log("Cannot Reach Server");
								setLoading(false);
								onDataFetched('Could not Reach the Server at this time.');
								break;
							}
							webViewRef.current.injectJavaScript(openSignIn);
							setCurrentStep('NAVIGATE_TO_LOGIN');
							setCount(count + 1);
							break;

						case 'LOGIN':
							webViewRef.current.injectJavaScript(getCaptchaType);
							setCurrentStep('HANDLE_CAPTCHA')
							break;

						case 'HOME':
							//already signed in, proceed to next step
							setStatus('Already Signed in...');
							setCurrentStep('HOME_PAGE');
							break;
					}
					break;

				case 'NAVIGATE_TO_LOGIN':
					console.log('Response from tryna go to login: ', data);
					if (data.success === true) {
						console.log('apparently success is certain.');
						setUrl('https://vtopcc.vit.ac.in/vtop/login');
						webViewRef.current.injectJavaScript(getCaptchaType);
						setCurrentStep('HANDLE_CAPTCHA')
						break;
					} else if (data.success === false) {
						setUrl('https://vtopcc.vit.ac.in/');
						webViewRef.current.injectJavaScript(openSignIn);
						setCurrentStep('NAVIGATE_TO_LOGIN');
						break;
					}
					if (data.page_type === "LOGIN") {
						console.log("In Login Page");
						webViewRef.current.injectJavaScript(getCaptchaType);
						setCurrentStep('HANDLE_CAPTCHA');
					} else {
						setUrl('https://vtopcc.vit.ac.in/');
						console.log('Error Navigating to Log In Page');
						setCurrentStep('INIT');
						webViewRef.current.injectJavaScript(openSignIn);
					}
					break;

				case 'GET_CAPTCHA_TYPE':
					console.log('getting captchas');
					webViewRef.current.injectJavaScript(getCaptchaType)
					setCurrentStep('HANDLE_CAPTCHA')
					break;

				case 'HANDLE_CAPTCHA':
					console.log('Response: ', data);
					if (data.page_type === 'LOGIN') {
						webViewRef.current.injectJavaScript(getCaptchaType);
						break;
					}
					console.log('Captcha Type is: ', data.captcha_type);
					if (data.captcha_type === 'GRECAPTCHA') {
						webViewRef.current.injectJavaScript(greCaptcha);
						console.log('Dealing with GreCaptcha..');
						setCurrentStep('GRECAPTCHA');
						break;

					} else if (data.captcha_type === 'DEFAULT') {
						webViewRef.current.injectJavaScript(getCaptcha);
						console.log('Dealing with Default Captcha..');
						setCurrentStep('DISPLAY_CAPTCHA');
						break;
					} else if (data.captcha) {
						webViewRef.current.injectJavaScript(getCaptcha);
						setCurrentStep('DISPLAY_CAPTCHA');
						break;
					}
					break;

				// to display the default captcha
				case 'DISPLAY_CAPTCHA':
					// console.log(data);
					if (data.captcha) {
						console.log(data.captcha);
						setCaptchaImage(data.captcha);
						setShowCaptchaDialog(true);
					} else if (data.page_type === 'LOGIN') {
						console.log("In Login Page");
						webViewRef.current.injectJavaScript(getCaptchaType);
						setCurrentStep('HANDLE_CAPTCHA');
					}
					break;

				case 'GRECAPTCHA':
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

				case 'HOME_PAGE':
					console.log('Submission Response: ', data);
					console.log('In Home Page..');
					//setUrl('https://vtopcc.vit.ac.in/vtop/content')
					webViewRef.current.injectJavaScript(fetchSemesters);
					if (JSON.stringify(data) !== '{}' && data.semesters) {
						console.log('Fetching Semesters...');
						setCurrentStep('FETCH_SEMESTERS');
					}
					//setCurrentStep('FETCH_SEMESTERS');
					break;

				case 'FETCH_SEMESTERS':
					// console.log('Semesters: ', data);
					setSemesters(data.semesters);
					console.log('Semesters are: ', semesters);
					setLoading(false);
					onDataFetched('asdfasdfa');
				// now create a popup to select the current semester

				case 'FINISHED':
					setLoading(false);
					onDataFetched(data);
					break;
			}
		}
	}

	return (
		<View style={styles.container}>
			{loading && (
				<WebView
					ref={webViewRef}
					source={{ uri: url }}
					onMessage={handleMessage}
					javaScriptEnabled={true}
					injectedJavaScriptBeforeContentLoaded={detectPage}
					domStorageEnabled={true}
					// onNavigationStateChange={(navState) => {
					// 	if (!hasLoaded) {
					// 		setHasLoaded(true);
					// 		webViewRef.current?.injectJavaScript(detectPage);
					// 	}
					// }}
					style={{ flex: 1 }}
				/>
			)}
			<CaptchaDialog
				visible={showCaptchaDialog}
				image={captchaImage}
				onSubmit={handleCaptchaSubmit}
				onCancel={() => setShowCaptchaDialog(false)}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignSelf: 'stretch',
	},
});

export default FetchUserData;
