import { WebView } from "react-native-webview";
import React, { useRef, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { View, ActivityIndicator, Text, StyleSheet } from "react-native";
import CaptchaDialog from "@/components/CaptchaDialog";
import SelectSemesterModal from "@/components/SelectSemesterModal";
import scripts from "./scripts";


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

	function saveInfo(key: string, value: string) {
		SecureStore.setItem(key, value);
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
		injectScript('getName');
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

			loginForm.submit();
		})();
		`);
		console.log('Form Submitted');
		injectScript('fetchSemesters');
	};



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

						injectScript('openSignIn');
						setCount(count + 1);
						break;

					case 'LOGIN':
						// in login page
						console.log('In Login Page');
						injectScript('getCaptchaType');
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
						injectScript('getCaptchaType');
					}, 300);
				} else if (data.success === false) {
					console.log('Auth Failure. Retrying...');
					setUrl('https://vtopcc.vit.ac.in/');
					injectScript('openSignIn');
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
						injectScript('getCaptcha');
					}, 700);
					console.log('bye');
					setGettingCaptcha(true);
				} else if (data.captcha_type == 'GRECAPTCHA') {
					console.log('Captcha Type: greCaptcha');
					// todo: later
					injectScript('greCaptcha');
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
				injectScript('submitForm', username, password);
				console.log('Form Submitted');

				setTimeout(() => {
					injectScript('validateLogin');
				}, 3000);

				// setShowReCaptchaDialog(true);
				// console.log(showReCaptchaDialog);
				break;

			case 'LOGIN_VALIDATED':
				console.log('Validating Login...');
				if (data.error_message) {
					console.log(data.error_message);
					setLoading(false);
					onDataFetched(data.error_message);
				} else {
					console.log('Login Validated');
					injectScript('fetchSemesters');
				}

			case 'SUBMITTED_FORM':
				console.log('In Home Page..');
				console.log('Page Text: ', data.page_text);

				setUrl('https://vtopcc.vit.ac.in/vtop/content');
				console.log('Fetching Semesters...');
				injectScript('fetchSemesters');
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
				injectScript('getCreditsAndCGPA');
				break;

			case 'GOT_CREDITS_CGPA':
				console.log('Fetched Credits & CGPA');

				if (data.total_credits && data.cgpa) {
					saveInfo('credits', JSON.stringify(data.total_credits));
					saveInfo('cgpa', JSON.stringify(data.cgpa));
				}

				console.log('getting courses now...');
				console.log('selectedSemester: ', selectedSemester);
				injectScript('getCourses', selectedSemester);
				break;

			case 'GOT_COURSES':
				console.log('Fetched Courses');
				console.log(data);
				saveInfo('courses', JSON.stringify(data.courses));
				console.log('selectedSemester: ', selectedSemester);
				injectScript('getTimeTable', selectedSemester);
				break;

			case 'FINISHED':
				setLoading(false);
				onDataFetched(data);
				break;
		}
	}


	// useEffect(() => {
	// 	const specialScripts = ['getCourses', 'getTimeTable'];
	//
	// 	if (currentStep in specialScripts){
	// 		injectScript(currentStep, selectedSemester);
	// 	} else {
	// 		injectScript(currentStep); 
	// 	}
	// }, [currentStep])
	//
	const injectScript = (step: string, ...args: any[]) => {
		const script = scripts[step];

		let scriptCode;
		if (typeof script === "function") {
			scriptCode = script(...args);
		} else {
			scriptCode = script;
		}

		if (scriptCode && webViewRef.current) {
			webViewRef.current.injectJavaScript(scriptCode);
		}
	};

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
