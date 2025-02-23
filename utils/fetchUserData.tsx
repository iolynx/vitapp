import { WebView } from "react-native-webview";
import React, { useRef, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import CaptchaDialog from "@/components/CaptchaDialog";
import SelectSemesterModal from "@/components/SelectSemesterModal";


interface FetchUserDataProps {
	username: string,
	password: string,
	onDataFetched: (data: any) => void;
}

const FetchUserData: React.FC<FetchUserDataProps> = ({ username, password, onDataFetched }) => {
	const webViewRef = useRef<WebView | null>(null);
	const detectPageInjected = useRef(false);
	const [loading, setLoading] = useState(true);
	const [currentStep, setCurrentStep] = useState('INIT')
	const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
	const [captchaImage, setCaptchaImage] = useState('');
	const [showCaptchaDialog, setShowCaptchaDialog] = useState(false);
	const [url, setUrl] = useState('https://vtopcc.vit.ac.in/');
	const [count, setCount] = useState(0);
	const [semesters, setSemesters] = useState([]);
	const [lastMessage, setLastMessage] = useState(null);
	const [gettingCaptcha, setGettingCaptcha] = useState(false);
	const [webViewVisibility, setWebViewVisibility] = useState(1);
	const [semesterModalVisible, setSemesterModalVisible] = useState(false);
	const [selectedSemester, setSelectedSemester] = useState('');

	async function saveInfo(key: string, value: string) {
		await SecureStore.setItemAsync(key, value);
	}

	const handleSemesterSelect = (selectedSem: string) => {
		if (selectedSem == '') {
			console.log('Error: No Semester Selected.');
			setLoading(false);
			onDataFetched('No Semester Selected');
			return;
		}

		console.log('Selected: ', selectedSem);
		setSelectedSemester(selectedSem);
		setCurrentStep('getName');
	}

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

			// Submit the form
			loginForm.submit(); 

			setTimeout(() => {
				let responseText = {
					status: "SUBMITTED_FORM",
					pageText: document.body.innerText || "No content detected"
				};

				window.ReactNativeWebView.postMessage(JSON.stringify(responseText));
			}, 3000); // Wait 5s for content to load
		})();
		`);
		console.log('Form Submitted');
		setTimeout(() => {
			setCurrentStep('fetchSemesters');
		}, 5000);
	};


	const scripts = {
		submitForm: `
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

			grecaptcha.execute();

			setTimeout(() => {
				let responseText = {
					status: "SUBMITTED_FORM",
					pageText: document.body.innerText || "No content detected"
				};

				window.ReactNativeWebView.postMessage(JSON.stringify(responseText));
			}, 5000); // Wait 5s for content to load
		})();
		`,
		detectPage: `
        (function() {
            const response = { page_type: 'LANDING' };
			console.log("this is from the injected script")
            
            if (document.querySelector('input[id="authorizedIDX"]')) {
                response.page_type = 'HOME';
            }
            
            if (document.querySelector('form[id="vtopLoginForm"]')) {
                response.page_type = 'LOGIN';
            }
			
			response.status = 'DETECTED_PAGE'

            window.ReactNativeWebView.postMessage(JSON.stringify(response));
        })();
    `,

		openSignInNew: `
		(function() {
			document.forms['stdForm'].submit();
			const response = { success: false };
			setTimeout(() => {
				window.ReactNativeWebView.postMessage(JSON.stringify({ success: true, status: 'OPENED_SIGNIN' }));
			}, 4000); 
		})();
	`,
		openSignIn: `
		(function() {
			const response = { success: false, status: 'OPENED_SIGNIN' };
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
    `,
		getCaptchaType: `
		(function() {
			try {
				const response = { captcha_type: 'DEFAULT' };

				// Check for presence of the element without jQuery
				if (document.querySelector('input#gResponse')) {
					response.captcha_type = 'GRECAPTCHA';
				}
				response.status = 'GOT_CAPTCHA_TYPE';

				window.ReactNativeWebView.postMessage(JSON.stringify(response));
			} catch (error) {
				window.ReactNativeWebView.postMessage(JSON.stringify({ error: error.message, status: 'GOT_CAPTCHA_TYPE' }));
			}
		})();
		`,

		getCaptchaTypeOld: `
		(function() {
				const response = {
						captcha_type: 'DEFAULT',
				};

				if ($('input[id="gResponse"]').length === 1) {
						response.captcha_type = 'GRECAPTCHA';
				}

			setTimeout(() => {
				window.ReactNativeWebView.postMessage(JSON.stringify(response));
			}, 1000);
		})();
		`,

		getOuterHTML: `
		(function waitForPage() {
			if (document.readyState === 'complete') {
				window.ReactNativeWebView.postMessage(JSON.stringify({
					html: document.documentElement.outerHTML,
					status: 'GOT_CAPTCHA'
				}));
			} else {
				setTimeout(waitForPage, 1000); 
			}
		})();
		`,

		getOuterHTML_: `
		(function waitForLoad() {
			if (document.readyState === 'complete') {
				window.ReactNativeWebView.postMessage(JSON.stringify({
					html: document.documentElement.outerHTML,
					status: 'GOT_CAPTCHA'
				}));
			} else {
				setTimeout(waitForLoad, 500); 
			}
		})();
		`,

		getCaptcha: `
		(function waitForCaptcha() {
			const captchaImg = document.querySelector('#captchaBlock img');

			if (captchaImg) {
				window.ReactNativeWebView.postMessage(JSON.stringify({
					captcha: captchaImg.src,
					status: 'GOT_CAPTCHA'
				}));
			} else {
				setTimeout(waitForCaptcha, 500); // Retry every 500ms until captcha is found
			}
		})();
		`,

		greCaptcha: `
		(function() {
			const siteKey = document.querySelector('.g-recaptcha')?.getAttribute('data-sitekey');
			window.ReactNativeWebView.postMessage(JSON.stringify({ siteKey: siteKey, status: 'GOT_SITEKEY' }));
		})();
	`,

		fetchSemesters: `
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

			let response = {status: 'FETCHED_SEMESTERS'};

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
		`,
		getName: `
		(function() {
			var data = 'verifyMenu=true&authorizedID=' + $('#authorizedIDX').val() + '&_csrf=' + $('input[name="_csrf"]').val() + '&nocache=@' + (new Date().getTime());
			var response = { status: 'GOT_NAME' };
			$.ajax({
				type: 'POST',
				url: 'studentsRecord/StudentProfileAllView',
				data: data,
				async: false,
				success: function(res) {
					if (res.toLowerCase().includes('personal information')) {
						var doc = new DOMParser().parseFromString(res, 'text/html');
						var cells = doc.getElementsByTagName('td');
						for (var i = 0; i < cells.length; ++i) {
							var key = cells[i].innerText.toLowerCase();
							if (key.includes('student') && key.includes('name')) {
								response.name = cells[++i].innerHTML;
								break;
							}
						}
					}
				}
			});
			window.ReactNativeWebView.postMessage(JSON.stringify(response));
		})();
		`,
		getCreditsAndCGPA: `
		(function() {
			var data = 'verifyMenu=true&authorizedID=' + $('#authorizedIDX').val() + 
					   '&_csrf=' + $('input[name="_csrf"]').val() + 
					   '&nocache=' + (new Date().getTime());

			var response = {};

			$.ajax({
				type: 'POST',
				url: 'examinations/examGradeView/StudentGradeHistory',
				data: data,
				async: false,
				success: function(res) {
					var doc = new DOMParser().parseFromString(res, 'text/html');
					var tables = doc.getElementsByTagName('table');

					for (var i = tables.length - 1; i >= 0; --i) {
						var headings = tables[i].getElementsByTagName('tr')[0].getElementsByTagName('td');

						if (headings[0].innerText.toLowerCase().includes('credits')) {
							var creditsIndex, cgpaIndex;

							for (var j = 0; j < headings.length; ++j) {
								var heading = headings[j].innerText.toLowerCase();
								if (heading.includes('earned')) {
									creditsIndex = j + headings.length;
								} else if (heading.includes('cgpa')) {
									cgpaIndex = j + headings.length;
								}
							}

							var cells = tables[i].getElementsByTagName('td');
							response.cgpa = parseFloat(cells[cgpaIndex].innerText) || 0;
							response.total_credits = parseFloat(cells[creditsIndex].innerText) || 0;
							break;
						}
					}

					// Send the data back to React Native
					window.ReactNativeWebView.postMessage(JSON.stringify(response));
				}
			});
		})();

		` ,

	}


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

		// logging progress to debug
		console.log('-------------------');
		console.log('Current Step: ', currentStep);
		console.log('WebView Response: ', data);
		// console.log('Current Status: ', status);

		if (timeoutId) {
			clearTimeout(timeoutId);
			setTimeoutId(null);
		}

		if (!webViewRef.current) {
			return;
		}

		switch (data.status) {
			case 'DETECTED_PAGE':
				switch (data.page_type) {
					case 'LANDING':
						console.log('On Landing page.');
						console.log('Landing Page count: ', count);
						if (count > 10) {
							console.log("Cannot Reach Server");
							setLoading(false);
							onDataFetched('Could not Reach the Server at this time.');
							break;
						}

						setCurrentStep('openSignIn');
						setCount(count + 1);
						break;

					case 'LOGIN':
						// in login page
						console.log('In Login Page');
						setCurrentStep('getCaptchaType');
						break;

					case 'HOME':
						//already signed in, proceed to next step
						//setCurrentStep('fetchSemesters');
						console.log('Already In Home Page');
						break;
				}
				break;

			case 'OPENED_SIGNIN':
				if (data.success === true) {
					console.log('Auth Success. Proceeding to Login Page...');
					setUrl('https://vtopcc.vit.ac.in/vtop/login');
					setTimeout(() => {
						setCurrentStep('getCaptchaType');
					}, 300);
				} else if (data.success === false) {
					console.log('Auth Failure. Retrying...');
					setUrl('https://vtopcc.vit.ac.in/');
					setCurrentStep('openSignIn');
				} else {
					console.log('weird response: \n', data);
				}
				break;

			case 'GOT_CAPTCHA_TYPE':
				console.log('Got Captcha Type...');
				if (data.captcha_type == 'DEFAULT') {
					console.log('Captcha Type: Default Captcha');

					//  wait for a few seconds for the page to load before
					//  getting the captcha challenge
					setTimeout(() => {
						setCurrentStep('getCaptcha');
					}, 700);
					console.log('bye');
					setGettingCaptcha(true);
				} else if (data.captcha_type == 'GRECAPTCHA') {
					console.log('Captcha Type: greCaptcha');
					// todo: later
					setCurrentStep('greCaptcha');
				}
				break;

			case 'GOT_CAPTCHA':
				console.log('Received Captcha Base 64. Displaying...');
				if (data.captcha) {
					setGettingCaptcha(false);
					setCaptchaImage(data.captcha);
					setShowCaptchaDialog(true);
				} else {
					console.log('weird response: \n', data)
				}
				break;

			case 'GOT_SITEKEY':
				webViewRef.current.injectJavaScript(scripts['submitForm']);
				console.log('Form Submitted');

				// setShowReCaptchaDialog(true);
				// console.log(showReCaptchaDialog);
				break;

			case 'SUBMITTED_FORM':
				console.log('In Home Page..');

				setUrl('https://vtopcc.vit.ac.in/vtop/content');
				console.log('Fetching Semesters...');
				setCurrentStep('fetchSemesters');
				break;

			case 'RECAPTCHA_SHOWN':
				console.log(data);

			case 'FETCHED_SEMESTERS':
				setSemesters(data.semesters);
				console.log('Semesters are: ', semesters);
				setSemesterModalVisible(true);
				// this transfers control to a 
				// semester modal that upon submisison
				// returns control to handleSemesterSelect()
				// from where the next step is called;
				break;

			case 'GOT_NAME':
				console.log('Hello, ', data.name);
				saveInfo('name', data.name);
				setCurrentStep('getCreditsAndCGPA');
				break;

			case 'GOT_CREDITS_CGPA':
				console.log('Fetched Credits & CGPA');
				console.log(data);
				saveInfo('credits', data.total_credits);
				saveInfo('cgpa', data.cgpa);



			case 'FINISHED':
				setLoading(false);
				onDataFetched(data);
				break;
		}
	}

	const injectScript = (step: string) => {
		const script = scripts[step];
		if (script && webViewRef.current) {
			webViewRef.current.injectJavaScript(script);
		}
	};

	useEffect(() => {
		injectScript(currentStep);
	}, [currentStep])

	return (
		<View style={styles.container}>
			{loading && (
				<WebView
					ref={webViewRef}
					source={{ uri: url }}
					onMessage={handleMessage}
					javaScriptEnabled={true}
					onLoad={() => {
						if (!detectPageInjected.current) {
							detectPageInjected.current = true;
							console.log("loaded.");
							injectScript("detectPage"); // inject only on first load
						}
					}}
					domStorageEnabled={true}
					style={{ flex: webViewVisibility }}
					userAgent=""
				/>
			)}
			<CaptchaDialog
				visible={showCaptchaDialog}
				image={captchaImage}
				onSubmit={handleCaptchaSubmit}
				onCancel={() => setShowCaptchaDialog(false)}
			/>
			<SelectSemesterModal
				visible={semesterModalVisible}
				onDismiss={() => setSemesterModalVisible(false)}
				semesters={semesters}
				onSelect={handleSemesterSelect}
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
