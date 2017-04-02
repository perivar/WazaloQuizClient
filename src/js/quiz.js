jQuery(document).ready(function($) {
	
	/**
	 * @return true if IE
	 */
	function detectIE() {
		var userAgent = window.navigator.userAgent;
		var msie = userAgent.indexOf("MSIE ");
		if (msie > 0) {
			return true;
		}
		
		// also check IE 11
		var trident = userAgent.indexOf("Trident/");
		return trident > 0 ? true : false;
	}
	
	/**
	 * @param {?} data
	 */
	function ieFix(data) {
		$(data).find("#waz_qc_back_container").css("backface-visibility", "visible");
		$(data).find("#waz_qc_back_container").css("transform", "none");
		$(data).find("#waz_qc_back_container").hide();
	}

	function loadQuizzes() {
		$(".waz_qc_quiz").each(function(index) {
			// for each quiz section load the associated data and set the selector and default image
			var quizId = getQuizId(this);
			if (quizId) {
				quizzes[quizId] = eval("quizData_" + quizId);
				quizzes[quizId].selector = this;
				defaultImg = quizzes[quizId].default_img;
			}
		});
		$.each(quizzes, function(quizIndex) {
			$.each(quizzes[quizIndex].questions, function(questionIndex) {
				// only include questions that have answers that have values.
				quizzes[quizIndex].questions[questionIndex].answers = quizzes[quizIndex].questions[questionIndex].answers.filter(function(answerIndex) {
					return "" !== answerIndex.answer || "" !== answerIndex.img;
				});
				if (!(quizzes[quizIndex].questions[questionIndex].hasOwnProperty("answers") && 0 !== quizzes[quizIndex].questions[questionIndex].answers.length)) {
					// add (splice) each of the questions to the questions array
					quizzes[quizIndex].questions.splice(questionIndex);
				}
			});
		});
		$.each(quizzes, function(quizIndex) {
			if ("on" == quizzes[quizIndex].quiz_settings.shuffle_questions) {
				// and shuffle if neccesary
				quizzes[quizIndex].questions = shuffleArray(quizzes[quizIndex].questions);
			}
		});
	}
	
	function preloadImages() {
		$.each(quizzes, function(quizIndex) {
			if (quizzes[quizIndex].questions[0]) {
				lazyLoadQuestion(quizzes[quizIndex].questions[0]);
			}
		});
	}
	
	/**
	 * @param {Object} quiz
	 */
	function lazyLoadResults(quiz) {
		if (quiz.hasOwnProperty("quiz_results")) {
			$.each(quiz.quiz_results, function(index) {
				if (quiz.quiz_results[index].hasOwnProperty("img")) {
					lazyLoadImage(quiz.quiz_results[index].img);
				}
			});
		}
	}
	
	/**
	 * @param {string} imgUrl
	 */
	function lazyLoadImage(imgUrl) {
		if ("" !== imgUrl && (void 0 !== imgUrl && "string" == typeof imgUrl)) {
			var image = new Image();
			image.src = imgUrl;
		}
	}
	
	/**
	 * @param {Object} question
	 */
	function lazyLoadQuestion(question) {
		if (question.hasOwnProperty("img")) {
			lazyLoadImage(question.img);
		}
		if (question.hasOwnProperty("answers")) {
			$.each(question.answers, function(index) {
				if (question.answers[index].hasOwnProperty("img")) {
					lazyLoadImage(question.answers[index].img);
				}
			});
		}
	}
	
	/**
	 * @param div-tag quizDiv
	 * @return the quiz id
	 */
	function getQuizId(quizDiv) {
		var id = $(quizDiv).attr("id");
		return id ? id.replace(/\D+/g, "") : false;
	}

	/**
	 * @param {Object} quiz
	 * quiz_type is either "pt" - personality test or "mc" - normal quiz
	 */
	function showQuestion(quiz) {
		if (quiz.questionCurrentIndex < quiz.questionCount) {
			$(quiz.selector).find(".waz_qc_question_count").html(quiz.questionCurrentIndex + 1 + "/" + quiz.questionCount);
			var quest = quiz.questions[quiz.questionCurrentIndex].question;
			$(quiz.selector).find("#waz_qc_question").html(quest);
			$(quiz.selector).find("#waz_qc_question_back").html(quest);
			var questImg = quiz.questions[quiz.questionCurrentIndex].img;
			$(quiz.selector).find("#waz_qc_answer_container").find(".waz_qc_quiz_question_img").attr("src", questImg);
			$(quiz.selector).find("#waz_qc_back_container").find(".waz_qc_quiz_question_img").attr("src", questImg);
			$(quiz.selector).find("#waz_qc_answer_container").data("id", quiz.questions[quiz.questionCurrentIndex].id);
			
			var curAnswer;
			if ("mc" == quiz.quiz_settings.quiz_type) {
				curAnswer = quiz.questions[quiz.questionCurrentIndex].answers[0];
			}
			var shuffledAnswers = shuffleArray(quiz.questions[quiz.questionCurrentIndex].answers);
			if (quiz.questionCurrentIndex + 1 < quiz.questionCount) {
				lazyLoadQuestion(quiz.questions[quiz.questionCurrentIndex + 1]);
			} else {
				lazyLoadResults(quiz);
			}
			$(quiz.selector).find(".waz_qc_answer_div").hide();
			var answerIndex = 0;
			for (; answerIndex < shuffledAnswers.length; answerIndex++) {
				if ("" !== shuffledAnswers[answerIndex].img || "" !== shuffledAnswers[answerIndex].answer) {
					if ("mc" == quiz.quiz_settings.quiz_type) {
						if (shuffledAnswers[answerIndex].answer == curAnswer.answer) {
							if (shuffledAnswers[answerIndex].img == curAnswer.img) {
								quiz.currentAnswer = $(quiz.selector).find(".waz_qc_answer_div").eq(answerIndex).attr("data-question");
							}
						}
					}
					if ("pt" == quiz.quiz_settings.quiz_type) {
						$(quiz.selector).find(".waz_qc_answer_div").eq(answerIndex).data("results", shuffledAnswers[answerIndex].results);
					}
					$(quiz.selector).find(".waz_qc_answer_div").eq(answerIndex).find(".waz_qc_quiz_answer_img").attr("src", shuffledAnswers[answerIndex].img);
					$(quiz.selector).find(".waz_qc_answer_div").eq(answerIndex).find(".waz_qc_answer_span").html(svgSquare + shuffledAnswers[answerIndex].answer);
					$(quiz.selector).find(".waz_qc_answer_div").eq(answerIndex).data("id", shuffledAnswers[answerIndex].id);
					$(quiz.selector).find(".waz_qc_answer_div").eq(answerIndex).show();
				}
			}
			$(quiz.selector).find("#waz_qc_answer_container").waitForImages(function() {
				maybeAddQuarterClass(quiz.selector);
				scaleFlipBoxQuestion(quiz.selector);
			});
			quiz.questionCurrentIndex = quiz.questionCurrentIndex + 1;
		} else {
			endTest(quiz);
		}
	}

	/**
	 * @param {?} elementSet
	 * @return the maximum outer height in the element set
	 */
	function maxHeightOfElementSet(elementSet) {
		var maxHeight = 0;
		$.each(elementSet, function(element) {
			if (elementSet.eq(element).outerHeight() > maxHeight) {
				maxHeight = elementSet.eq(element).outerHeight();
			}
		});
		return maxHeight;
	}
	
	/**
	 * @param {?} quizDiv
	 */
	function scaleFlipBoxQuestion(quizDiv) {
		var totalHeight = $(quizDiv).find("#waz_qc_question").outerHeight(true);
		totalHeight += $(quizDiv).find(".waz_qc_quiz_question_img").outerHeight(true);
		var numQuestions = 0;
		var maxHeight = 0;
		if ($(quizDiv).find(".waz_qc_answer_div:visible").eq(0).hasClass("waz-qc-twoup")) {
			maxHeight = maxHeightOfElementSet($(quizDiv).find(".waz_qc_answer_div:visible"));
			numQuestions = $(quizDiv).find(".waz_qc_answer_div:visible").length;
			numQuestions = Math.floor(numQuestions / 2) + numQuestions % 2;
			totalHeight += maxHeight * numQuestions;
		} else {
			if ($(quizDiv).find(".waz_qc_answer_div:visible").eq(0).hasClass("waz-qc-threeup")) {
				maxHeight = maxHeightOfElementSet($(quizDiv).find(".waz_qc_answer_div:visible"));
				numQuestions = $(quizDiv).find(".waz_qc_answer_div:visible").length;
				numQuestions /= 3;
				totalHeight += maxHeight * numQuestions;
			} else {
				$(quizDiv).find(".waz_qc_answer_div:visible").each(function() {
					totalHeight += $(this).outerHeight(true);
				});
			}
		}
		if (200 > totalHeight) {
			totalHeight = 200;
		}
		$(quizDiv).find(".waz_qc_quiz_div, #waz_qc_answer_container, #waz_qc_back_container").outerHeight(totalHeight);
	}
	
	/**
	 * @param {?} quizDiv
	 */
	function scaleFlipBoxBack(quizDiv) {
		var maxVisibleHeight = 0;
		$(quizDiv).find("#waz_qc_back_container").children().each(function() {
			if ($(this).is(":visible")) {
				maxVisibleHeight += $(this).outerHeight(true);
			}
		});
		maxVisibleHeight += 35;
		if (400 > maxVisibleHeight) {
			maxVisibleHeight = 400;
		}
		$(quizDiv).find(".waz_qc_quiz_div, #waz_qc_answer_container, #waz_qc_back_container").height(maxVisibleHeight);
	}
	
	/**
	 * @param {?} quizDiv
	 * @return true if true if the quester class has been added
	 */
	function maybeAddQuarterClass(quizDiv) {
		$(quizDiv).find(".waz_qc_answer_div").height("auto");
		$(quizDiv).find(".waz_qc_answer_div").removeClass("waz-qc-twoup waz-qc-threeup");
		$(quizDiv).find(".waz_qc_quiz_answer_img").css("marginBottom", 0);
		var i = true;
		var s = 0;
		if ($(quizDiv).find(".waz_qc_answer_div:visible").each(function() {
				return s++, "" !== $(this).find(".waz_qc_quiz_answer_img").attr("src") && i ? void 0 : (i = false, false);
			}), i) {
			var className = "waz-qc-twoup";
			if (s % 3 === 0) {
				if (0 === $(quizDiv).find(".waz_qc_mobile_check:visible").length) {
					className = "waz-qc-threeup";
				}
			}
			$(quizDiv).find(".waz_qc_answer_div").addClass(className);
			var heightAnswerImages = maxHeightOfElementSet($(quizDiv).find(".waz_qc_quiz_answer_img:visible"));
			if (heightAnswerImages > 200) {
				heightAnswerImages = 200;
			}
			$(quizDiv).find(".waz_qc_quiz_answer_img:visible").each(function() {
				$(this).css("marginBottom", heightAnswerImages - $(this).height() + 10 + "px");
			});
			var heightAnswers = maxHeightOfElementSet($(quizDiv).find(".waz_qc_answer_div:visible"));
			return $(quizDiv).find(".waz_qc_answer_div:visible").outerHeight(heightAnswers), true;
		}
		return false;
	}

	/**
	 * @param {Object} quiz
	 * @return the result string
	 */
	function setResult(quiz) {
		var result = "undefined";
		if ("pt" == quiz.quiz_settings.quiz_type) {
			// personality quizzes use the results array on the questions to determine a score
			
			var highestScore = -1;
			var highestScoreItems = [];
			
			// determine the hightest score out of the results stored
			$.each(quiz.quiz_results, function(quiz, result) {
				if (result.hasOwnProperty("score")) {
					if (result.score > highestScore) {
						highestScore = result.score;
					}
				}
			});
			
			// and find those results that have the same score
			$.each(quiz.quiz_results, function(quiz, result) {
				if (result.hasOwnProperty("score")) {
					if (result.score == highestScore) {
						highestScoreItems.push(result);
					}
				}
			});
			
			// if not a single one of the answers have any scores, just use all
			if (0 === highestScoreItems.length) {
				highestScoreItems = quiz.quiz_results;
			}
			$(quiz.selector).find(".waz_qc_score_text").hide();
			
			// and pick one of them randomly
			result = highestScoreItems[Math.floor(Math.random() * highestScoreItems.length)];
		} else {
			
			// normal quizzes are using the max and min properties of the quiz results to determine the correct result
			var k = 0;
			for (; "undefined" == result; ) {
				if (quiz.quiz_results[k].min <= quiz.score && quiz.quiz_results[k].max >= quiz.score) {
					result = quiz.quiz_results[k];
				} else {
					if (k == quiz.quiz_results.length) {
						result = "error";
					} else {
						k++;
					}
				}
			}
			var scoreStringFix = scoreString.replace("{{SCORE_CORRECT}}", quiz.score);
			scoreStringFix = scoreStringFix.replace("{{SCORE_TOTAL}}", quiz.questionCount);
			$(quiz.selector).find(".waz_qc_score_text").html(scoreStringFix);
		}
		return $(quiz.selector).find(".waz_qc_score_title").html(result.title), $(quiz.selector).find(".waz_qc_score_img").attr("src", result.img), $(quiz.selector).find(".waz_qc_score_desc").html(result.desc), result.hasOwnProperty("id") ? addResult(quiz.ajaxurl, quiz.nonce, quiz.quiz_id, result.id) : addResult(quiz.ajaxurl, quiz.nonce, quiz.quiz_id, quiz.score), "pt" == quiz.quiz_settings.quiz_type ? result.title : result.title ? quiz.score + "/" + quiz.questionCount + ": " + result.title : quiz.score + "/" + quiz.questionCount;
	}
	
	/**
	 * @param {Object} quiz
	 * @return {undefined}
	 */
	function showResponses(quiz) {
		var txt;
		var questionIndex = 0;
		for (; questionIndex < quiz.questions.length; questionIndex++) {
			txt = "";
			txt += quiz.responses[questionIndex].isCorrect ? "<div class='waz_qc_question_response_item correct-answer'>" : "<div class='waz_qc_question_response_item wrong-answer'>";
			txt += "<h3 class='waz_qc_question_response_question'>" + (questionIndex + 1) + ". " + quiz.questions[questionIndex].question + "</h3>";
			txt += "<img class='waz_qc_quiz_question_img' src='" + quiz.questions[questionIndex].img + "'>";
			txt += "<p class='waz_qc_question_response_response'><span class='waz_qc_bold'>" + quiz.your_answer_string + " </span>" + quiz.responses[questionIndex].answer + "</p>";
			txt += "<p class='waz_qc_question_response_correct_answer'><span class='waz_qc_bold'>" + quiz.correct_answer_string + "</span>" + quiz.responses[questionIndex].correctAnswer + "</p>";
			txt += "</div>";
			$(quiz.selector).find(".waz_qc_insert_response_above").before(txt);
			$(quiz.selector).find(".waz_qc_your_answer_container").show();
		}
	}
	
	/**
	 * @param {Object} quiz
	 * @return {undefined}
	 */
	function endTest(quiz) {
		addActivity(quiz.ajaxurl, quiz.nonce, quiz.quiz_id, "completions");
		$(quiz.selector).find(".waz_qc_quiz_footer").hide();
		$(quiz.selector).find(".waz_qc_quiz_div").hide();
		if ("on" == quiz.optin_settings.capture_emails) {
			showOptins(quiz);
		} else {
			showSharingAndResultScreen(quiz, setResult(quiz));
		}
	}
	
	/**
	 * @param {Object} quiz
	 * @return {undefined}
	 */
	function showOptins(quiz) {
		var result = setResult(quiz);
		$(quiz.selector).find(".waz_qc_optin_input").tooltipster({
			trigger: "custom",
			maxWidth: 240,
			theme: ["tooltipster-borderless", "tooltipster-quiz"]
		}).tooltipster("close");
		$(quiz.selector).find(".waz_qc_optin_container").show();
		$(quiz.selector).find(".waz_qc_optin_input").first().focus();
		$(quiz.selector).find(".waz_qc_skip_email_button").click(function() {
			$(quiz.selector).find(".waz_qc_optin_container").hide();
			$(quiz.selector).find(".waz_qc_optin_input").tooltipster("close");
			showSharingAndResultScreen(quiz, result);
		});
		$(quiz.selector).find(".waz_qc_submit_email_button").click(function() {
			var userEmail = $(quiz.selector).find("#waz_qc_email_input").val();
			var userName = $(quiz.selector).find("#waz_qc_name_input").val();
			var emailRegexp = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
			var hasEmail = emailRegexp.test(userEmail);
			var hasUserName = "" !== userName || 0 === $(quiz.selector).find("#waz_qc_name_input").length;
			$(quiz.selector).find(".waz_qc_optin_input").removeClass("waz_qc_invalid");
			quiz.selector.offsetWidth = quiz.selector.offsetWidth;
			if (hasEmail && hasUserName) {
				$(document).unbind("keypress");
				$(quiz.selector).find(".waz_qc_optin_input").tooltipster("close");
				quiz.user = {
					name: userName,
					user_email: userEmail
				};
				addToMailingList(quiz.ajaxurl, quiz.quiz_id, quiz.nonce, userEmail, userName, result);
				$(quiz.selector).find(".waz_qc_optin_container").hide();
				showSharingAndResultScreen(quiz, result);
			} else {
				if (hasEmail) {
					$(quiz.selector).find("#waz_qc_email_input").tooltipster("close");
					$(quiz.selector).find("#waz_qc_email_input").removeClass("waz_qc_invalid");
				} else {
					$(quiz.selector).find("#waz_qc_email_input").tooltipster("open");
					$(quiz.selector).find("#waz_qc_email_input").addClass("waz_qc_invalid");
				}
				if (hasUserName) {
					$(quiz.selector).find("#waz_qc_name_input").tooltipster("close");
					$(quiz.selector).find("#waz_qc_name_input").removeClass("waz_qc_invalid");
				} else {
					$(quiz.selector).find("#waz_qc_name_input").tooltipster("open");
					$(quiz.selector).find("#waz_qc_name_input").addClass("waz_qc_invalid");
				}
			}
		});
		if (0 === $(quiz.selector).find(".waz_qc_skip_email_button").length && 0 === $(quiz.selector).find(".waz_qc_submit_email_button").length) {
			showSharingAndResultScreen(quiz, result);
		} else {
			$(document).keypress(function(event) {
				return 13 == event.which ? ($(quiz.selector).find(".waz_qc_submit_email_button").click(), false) : void 0;
			});
		}
	}
	
	/**
	 * @param {string} ajaxurl
	 * @param {?} quizId
	 * @param {?} nonce
	 * @param {string} email
	 * @param {string} name
	 * @param {Object} result
	 * @return {?}
	 */
	function addToMailingList(ajaxurl, quizId, nonce, email, name, result) {
		return -1 !== optins.indexOf(quizId) ? (console.log("already opted in for this quiz!"), false) : (optins.push(quizId), void $.ajax({
			url: ajaxurl,
			type: "POST",
			data: {
				action: "waz_qc_add_to_mailing_list",
				nonce: nonce,
				quiz_id: quizId,
				email: email,
				name: name,
				result: result
			}
		}).done(function(ajaxurl) {
			console.log(ajaxurl);
		}));
	}
	
	/**
	 * inform the server about an activity
	 * @param {string} ajaxurl is the url to the server app 
	 * @param {?} nonce is the number used once
	 * @param {?} quizId is the id used when defining the quiz
	 * @param {string} type is typically either "starts", "shares" or "completions"
	 * @return {?}
	 */
	function addActivity(ajaxurl, nonce, quizId, type) {
		if ("shares" == type) {
			if (-1 !== shared.indexOf(quizId)) {
				return console.log("already shared this quiz!"), false;
			}
			shared.push(quizId);
		} else {
			if ("completions" == type) {
				if (-1 !== completed.indexOf(quizId)) {
					return console.log("already completed this quiz!"), false;
				}
				completed.push(quizId);
			}
		}
		$.ajax({
			url: ajaxurl,
			type: "POST",
			data: {
				action: "waz_qc_activity",
				nonce: nonce,
				quiz_id: quizId,
				type: type
			}
		}).done(function(ajaxurl) {
			console.log(ajaxurl);
		});
	}
	
	/**
	 * @param {string} ajaxurl
	 * @param {?} nonce
	 * @param {?} quizId
	 * @param {Object} result
	 * @return {?}
	 */
	function addResult(ajaxurl, nonce, quizId, result) {
		return -1 !== results.indexOf(quizId) ? (console.log("already stored results for this quiz!"), false) : (results.push(quizId), void $.ajax({
			url: ajaxurl,
			type: "POST",
			data: {
				action: "waz_qc_add_result",
				nonce: nonce,
				quiz_id: quizId,
				result: result
			}
		}).done(function(ajaxurl) {
			console.log(ajaxurl);
		}));
	}
	
	/**
	 * @param {string} ajaxurl
	 * @param {?} nonce
	 * @param {?} quizId
	 * @param {string} question
	 * @param {Object} answer
	 * @return {undefined}
	 */
	function addResponse(ajaxurl, nonce, quizId, question, answer) {
		$.ajax({
			url: ajaxurl,
			type: "POST",
			data: {
				action: "waz_qc_add_response",
				nonce: nonce,
				quiz_id: quizId,
				question: question,
				response: answer
			}
		}).done(function(ajaxurl) {
			console.log(ajaxurl);
		});
	}
	
	/**
	 * @param {Object} quiz
	 * @param {Object} result
	 * @return {undefined}
	 */
	function sendResponses(quiz, result) {
		var name = "";
		var email = "";
		if (quiz.hasOwnProperty("user")) {
			name = quiz.user.name;
			email = quiz.user.email;
		}
		$.ajax({
			url: quiz.ajaxurl,
			type: "POST",
			data: {
				action: "waz_qc_send_responses",
				nonce: quiz.nonce,
				quiz_id: quiz.quiz_id,
				name: name,
				email: email,
				result: result,
				responses: quiz.responses
			}
		}).done(function(quiz) {
			console.log(quiz);
		});
	}
	
	function restartQuiz() {
		location.reload();
	}
	
	/**
	 * @param {Object} quiz
	 * @param {Object} result
	 * @return {undefined}
	 */
	function showSharingAndResultScreen(quiz, result) {
		sendResponses(quiz, result);
		$(quiz.selector).find(".waz_qc_score_container").show();
		if ("on" == quiz.quiz_settings.restart_button) {
			$("#waz_qc_restart_button").click(function() {
				restartQuiz(quiz);
				$(this).hide();
			}).show("fast");
		}
		if ("end" == quiz.showAnswersAt) {
			showResponses(quiz);
		}
		if ("on" == quiz.quiz_settings.show_sharing) {
			showSharing(quiz, result);
		}
	}
	
	/**
	 * @param {Object} quiz
	 * @return {?}
	 */
	function getCorrectAnswerHtml(quiz) {
		var img = "";
		var s = "";
		return $(quiz.selector).find(".waz_qc_answer_div").each(function() {
			if ($(this).attr("data-question") == quiz.currentAnswer) {
				img = addQuizImg($(this).find(".waz_qc_quiz_answer_img").attr("src"));
				s = $(this).find(".waz_qc_answer_span").html().replace(svgSquare, "");
			}
		}), img + s;
	}
	
	/**
	 * @param {Object} quiz
	 * @param {Object} result
	 * @return {undefined}
	 */
	function showSharing(quiz, result) {
		$(quiz.selector).find(".waz_qc_social_share").show("fast");
		var img = $(quiz.selector).find(".waz_qc_score_img").attr("src");
		if ("" === img) {
			img = $(quiz.selector).find(".waz_qc_quiz_description_img").attr("src");
		}
		if ("" === img) {
			img = defaultImg;
		}
		var facebook = $(quiz.selector).find("#waz_qc_share_link_facebook");
		if (1 == facebook.length) {
			//encodeShareString(quiz, facebook, result);
			//facebook.prop("href", facebook.prop("href") + "&picture=" + img);
			facebook.prop("href", buildFacebookShareUrl(quiz, img, result));
		}
		var twitter = $(quiz.selector).find("#waz_qc_share_link_twitter");
		if (1 == twitter.length) {
			encodeShareString(quiz, twitter, result);
		}
		var email = $(quiz.selector).find("#waz_qc_share_link_email");
		if (1 == email.length) {
			//encodeShareString(quiz, email, result);
			email.prop("href", buildEmailShareUrl(quiz, result));
		}
		var whatsapp = $(quiz.selector).find("#waz_qc_share_link_whatsapp");
		if (1 == whatsapp.length) {
			encodeShareString(quiz, whatsapp, result);
		}
		var pinterest = $(quiz.selector).find("#waz_qc_share_link_pinterest");
		if (1 == pinterest.length) {
			encodeShareString(quiz, pinterest, result);
			pinterest.prop("href", pinterest.prop("href") + "&media=" + img);
		}
		$(quiz.selector).find(".waz_qc_share_link").click(function(types) {
			types.preventDefault();
			var url = $(this).prop("href");
			window.open(url, "_blank", "resizable=yes,scrollbars=yes,titlebar=yes, width=560, height=443, top=100, left=50");
			addActivity(quiz.ajaxurl, quiz.nonce, quiz.quiz_id, "shares");
		});
	}
	
	/**
	 * @param {Object} quiz
	 * @param {?} link
	 * @param {Object} result
	 * @return {undefined}
	 */
	function encodeShareString(quiz, link, result) {
		var encoded = encodeURIComponent(quiz.sharestring.replace("{{MY_QUIZ_RESULT}}", result));
		var href = link.prop("href");
		link.prop("href", href + encoded);
	}

	/**
	 * Generate the facebook sharing url
	 * @see https://developers.facebook.com/docs/sharing/reference/feed-dialog
	 */
	function buildFacebookShareUrl(quiz, img, result) {
		// https://www.facebook.com/dialog/feed?app_id=177036859470519&amp;link=&amp;name=The+Ultimate+Star+Wars+Quiz&amp;caption=Padawan+or+Jedi+Master%3F+Try+this+Quiz.&amp;description=
		var url = "https://www.facebook.com/dialog/feed?app_id=" + 
			quiz.facebook_app_id + "&link=" + encodeURIComponent(quiz.shareurl) + 
            "&name=" + encodeURIComponent(quiz.sharename) + 
			"&caption=" + encodeURIComponent(quiz.sharecaption.replace("{{MY_QUIZ_RESULT}}", result)) + 
			"&description=" + encodeURIComponent(quiz.sharestring.replace("{{MY_QUIZ_RESULT}}", result)) + 
			"&picture=" + img;
		return url;					
	}

	/**
	 * Generate the email sharing url
	 */
	function buildEmailShareUrl(quiz, result) {
		var url = "mailto:?body=" + encodeURIComponent(quiz.sharename + " " + quiz.shareurl) + 
			"&subject=" + encodeURIComponent(quiz.sharestring.replace("{{MY_QUIZ_RESULT}}", result));
		return url;					
	}
	
	/**
	 * @param {string} imgUrl
	 * @return {?}
	 */
	function addQuizImg(imgUrl) {
		return imgUrl && ("" !== imgUrl && "string" == typeof imgUrl) ? "<img class='waz_qc_quiz_answer_img' src='" + imgUrl + "'>" : "";
	}
	
	/**
	 * @param {?} element
	 * @return {undefined}
	 */
	function scrollIntoView(element) {
		var targetOffset = $(element).offset().top;
		if (0 > targetOffset) {
			targetOffset = 0;
		}
		$("html, body").animate({
			scrollTop: targetOffset
		}, 300);
	}
	
	/**
	 * Java Script Debounce Method
	 * Returns a function, that, as long as it continues to be invoked, will not
	 * be triggered. The function will be called after it stops being called for
	 * N milliseconds. If `immediate` is passed, trigger the function on the
	 * leading edge, instead of the trailing.
	 * @see https://davidwalsh.name/javascript-debounce-function
	 * @see https://john-dugan.com/javascript-debounce/
	 */
	function debounce(func, wait, immediate) {
		var timeout;
		return function() {
			var context = this,
				args = arguments;
			var later = function() {
				timeout = null;
				if (!immediate) func.apply(context, args);
			};
			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) func.apply(context, args);
		};
	}
	
	/**
	 * Shuffling the contents of an array.
	 * Use something that Fisher-Yates devised and Don Knuth popularized.
	 * @see https://www.kirupa.com/html5/shuffling_array_js.htm
	 */
	function shuffleArray(array) {
		for (var i = array.length - 1; i > 0; i--) {
			var j = Math.floor(Math.random() * (i + 1));
			var temp = array[i];
			array[i] = array[j];
			array[j] = temp;
		}
		return array;
	}
	
	var usingIE = detectIE();
	var scoreString = $(".waz_qc_score_text").first().html();
	var svgSquare = '<svg class="waz_qc_rectancle" width="26" height="26"><rect width="26" height="26" style="fill:#fff;stroke-width:1;stroke:#000;"></rect></svg>';
	var quizzes = {};
	var defaultImg = "";
	
	loadQuizzes();
	preloadImages();
	
	$(".waz_qc_start_button").click(function() {
		var quiz = quizzes[getQuizId($(this).closest(".waz_qc_quiz"))];
		addActivity(quiz.ajaxurl, quiz.nonce, quiz.quiz_id, "starts");
		if (usingIE) {
			ieFix(quiz.selector);
		}
		quiz.questionCurrentIndex = 0;
		quiz.score = 0;
		quiz.responses = [];
		quiz.questionCount = quiz.questions.length;
		quiz.showAnswersAt = "" === quiz.quiz_settings.hide_answers ? "after" : "on" === quiz.quiz_settings.hide_answers ? "end" : quiz.quiz_settings.hide_answers;
		$(this).siblings(".waz_qc_quiz_title").hide();
		$(this).siblings(".waz_qc_quiz_description").hide();
		$(this).siblings(".waz_qc_quiz_description_img").hide();
		$(this).hide();
		$(this).siblings(".waz_qc_quiz_div").show();
		$(this).siblings(".waz_qc_quiz_footer").show();
		$(this).siblings(".flip-container").show();
		$(this).siblings(".waz_qc_question_count").html("1/" + quiz.questionCount);
		showQuestion(quiz);
		scrollIntoView(quiz.selector);
	});
	$(".waz_qc_next_question").click(function() {
		var quiz = quizzes[getQuizId($(this).closest(".waz_qc_quiz"))];
		if (usingIE) {
			$(quiz.selector).find("#waz_qc_answer_container").show();
			$(quiz.selector).find("#waz_qc_back_container").hide();
		} else {
			$(quiz.selector).find(".waz_qc_quiz_div").removeClass("flip");
		}
		showQuestion(quiz);
	});
	$(".waz_qc_answer_div").click(function() {
		var quiz = quizzes[getQuizId($(this).closest(".waz_qc_quiz"))];
		scrollIntoView(quiz.selector);
		$(this).blur();
		var isCorrect = false;
		if ($(this).attr("data-question") === quiz.currentAnswer) {
			quiz.score = quiz.score + 1;
			isCorrect = true;
		}
		var response = {
			answer: addQuizImg($(this).children(".waz_qc_quiz_answer_img").attr("src")) + $(this).children(".waz_qc_answer_span").html().replace(svgSquare, ""),
			isCorrect: isCorrect,
			correctAnswer: getCorrectAnswerHtml(quiz),
			question: $(this).siblings("#waz_qc_question").html()
		};
		if (quiz.responses.push(response), addResponse(quiz.ajaxurl, quiz.nonce, quiz.quiz_id, response.question, response.answer), "pt" == quiz.quiz_settings.quiz_type) {
			// compare the question results array with the quiz results
			$.each($(this).data("results"), function(answerResultKey, answerResultValue) {
				$.each(quiz.quiz_results, function(index, quizResult) {
					if (answerResultValue == quizResult.id) {
						// store the score property if we have a match
						quizResult.score = quizResult.hasOwnProperty("score") ? quizResult.score + 1 : 1;
						return true; // continue if a match
					}
				});
			});
			showQuestion(quiz);
		} else {
			if ("after" == quiz.showAnswersAt) {
				// use the flip style to show the answer immediately after the user has answered
				$(quiz.selector).find("#waz_qc_your_answer").html(addQuizImg($(this).children(".waz_qc_quiz_answer_img").attr("src")) + $(this).children(".waz_qc_answer_span").html().replace(svgSquare, ""));
				var correctHtml = getCorrectAnswerHtml(quiz);
				$(quiz.selector).find("#waz_qc_correct_answer").html(correctHtml);
				if (usingIE) {
					$(quiz.selector).find("#waz_qc_answer_container").hide();
					$(quiz.selector).find("#waz_qc_back_container").show();
				} else {
					$(quiz.selector).find(".waz_qc_quiz_div").addClass("flip");
				}
				$(quiz.selector).find("#waz_qc_back_container").removeClass("correct-answer");
				$(quiz.selector).find("#waz_qc_back_container").removeClass("wrong-answer");
				if (isCorrect) {
					$(quiz.selector).find("#waz_qc_back_container").addClass("correct-answer");
					$(quiz.selector).find("#waz_qc_question_right_or_wrong").html(quiz.correct_string);
					$(quiz.selector).find("#waz_qc_correct_answer_p").hide();
				} else {
					$(quiz.selector).find("#waz_qc_back_container").addClass("wrong-answer");
					$(quiz.selector).find("#waz_qc_question_right_or_wrong").html(quiz.wrong_string);
					$(quiz.selector).find("#waz_qc_correct_answer_p").show();
				}
				scaleFlipBoxBack(quiz.selector);
			} else {
				// wait until the end of the quiz to show the answers, only show the next question
				showQuestion(quiz);
			}
		}
	});
	
	var optins = [];
	var shared = [];
	var completed = [];
	var results = [];
	var resizeWindow = debounce(function() {
		jQuery.each(quizzes, function(path) {
			$(quizzes[path].selector).find("#waz_qc_answer_container").waitForImages(function() {
				maybeAddQuarterClass(quizzes[path].selector);
				scaleFlipBoxQuestion(quizzes[path].selector);
			});
		});
	}, 50);
	window.addEventListener("resize", resizeWindow);
});