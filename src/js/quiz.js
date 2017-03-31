jQuery(document)
	.ready(function($) {
		
		function detectIE() {
			var uagent = window.navigator.userAgent,
				msie = uagent.indexOf("MSIE ");
			if (msie > 0) return !0;
			
			// also check IE 11
			var trident = uagent.indexOf("Trident/");
			return trident > 0 ? !0 : !1
		}

		function ieFix(e) {
			$(e)
				.find("#waz_qc_back_container")
				.css("backface-visibility", "visible"), $(e)
				.find("#waz_qc_back_container")
				.css("transform", "none"), $(e)
				.find("#waz_qc_back_container")
				.hide()
		}

		function loadQuizzes() {
			$(".waz_qc_quiz")
				.each(function(index) {
					// for each quiz section load the associated data and set the selector and default image
					var thisId = get_quiz_id(this);
					thisId && ( 
						quizzes[thisId] = eval("quizData_" + thisId), 
						quizzes[thisId].selector = this, 
						default_img = quizzes[thisId].default_img
					);
				}), $.each(quizzes, function(quiz_index) {
						$.each(quizzes[quiz_index].questions, function(question_index) {
							// only include questions that have answers that have values. 
							// Add (splice) each of the questions to the questions array
							quizzes[quiz_index].questions[question_index].answers = quizzes[quiz_index].questions[question_index].answers.filter(
								function(answer_index) {
									return "" !== answer_index.answer || "" !== answer_index.img
								}
							), 
							quizzes[quiz_index].questions[question_index].hasOwnProperty("answers") && 0 !== quizzes[quiz_index].questions[question_index].answers.length || quizzes[quiz_index].questions.splice(question_index)
						})
				}), $.each(quizzes, function(quiz_index) {
					// and shuffle if neccesary
					"on" == quizzes[quiz_index].quiz_settings.shuffle_questions && (quizzes[quiz_index].questions = shuffleArray(quizzes[quiz_index].questions))
				})
		}

		function preloadImages() {
			$.each(quizzes, function(quiz_index) {
				quizzes[quiz_index].questions[0] && lazyLoadQuestion(quizzes[quiz_index].questions[0])
			})
		}

		function lazyLoadResults(quiz) {
			quiz.hasOwnProperty("quiz_results") && $.each(quiz.quiz_results, function(index) {
				quiz.quiz_results[index].hasOwnProperty("img") && lazyLoadImage(quiz.quiz_results[index].img)
			})
		}

		function lazyLoadImage(img_url) {
			if ("" !== img_url && void 0 !== img_url && "string" == typeof img_url) {
				var img = new Image;
				img.src = img_url
			}
		}

		function lazyLoadQuestion(question) {
			question.hasOwnProperty("img") && lazyLoadImage(question.img), question.hasOwnProperty("answers") && $.each(question.answers, function(index) {
				question.answers[index].hasOwnProperty("img") && lazyLoadImage(question.answers[index].img)
			})
		}

		function get_quiz_id(quiz_div) {
			var i = $(quiz_div).attr("id");
			return i ? i.replace(/\D+/g, "") : !1
		}
		
		// quiz_type is either "pt" - personality test or "mc" - normal quiz
		function showQuestion(quiz) {
			if (quiz.currentQuestion < quiz.questionCount) {
				$(quiz.selector)
					.find(".waz_qc_question_count")
					.html(quiz.currentQuestion + 1 + "/" + quiz.questionCount);
				
				var quest = quiz.questions[quiz.currentQuestion].question;
				$(quiz.selector)
					.find("#waz_qc_question")
					.html(quest), $(quiz.selector)
					.find("#waz_qc_question_back")
					.html(quest);
					
				var quest_img = quiz.questions[quiz.currentQuestion].img;
				$(quiz.selector)
					.find("#waz_qc_answer_container")
					.find(".waz_qc_quiz_question_img")
					.attr("src", quest_img), $(quiz.selector)
					.find("#waz_qc_back_container")
					.find(".waz_qc_quiz_question_img")
					.attr("src", quest_img), $(quiz.selector)
					.find("#waz_qc_answer_container")
					.data("id", quiz.questions[quiz.currentQuestion].id);
				
				var answer;
				"mc" == quiz.quiz_settings.quiz_type && (answer = quiz.questions[quiz.currentQuestion].answers[0]);
				
				var shuffled_questions = shuffleArray(quiz.questions[quiz.currentQuestion].answers);
				quiz.currentQuestion + 1 < quiz.questionCount ? lazyLoadQuestion(quiz.questions[quiz.currentQuestion + 1]) : lazyLoadResults(quiz), $(quiz.selector)
					.find(".waz_qc_answer_div")
					.hide();
					
				for (var question_index = 0; question_index < shuffled_questions.length; question_index++)
					("" !== shuffled_questions[question_index].img || "" !== shuffled_questions[question_index].answer) && ("mc" == quiz.quiz_settings.quiz_type && shuffled_questions[question_index].answer == answer.answer && shuffled_questions[question_index].img == answer.img && (quiz.currentAnswer = $(quiz.selector)
						.find(".waz_qc_answer_div")
						.eq(question_index)
						.attr("data-question")), "pt" == quiz.quiz_settings.quiz_type && $(quiz.selector)
					.find(".waz_qc_answer_div")
					.eq(question_index)
					.data("results", shuffled_questions[question_index].results), $(quiz.selector)
					.find(".waz_qc_answer_div")
					.eq(question_index)
					.find(".waz_qc_quiz_answer_img")
					.attr("src", shuffled_questions[question_index].img), $(quiz.selector)
					.find(".waz_qc_answer_div")
					.eq(question_index)
					.find(".waz_qc_answer_span")
					.html(svg_square + shuffled_questions[question_index].answer), $(quiz.selector)
					.find(".waz_qc_answer_div")
					.eq(question_index)
					.data("id", shuffled_questions[question_index].id), $(quiz.selector)
					.find(".waz_qc_answer_div")
					.eq(question_index)
					.show());
					
				$(quiz.selector)
					.find("#waz_qc_answer_container")
					.waitForImages(function() {
						maybe_add_quarter_class(quiz.selector), scale_flip_box_question(quiz.selector)
					}), quiz.currentQuestion = quiz.currentQuestion + 1
			} else endTest(quiz)
		}

		/** 
		 * Return the maximum outer height in the element set
		 */
		function maxHeightOfElementSet(element_set) {
			var i = 0;
			return $.each(element_set, function(element) {
					element_set.eq(element).outerHeight() > i 
					&& (i = element_set.eq(element).outerHeight())
				}), i
		}

		function scale_flip_box_question(quiz_div) {
			var total_question_heigh = $(quiz_div)
				.find("#waz_qc_question")
				.outerHeight(!0);
			total_question_heigh += $(quiz_div)
				.find(".waz_qc_quiz_question_img")
				.outerHeight(!0);
				
			var num_questions = 0,
				max_height = 0;
				
			$(quiz_div)
				.find(".waz_qc_answer_div:visible")
				.eq(0)
				.hasClass("waz-qc-twoup") ? 
					(max_height = maxHeightOfElementSet($(quiz_div).find(".waz_qc_answer_div:visible")), 
						num_questions = $(quiz_div).find(".waz_qc_answer_div:visible").length, 
						num_questions = Math.floor(num_questions / 2) + num_questions % 2, 
						total_question_heigh += max_height * num_questions) 
					: $(quiz_div)
				.find(".waz_qc_answer_div:visible")
				.eq(0)
				.hasClass("waz-qc-threeup") ? 
					(max_height = maxHeightOfElementSet($(quiz_div).find(".waz_qc_answer_div:visible")), 
					num_questions = $(quiz_div).find(".waz_qc_answer_div:visible")
					.length, num_questions /= 3, total_question_heigh += max_height * num_questions) 
					: $(quiz_div)
				.find(".waz_qc_answer_div:visible")
				.each(function() {
					total_question_heigh += $(this).outerHeight(!0)
				}), 200 > total_question_heigh && (total_question_heigh = 200), $(quiz_div)
				.find(".waz_qc_quiz_div, #waz_qc_answer_container, #waz_qc_back_container")
				.outerHeight(total_question_heigh)
		}

		function scale_flip_box_back(quiz_div) {
			var max_height = 0;
			$(quiz_div)
				.find("#waz_qc_back_container")
				.children()
				.each(function() {
					$(this)
						.is(":visible") && (max_height += $(this).outerHeight(!0))
				}), 
				max_height += 35, 
				400 > max_height && (max_height = 400), 
				$(quiz_div)
				.find(".waz_qc_quiz_div, #waz_qc_answer_container, #waz_qc_back_container")
				.height(max_height)
		}

		function maybe_add_quarter_class(quiz_div) {
			$(quiz_div)
				.find(".waz_qc_answer_div")
				.height("auto"), $(quiz_div)
				.find(".waz_qc_answer_div")
				.removeClass("waz-qc-twoup waz-qc-threeup"), $(quiz_div)
				.find(".waz_qc_quiz_answer_img")
				.css("marginBottom", 0);

			var i = !0,
				s = 0;
			if ($(quiz_div)
				.find(".waz_qc_answer_div:visible")
				.each(function() {
					return s++, "" !== $(this)
						.find(".waz_qc_quiz_answer_img")
						.attr("src") && i ? void 0 : (i = !1, !1)
				}), i) {
					
				var class_name = "waz-qc-twoup";
				s % 3 === 0 && 0 === $(quiz_div)
					.find(".waz_qc_mobile_check:visible")
					.length && (class_name = "waz-qc-threeup"), $(quiz_div)
					.find(".waz_qc_answer_div")
					.addClass(class_name);
					
				var n = maxHeightOfElementSet($(quiz_div)
					.find(".waz_qc_quiz_answer_img:visible"));
				n > 200 && (n = 200), $(quiz_div)
					.find(".waz_qc_quiz_answer_img:visible")
					.each(function() {
						$(this)
							.css("marginBottom", n - $(this)
								.height() + 10 + "px")
					});
					
				var c = maxHeightOfElementSet($(quiz_div)
					.find(".waz_qc_answer_div:visible"));
				return $(quiz_div)
					.find(".waz_qc_answer_div:visible")
					.outerHeight(c), !0
			}
			return !1
		}

		function set_result(quiz) {
			var result = "undefined";	
			if ("pt" == quiz.quiz_settings.quiz_type) {
				var s = -1,
					t = [];
				$.each(quiz.quiz_results, function(quiz, result) {
						result.hasOwnProperty("score") && result.score > s && (s = result.score)
					}), $.each(quiz.quiz_results, function(quiz, result) {
						result.hasOwnProperty("score") && result.score == s && t.push(result)
					}), 0 === t.length && (t = quiz.quiz_results), $(quiz.selector)
					.find(".waz_qc_score_text")
					.hide(), result = t[Math.floor(Math.random() * t.length)]
			} else {
				for (var n = 0;
					"undefined" == result;) quiz.quiz_results[n].min <= quiz.score && quiz.quiz_results[n].max >= quiz.score ? result = quiz.quiz_results[n] : n == quiz.quiz_results.length ? result = "error" : n++;
				var c = scoreString.replace("{{SCORE_CORRECT}}", quiz.score);
				c = c.replace("{{SCORE_TOTAL}}", quiz.questionCount), $(quiz.selector)
					.find(".waz_qc_score_text")
					.html(c)
			}
			return $(quiz.selector)
				// add waz_qc_score_href to product image
				.find(".waz_qc_score_title")
				.html(result.title), $(quiz.selector)
				.find(".waz_qc_score_img")
				.attr("src", result.img), $(quiz.selector)
				.find(".waz_qc_score_desc")
				.html(result.desc), result.hasOwnProperty("id") ? add_result(quiz.ajaxurl, quiz.nonce, quiz.quiz_id, result.id) : add_result(quiz.ajaxurl, quiz.nonce, quiz.quiz_id, quiz.score), 
				"pt" == quiz.quiz_settings.quiz_type ? result.title : result.title ? quiz.score + "/" + quiz.questionCount + ": " + result.title : quiz.score + "/" + quiz.questionCount
		}

		function show_responses(quiz) {
			for (var txt, question_index = 0; question_index < quiz.questions.length; question_index++) 
				txt = "", 
				txt += quiz.responses[question_index].isCorrect 
					? "<div class='waz_qc_question_response_item correct-answer'>" 
					: "<div class='waz_qc_question_response_item wrong-answer'>", 
				txt += "<h3 class='waz_qc_question_response_question'>" + (question_index + 1) + ". " + quiz.questions[question_index].question + "</h3>", 
				txt += "<img class='waz_qc_quiz_question_img' src='" + quiz.questions[question_index].img + "'>", 
				txt += "<p class='waz_qc_question_response_response'><span class='waz_qc_bold'>" + quiz.your_answer_string + " </span>" + quiz.responses[question_index].answer + "</p>", 
				txt += "<p class='waz_qc_question_response_correct_answer'><span class='waz_qc_bold'>" + quiz.correct_answer_string + "</span>" + quiz.responses[question_index].correctAnswer + "</p>", 
				txt += "</div>", 
			$(quiz.selector).find(".waz_qc_insert_response_above").before(i);
			$(quiz.selector).find(".waz_qc_your_answer_container").show()
		}

		function endTest(quiz) {
			add_activity(quiz.ajaxurl, quiz.nonce, quiz.quiz_id, "completions"), $(quiz.selector)
				.find(".waz_qc_quiz_footer")
				.hide(), $(quiz.selector)
				.find(".waz_qc_quiz_div")
				.hide(), "on" == quiz.optin_settings.capture_emails ? show_optins(quiz) : show_sharing_and_result_screen(quiz, set_result(quiz))
		}

		function show_optins(quiz) {
			var result = set_result(quiz);
			$(quiz.selector)
				.find(".waz_qc_optin_input")
				.tooltipster({
					trigger: "custom",
					maxWidth: 240,
					theme: ["tooltipster-borderless", "tooltipster-quiz-cat"]
				})
				.tooltipster("close"), $(quiz.selector)
				.find(".waz_qc_optin_container")
				.show(), $(quiz.selector)
				.find(".waz_qc_optin_input")
				.first()
				.focus(), $(quiz.selector)
				.find(".waz_qc_skip_email_button")
				.click(function() {
					$(quiz.selector)
						.find(".waz_qc_optin_container")
						.hide(), $(quiz.selector)
						.find(".waz_qc_optin_input")
						.tooltipster("close"), show_sharing_and_result_screen(quiz, result)
				}), $(quiz.selector)
				.find(".waz_qc_submit_email_button")
				.click(function() {
					var user_email = $(quiz.selector).find("#waz_qc_email_input").val(),
						user_name = $(quiz.selector).find("#waz_qc_name_input").val(),
						regexp = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/,
						email_check = regexp.test(user_email),
						r = "" !== user_name || 0 === $(quiz.selector)
						.find("#waz_qc_name_input")
						.length;
					$(quiz.selector)
						.find(".waz_qc_optin_input")
						.removeClass("waz_qc_invalid"), quiz.selector.offsetWidth = quiz.selector.offsetWidth, email_check && r ? ($(document)
							.unbind("keypress"), $(quiz.selector)
							.find(".waz_qc_optin_input")
							.tooltipster("close"), quiz.user = {
								name: user_name,
								user_email: user_email
							}, add_to_mailing_list(quiz.ajaxurl, quiz.quiz_id, quiz.nonce, user_email, user_name, result), $(quiz.selector)
							.find(".waz_qc_optin_container")
							.hide(), show_sharing_and_result_screen(quiz, result)) : (email_check ? ($(quiz.selector)
							.find("#waz_qc_email_input")
							.tooltipster("close"), $(quiz.selector)
							.find("#waz_qc_email_input")
							.removeClass("waz_qc_invalid")) : ($(quiz.selector)
							.find("#waz_qc_email_input")
							.tooltipster("open"), $(quiz.selector)
							.find("#waz_qc_email_input")
							.addClass("waz_qc_invalid")), r ? ($(quiz.selector)
							.find("#waz_qc_name_input")
							.tooltipster("close"), $(quiz.selector)
							.find("#waz_qc_name_input")
							.removeClass("waz_qc_invalid")) : ($(quiz.selector)
							.find("#waz_qc_name_input")
							.tooltipster("open"), $(quiz.selector)
							.find("#waz_qc_name_input")
							.addClass("waz_qc_invalid")))
				}), 0 === $(quiz.selector)
				.find(".waz_qc_skip_email_button")
				.length && 0 === $(quiz.selector)
				.find(".waz_qc_submit_email_button")
				.length ? show_sharing_and_result_screen(quiz, result) : $(document)
				.keypress(function(result) {
					return 13 == result.which ? ($(quiz.selector)
						.find(".waz_qc_submit_email_button")
						.click(), !1) : void 0
				})
		}

		function add_to_mailing_list(ajaxurl, quiz_id, nonce, email, name, result) {
			return -1 !== optins.indexOf(quiz_id) ? (console.log("already opted in for this quiz!"), !1) : (optins.push(quiz_id), void $.ajax({
					url: ajaxurl,
					type: "POST",
					data: {
						action: "waz_qc_add_to_mailing_list",
						nonce: nonce,
						quiz_id: quiz_id,
						email: email,
						name: name,
						result: result
					}
				})
				.done(function(ajaxurl) {
					console.log(ajaxurl)
				}))
		}
		
		// inform the server about an activity
		// ajaxurl is the url to the server app 
		// nonce is the number used once
		// quiz_id is the id used when defining the quiz
		// the type is typically either "starts", "shares" or "completions"
		function add_activity(ajaxurl, nonce, quiz_id, type) {
			if ("shares" == type) {
				if (-1 !== shared.indexOf(quiz_id)) return console.log("already shared this quiz!"), !1;
				shared.push(quiz_id)
			} else if ("completions" == type) {
				if (-1 !== completed.indexOf(quiz_id)) return console.log("already completed this quiz!"), !1;
				completed.push(quiz_id)
			}
			$.ajax({
					url: ajaxurl,
					type: "POST",
					data: {
						action: "waz_qc_activity",
						nonce: nonce,
						quiz_id: quiz_id,
						type: type
					}
				})
				.done(function(ajaxurl) {
					console.log(ajaxurl)
				})
		}

		function add_result(ajaxurl, nonce, quiz_id, result) {
			return -1 !== results.indexOf(quiz_id) ? (console.log("already stored results for this quiz!"), !1) : (results.push(quiz_id), void $.ajax({
					url: ajaxurl,
					type: "POST",
					data: {
						action: "waz_qc_add_result",
						nonce: nonce,
						quiz_id: quiz_id,
						result: result
					}
				})
				.done(function(ajaxurl) {
					console.log(ajaxurl)
				}))
		}

		function add_response(ajaxurl, nonce, quiz_id, question, response) {
			$.ajax({
					url: ajaxurl,
					type: "POST",
					data: {
						action: "waz_qc_add_response",
						nonce: nonce,
						quiz_id: quiz_id,
						question: question,
						response: response
					}
				})
				.done(function(ajaxurl) {
					console.log(ajaxurl)
				})
		}

		function send_responses(quiz, result) {
			var user_name = "",
				user_email = "";
			quiz.hasOwnProperty("user") && (user_name = quiz.user.name, user_email = quiz.user.email), $.ajax({
					url: quiz.ajaxurl,
					type: "POST",
					data: {
						action: "waz_qc_send_responses",
						nonce: quiz.nonce,
						quiz_id: quiz.quiz_id,
						name: user_name,
						email: user_email,
						result: result,
						responses: quiz.responses
					}
				})
				.done(function(quiz) {
					console.log(quiz)
				})
		}

		function restart_quiz() {
			location.reload()
		}

		function show_sharing_and_result_screen(quiz, result) {
			send_responses(quiz, result), $(quiz.selector)
				.find(".waz_qc_score_container")
				.show(), "on" == quiz.quiz_settings.restart_button && $("#waz_qc_restart_button")
				.click(function() {
					restart_quiz(quiz), $(this)
						.hide()
				})
				.show("fast"), "end" == quiz.hideAnswers && show_responses(quiz), "on" == quiz.quiz_settings.show_sharing && show_sharing(quiz, result)
		}

		function get_correct_answer_html(quiz) {
			var img = "",
				s = "";
			return $(quiz.selector)
				.find(".waz_qc_answer_div")
				.each(function() {
					$(this)
						.attr("data-question") == quiz.currentAnswer && (img = addQuizImg($(this)
								.find(".waz_qc_quiz_answer_img")
								.attr("src")), s = $(this)
							.find(".waz_qc_answer_span")
							.html()
							.replace(svg_square, ""))
				}), img + s
		}

		function show_sharing(quiz, result) {
			$(quiz.selector).find(".waz_qc_social_share").show("fast");
			
			var img = $(quiz.selector).find(".waz_qc_score_img").attr("src");
			"" === img && (img = $(quiz.selector).find(".waz_qc_quiz_description_img").attr("src")), "" === img && (img = default_img);
			
			var facebook = $(quiz.selector).find("#waz_qc_share_link_facebook");
			//&link=&name=The+Ultimate+Quiz&caption=Master?Try+this+Quiz&description=
			1 == facebook.length && (encode_share_link(quiz, facebook, result), facebook.prop("href", facebook.prop("href") + "&picture=" + img));
			
			var twitter = $(quiz.selector).find("#waz_qc_share_link_twitter");
			1 == twitter.length && encode_share_link(quiz, twitter, result);
			
			var email = $(quiz.selector).find("#waz_qc_share_link_email");
			1 == email.length && encode_share_link(quiz, email, result);
			
			var whatsapp = $(quiz.selector).find("#waz_qc_share_link_whatsapp");
			1 == whatsapp.length && encode_share_link(quiz, whatsapp, result);
			
			var pinterest = $(quiz.selector).find("#waz_qc_share_link_pinterest");
			1 == pinterest.length && (encode_share_link(quiz, pinterest, result), pinterest.prop("href", pinterest.prop("href") + "&media=" + img)), 
				
			$(quiz.selector).find(".waz_qc_share_link")
				.click(function(result) {
					result.preventDefault();
					var url = $(this).prop("href");
					window.open(url, "_blank", "resizable=yes,scrollbars=yes,titlebar=yes, width=560, height=443, top=100, left=50"), add_activity(quiz.ajaxurl, quiz.nonce, quiz.quiz_id, "shares")
				})
		}

		function encode_share_link(quiz, link, result) {
			var sharestring = encodeURIComponent(quiz.sharestring.replace("{{MY_QUIZ_RESULT}}", result)),
				href = link.prop("href");
			link.prop("href", href + sharestring)
		}
		
		function addQuizImg(img_url) {
			return img_url && "" !== img_url && "string" == typeof img_url ? "<img class='waz_qc_quiz_answer_img' src='" + img_url + "'>" : ""
		}

		function scrollQuizInToView(quiz_div) {
			var i = $(quiz_div)
				.offset()
				.top;
			0 > i && (i = 0), $("html, body")
				.animate({
					scrollTop: i
				}, 300)
		}
		
		/**
		 * Java Script Debounce Method
		 * @see https://davidwalsh.name/javascript-debounce-function
		 * @see https://john-dugan.com/javascript-debounce/
		 */
		// Returns a function, that, as long as it continues to be invoked, will not
		// be triggered. The function will be called after it stops being called for
		// N milliseconds. If `immediate` is passed, trigger the function on the
		// leading edge, instead of the trailing.
		function debounce(func, wait, immediate) {
			var timeout;
			return function() {
				var context = this, args = arguments;
				var later = function() {
					timeout = null;
					if (!immediate) func.apply(context, args);
				};
				var callNow = immediate && !timeout;
				clearTimeout(timeout);
				timeout = setTimeout(later, wait);
				if (callNow) func.apply(context, args);
			};
		};
		
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
		
		var usingIE = detectIE(),
			scoreString = $(".waz_qc_score_text")
			.first()
			.html(),
			svg_square = '<svg class="waz_qc_rectancle" width="26" height="26"><rect width="26" height="26" style="fill:#fff;stroke-width:1;stroke:#000;"></rect></svg>',
			quizzes = {},
			default_img = "";
			
		loadQuizzes(), preloadImages(), $(".waz_qc_start_button")
			.click(function() {
				var e = quizzes[get_quiz_id($(this).closest(".waz_qc_quiz"))];
				add_activity(e.ajaxurl, e.nonce, e.quiz_id, "starts"),
					usingIE && ieFix(e.selector), e.currentQuestion = 0, e.score = 0, e.responses = [], e.questionCount = e.questions.length, e.hideAnswers = "" === e.quiz_settings.hide_answers ? "after" : "on" === e.quiz_settings.hide_answers ? "end" : e.quiz_settings.hide_answers, $(this)
					.siblings(".waz_qc_quiz_title")
					.hide(), $(this)
					.siblings(".waz_qc_quiz_description")
					.hide(), $(this)
					.siblings(".waz_qc_quiz_description_img")
					.hide(), $(this)
					.hide(), $(this)
					.siblings(".waz_qc_quiz_div")
					.show(), $(this)
					.siblings(".waz_qc_quiz_footer")
					.show(), $(this)
					.siblings(".flip-container")
					.show(), $(this)
					.siblings(".waz_qc_question_count")
					.html("1/" + e.questionCount), showQuestion(e), scrollQuizInToView(e.selector)
			}), $(".waz_qc_next_question")
			.click(function() {
				var e = quizzes[get_quiz_id($(this).closest(".waz_qc_quiz"))];
				usingIE ? ($(e.selector)
						.find("#waz_qc_answer_container")
						.show(), $(e.selector)
						.find("#waz_qc_back_container")
						.hide()) : $(e.selector)
					.find(".waz_qc_quiz_div")
					.removeClass("flip"), showQuestion(e)
			}), $(".waz_qc_answer_div")
			.click(function() {
				var e = quizzes[get_quiz_id($(this).closest(".waz_qc_quiz"))];
				scrollQuizInToView(e.selector), 
				$(this).blur();
					
				var i = $(this).closest("#waz_qc_answer_container").data("id"),
					s = $(this).data("id"),
					t = !1;
					
				$(this).attr("data-question") === e.currentAnswer && (e.score = e.score + 1, t = !0);
				
				var n = {
					answer: addQuizImg($(this)
							.children(".waz_qc_quiz_answer_img")
							.attr("src")) + $(this)
						.children(".waz_qc_answer_span")
						.html()
						.replace(svg_square, ""),
					isCorrect: t,
					correctAnswer: get_correct_answer_html(e),
					question: $(this)
						.siblings("#waz_qc_question")
						.html()
				};
				
				if (e.responses.push(n), add_response(e.ajaxurl, e.nonce, e.quiz_id, n.question, n.answer), "pt" == e.quiz_settings.quiz_type) 
					$.each($(this).data("results"),
					function(i, s) {
						$.each(e.quiz_results, function(e, i) {
							s == i.id && (i.score = i.hasOwnProperty("score") ? i.score + 1 : 1)
						})
					}), showQuestion(e);
				else if ("after" == e.hideAnswers) {
					$(e.selector)
						.find("#waz_qc_your_answer")
						.html(addQuizImg($(this)
								.children(".waz_qc_quiz_answer_img")
								.attr("src")) + $(this)
							.children(".waz_qc_answer_span")
							.html()
							.replace(svg_square, ""));
					var c = get_correct_answer_html(e);
					$(e.selector)
						.find("#waz_qc_correct_answer")
						.html(c), usingIE ? ($(e.selector)
							.find("#waz_qc_answer_container")
							.hide(), $(e.selector)
							.find("#waz_qc_back_container")
							.show()) : $(e.selector)
						.find(".waz_qc_quiz_div")
						.addClass("flip"), $(e.selector)
						.find("#waz_qc_back_container")
						.removeClass("correct-answer"), $(e.selector)
						.find("#waz_qc_back_container")
						.removeClass("wrong-answer"), t ? ($(e.selector)
							.find("#waz_qc_back_container")
							.addClass("correct-answer"), $(e.selector)
							.find("#waz_qc_question_right_or_wrong")
							.html(e.correct_string), $(e.selector)
							.find("#waz_qc_correct_answer_p")
							.hide()) : ($(e.selector)
							.find("#waz_qc_back_container")
							.addClass("wrong-answer"), $(e.selector)
							.find("#waz_qc_question_right_or_wrong")
							.html(e.wrong_string), $(e.selector)
							.find("#waz_qc_correct_answer_p")
							.show()), scale_flip_box_back(e.selector)
				} else showQuestion(e)
			});
			
		var optins = [],
			shared = [],
			completed = [],
			results = [],
			resizeWindow = debounce(function() {
				jQuery.each(quizzes, function(e) {
					$(quizzes[e].selector)
						.find("#waz_qc_answer_container")
						.waitForImages(function() {
							maybe_add_quarter_class(quizzes[e].selector), scale_flip_box_question(quizzes[e].selector)
						})
				})
			}, 50);
		window.addEventListener("resize", resizeWindow)
	});