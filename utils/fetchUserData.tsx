import { WebView } from "react-native-webview";
import React, { useRef, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { View, ActivityIndicator } from "react-native";
import CaptchaHandler from "@/components/CaptchaHandler";
import CaptchaDialog from "@/components/CaptchaDialog";

// export default function fetchUserData({ onDataFetched }) {


interface FetchUserDataProps {
	onDataFetched: (data: any) => void;
}

const FetchUserData: React.FC<FetchUserDataProps> = ({ onDataFetched }) => {
	const webViewRef = useRef<WebView | null>(null);
	const [loading, setLoading] = useState(true);
	const [response, setResponse] = useState(null);
	const [status, setStatus] = useState('Loading...');
	const [currentStep, setCurrentStep] = useState('INIT')
	const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
	const [captchaImage, setCaptchaImage] = useState('');
	const [showCaptchaDialog, setShowCaptchaDialog] = useState(false);
	const [token, setToken] = useState("");

	// get from user
	const username = "";
	const password = "";


	const handleCaptchaSubmit = (text: string) => {
		webViewRef.current?.injectJavaScript(`window.submitCaptcha('${text}')`);
		setShowCaptchaDialog(false);
		setLoading(false);
		onDataFetched("default captcha")
	};


	const detectPage = `
        (function() {
            const response = { page_type: 'LANDING' };
            
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
        const response = {
            success: false
        };

        $.ajax({
            type: 'POST',
            url: '/vtop/prelogin/setup',
            data: $('#stdForm').serialize(),
            async: false,
            success: function(res) {
                response.success = true;
            }
        });

        return response;
    })();
    `;

	const getCaptchaType = `
		(function() {
				const response = {
						captcha_type: 'DEFAULT'
				};

				if ($('input[id="gResponse"]').length === 1) {
						response.captcha_type = 'GRECAPTCHA';
				}

				return response;
		})();
	`

	const getCaptcha = `
		(function() {
				return {
						captcha: $('#captchaBlock img').get(0).src
				};
		})();
	`

	const greCaptcha = `
		(function() {
				function getSiteKey() {
						var siteKeyElement = document.querySelector("[data-sitekey]");
						// window.ReactNativeWebView.postMessage(JSON.stringify({ type: "TOKEN", message: siteKeyElement}));
						return siteKeyElement.getAttribute("data-sitekey");
				}

				function executeRecaptcha() {
						var siteKey = getSiteKey();
						window.ReactNativeWebView.postMessage(JSON.stringify({ type: "RECAPTCHA_TOKEN", message: siteKey}));
						if (!siteKey) {
								window.ReactNativeWebView.postMessage(JSON.stringify({ type: "RECAPTCHA_ERROR", message: "Site key not found"}));
								return;
						}

						grecaptcha.execute(siteKey).then(function(token) {
								window.ReactNativeWebView.postMessage(JSON.stringify({ type: "RECAPTCHA_TOKEN", token: token }));
						}).catch(function() {
								window.ReactNativeWebView.postMessage(JSON.stringify({ type: "RECAPTCHA_ERROR", message: "Failed to get token" }));
						});
				}

				if (typeof grecaptcha !== 'undefined') {
						executeRecaptcha();
				} else {
						setTimeout(executeRecaptcha, 2000);
				}
		})();
		`;

	// todo: make sure this gets dynamically changed before you inject it.
	const submitForm = `
        (function() {
            // Clear previous intervals
            if (typeof captchaInterval !== 'undefined') clearInterval(captchaInterval);
            if (typeof executeInterval !== 'undefined') clearInterval(executeInterval);

            // Fill login form fields
            document.querySelector('#vtopLoginForm [name="username"]').value = '${username.replace(/'/g, "\\'")}';
            document.querySelector('#vtopLoginForm [name="password"]').value = '${password.replace(/'/g, "\\'")}';
            document.querySelector('#vtopLoginForm [name="captchaStr"]').value = '${token.replace(/'/g, "\\'")}';
            document.querySelector('#vtopLoginForm [name="gResponse"]').value = '${token.replace(/'/g, "\\'")}';

            // Initialize response object
            var response = { authorised: false, error_message: null, error_code: 0 };

            // Send login request
            fetch('/vtop/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(new FormData(document.querySelector('#vtopLoginForm')))
            })
            .then(res => res.text())
            .then(res => {
                document.querySelector('#page_outline').innerHTML = res;

                if (res.includes('authorizedIDX')) {
                    response.authorised = true;
                } else {
                    var pageContent = res.toLowerCase();
                    if (/invalid\\s*captcha/.test(pageContent)) {
                        response.error_message = 'Invalid Captcha';
                        response.error_code = 1;
                    } else if (/invalid\\s*(user\\s*name|login\\s*id|user\\s*id)\\s*\\/\\s*password/.test(pageContent)) {
                        response.error_message = 'Invalid Username / Password';
                        response.error_code = 2;
                    } else if (/account\\s*is\\s*locked/.test(pageContent)) {
                        response.error_message = 'Your Account is Locked';
                        response.error_code = 3;
                    } else if (/maximum\\s*fail\\s*attempts\\s*reached/.test(pageContent)) {
                        response.error_message = 'Maximum login attempts reached, open VTOP in your browser to reset your password';
                        response.error_code = 4;
                    } else {
                        response.error_message = 'Unknown error';
                        response.error_code = 5;
                    }
                }

                // Send response back to React Native
                window.ReactNativeWebView.postMessage(JSON.stringify(response));
            })
            .catch(error => {
                window.ReactNativeWebView.postMessage(JSON.stringify({ error: error.message }));
            });
        })();
    `;



	const handleMessage = (event) => {
		const data = JSON.parse(event.nativeEvent.data);
		console.log('WebView Response: ', data);
		console.log('Current Status: ', status);

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
							setStatus('On Landing page, Navigating to Sign In...');
							webViewRef.current.injectJavaScript(openSignIn);
							break;

						case 'LOGIN':
							setStatus('On Login Page, getting captchas')
							setCurrentStep('GET_CAPTCHA_TYPE')
							break;

						case 'HOME':
							//already signed in, proceed to next step
							setCurrentStep('FETCH_MARKS')
					}
					break;

				case 'GET_CAPTCHA_TYPE':
					setStatus('Getting Captcha Type & Displaying to User...');
					webViewRef.current.injectJavaScript(getCaptchaType)

					// setting a timeout to reload the webview lest we do not get a 
					// response from the server
					const id = setTimeout(() => {
						console.log('No response received, reloading WebView...');
						webViewRef.current?.reload();
						setCurrentStep('GET_CAPTCHA_TYPE');
					}, 2000);

					// storing the id of the timeout to clear it when we get a response
					setTimeoutId(id);

					setCurrentStep('HANDLE_CAPTCHA')
					break;

				case 'HANDLE_CAPTCHA':
					if (data.captcha_type === "DEFAULT") {
						webViewRef.current.injectJavaScript(getCaptcha);
						setStatus('Dealing with Default Captcha..')
						setCurrentStep('DISPLAY_CAPTCHA')
					}
					else {
						console.log("Type: grecaptcha");
						webViewRef.current.injectJavaScript(greCaptcha);
						setStatus('Dealing with GreCaptcha..')
						setCurrentStep('GRECAPTCHA')
						// do grecaptcha stuff
					}
					break;

				// to display the default captcha
				case 'DISPLAY_CAPTCHA':
					if (data.captcha_image) {
						setCaptchaImage(data.captcha_image);
						setShowCaptchaDialog(true);
					}
					break;

				case 'GRECAPTCHA':
					console.log('Token Received: ', data);
					setToken(data.message);
					webViewRef.current.injectJavaScript(submitForm);
					onDataFetched(data);
					setLoading(false);

				case 'FINISHED':
					setLoading(false);
					onDataFetched(data);
					break;
			}
		}
	}

	return (
		<>
			{loading && (
				<WebView
					ref={webViewRef}
					source={{ uri: 'https://vtopcc.vit.ac.in/vtop/login' }}
					injectedJavaScript={detectPage}
					onMessage={handleMessage}
					style={{ height: 0, display: "none" }}
				/>
			)}
			<CaptchaDialog
				visible={showCaptchaDialog}
				image={captchaImage}
				onSubmit={handleCaptchaSubmit}
				onCancel={() => setShowCaptchaDialog(false)}
			/>
		</>
	);
}

export default FetchUserData;
