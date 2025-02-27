
const scripts = {
	submitForm: (username: string, password: string) => `
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
			loginForm.submit();

		})();
		`,

	validateLogin_: `
		setTimeout(() => {
			(function() {
				try {
					var errorPattern = '/\b(Invalid\s*Captcha|Invalid\s*Username\s*\/?\s*Password|Maximum\s*(no\.?|number)?\s*of\s*Attempts\s*reached|Account\s*Locked)\b/i';
					var pageText = document.documentElement.innerText || "";

					if (!pageText.trim()) {
						window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'ERROR', message: 'No page text found' }));
						return;
					}

					var match = pageText.match(errorPattern);
					if (match) {
						window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'LOGIN_VALIDATED', error_message: match[0] }));
						return;
					}

					window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'LOGIN_VALIDATED', message: pageText }));
				} catch (e) {
					window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'ERROR', message: e.message }));
				}
			})();
		}, 2000); // Wait for 2 seconds
	`,

	validateLogin: `
		(function() {
			const errorMessages = [
				"Invalid Captcha",
				"VTOP Login",
				"Invalid LoginId/Password",
				"Invalid Username/Password",
				"Invalid Username",
				"Maximum no. of Attempts reached",
				"Maximum number of Attempts reached",
				"Account Locked"
			];

			var pageText = document.documentElement.innerText || "";

			// Normalize spaces to handle inconsistent spacing
			var cleanedText = pageText.replace(/\s+/g, ' ').trim();

			for (var i = 0; i < errorMessages.length; i++) {
				if (cleanedText.includes(errorMessages[i])) {
					window.ReactNativeWebView.postMessage(JSON.stringify({ 
						status: 'LOGIN_VALIDATED', 
						error_message: errorMessages[i] 
					}));
					return;
				}
			}

			window.ReactNativeWebView.postMessage(JSON.stringify({ 
				status: 'LOGIN_VALIDATED', 
				message: 'ok', 
			}));
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
					   '&_csrf=' + $('input[name="_csrf"]').val() ;

			var response = { status: 'GOT_CREDITS_CGPA'};

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

					window.ReactNativeWebView.postMessage(JSON.stringify(response));
				}
			});
		})();

		` ,
	getCourses: (selectedSemester: string) => `
	(function() {
		try {
			var csrfToken = document.querySelector('input[name="_csrf"]')?.value || '';
			var authorizedID = document.getElementById('authorizedIDX')?.value || '';
			var selectedSemester = '${selectedSemester}';
			var timestamp = new Date().toUTCString();

			var data = \`_csrf=\${csrfToken}&semesterSubId=\${selectedSemester}&authorizedID=\${authorizedID}&x=\${timestamp}\`;

			let response = {
				status: 'GOT_COURSES',
				courses: []
			};

			fetch('processViewTimeTable', {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: data
			})
			.then(res => res.text())
			.then(html => {
				var doc = new DOMParser().parseFromString(html, 'text/html');
				var studentDetails = doc.getElementById('studentDetailsList');

				if (!studentDetails) {
					window.ReactNativeWebView.postMessage(JSON.stringify({ error: "No student details found" }));
					return;
				}

				var table = studentDetails.getElementsByTagName('table')[0];
				var headings = table.getElementsByTagName('th');
				var courseIndex, creditsIndex, slotVenueIndex, facultyIndex;

				for (var i = 0; i < headings.length; ++i) {
					var heading = headings[i].innerText.toLowerCase();
					if (heading === 'course') {
						courseIndex = i;
					} else if (heading === 'l t p j c') {
						creditsIndex = i;
					} else if (heading.includes('slot')) {
						slotVenueIndex = i;
					} else if (heading.includes('faculty')) {
						facultyIndex = i;
					}
				}

				var cells = table.getElementsByTagName('td');
				var headingOffset = headings[0].innerText.toLowerCase().includes('invoice') ? -1 : 0;
				var cellOffset = cells[0].innerText.toLowerCase().includes('invoice') ? 1 : 0;
				var offset = headingOffset + cellOffset;

				while (courseIndex < cells.length && 
					   creditsIndex < cells.length && 
					   slotVenueIndex < cells.length && 
					   facultyIndex < cells.length) {
						   
					var course = {};
					var rawCourse = cells[courseIndex + offset].innerText.replace(/\\t/g, '').replace(/\\n/g, ' ');
					var rawCourseType = rawCourse.split('(').slice(-1)[0].toLowerCase();
					var rawCredits = cells[creditsIndex + offset].innerText.replace(/\\t/g, '').replace(/\\n/g, ' ').trim().split(' ');
					var rawSlotVenue = cells[slotVenueIndex + offset].innerText.replace(/\\t/g, '').replace(/\\n/g, '').split('-');
					var rawFaculty = cells[facultyIndex + offset].innerText.replace(/\\t/g, '').replace(/\\n/g, '').split('-');

					course.code = rawCourse.split('-')[0].trim();
					course.title = rawCourse.split('-').slice(1).join('-').split('(')[0].trim();
					course.type = (rawCourseType.includes('lab')) ? 'lab' : 
								  ((rawCourseType.includes('project')) ? 'project' : 'theory');
					course.credits = parseInt(rawCredits[rawCredits.length - 1]) || 0;
					course.slots = rawSlotVenue[0].trim().split('+');
					course.venue = rawSlotVenue.slice(1, rawSlotVenue.length).join(' - ').trim();
					course.faculty = rawFaculty[0].trim();

					response.courses.push(course);

					courseIndex += headings.length + headingOffset;
					creditsIndex += headings.length + headingOffset;
					slotVenueIndex += headings.length + headingOffset;
					facultyIndex += headings.length + headingOffset;
				}

				window.ReactNativeWebView.postMessage(JSON.stringify(response));
			})
			.catch(error => {
				window.ReactNativeWebView.postMessage(JSON.stringify({ error: error.message, status: 'GOT_COURSES' }));
			});

		} catch (error) {
			window.ReactNativeWebView.postMessage(JSON.stringify({ error: error.message, status: 'GOT_COURSES' }));
		}
	})();`,

	getTimetable: (selectedSemester: string) => `
	(function() {
		var csrfToken = document.querySelector('input[name="_csrf"]')?.value || '';
		var authorizedID = document.getElementById('authorizedIDX')?.value || '';
		var selectedSemester = '${selectedSemester}';
		var timestamp = new Date().toUTCString();

		var data = \`_csrf=\${csrfToken}&semesterSubId=\${selectedSemester}&authorizedID=\${authorizedID}&x=\${timestamp}\`;

		var response = {
			lab: [],
			theory: [],
			status: 'GOT_TIMETABLE'
		};

		fetch("processViewTimeTable", {
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded"
				},
				body: data
			})
			.then(res => res.text())
			.then(res => {
				var doc = new DOMParser().parseFromString(res, "text/html");
				var spans = doc.getElementById("getStudentDetails").getElementsByTagName("span");
				if (spans[0].innerText.toLowerCase().includes("no record(s) found")) {
					return;
				}
				var cells = doc.getElementById("timeTableStyle").getElementsByTagName("td");
				var key, type;
				for (var i = 0, j = 0; i < cells.length; ++i) {
					var content = cells[i].innerText.toUpperCase();
					if (content.includes("THEORY")) {
						type = "theory";
						j = 0;
						continue;
					} else if (content.includes("LAB")) {
						type = "lab";
						j = 0;
						continue;
					} else if (content.includes("START")) {
						key = "start";
						continue;
					} else if (content.includes("END")) {
						key = "end";
						continue;
					} else if (content.includes("SUN")) {
						key = "sunday";
						continue;
					} else if (content.includes("MON")) {
						key = "monday";
						continue;
					} else if (content.includes("TUE")) {
						key = "tuesday";
						continue;
					} else if (content.includes("WED")) {
						key = "wednesday";
						continue;
					} else if (content.includes("THU")) {
						key = "thursday";
						continue;
					} else if (content.includes("FRI")) {
						key = "friday";
						continue;
					} else if (content.includes("SAT")) {
						key = "saturday";
						continue;
					} else if (content.includes("LUNCH")) {
						continue;
					}
					if (key == "start") {
						response[type].push({ start_time: content.trim() });
					} else if (key == "end") {
						response[type][j++].end_time = content.trim();
					} else if (cells[i].bgColor == "#CCFF33") {
						response[type][j++][key] = content.split("-")[0].trim();
					} else {
						response[type][j++][key] = null;
					}
				}
			})
			.catch(err => console.error(err))
			.finally(() => window.ReactNativeWebView.postMessage(JSON.stringify(response, null, 2)));
		})();
	`
};


export default scripts;
