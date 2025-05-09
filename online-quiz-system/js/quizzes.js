// Quizzes Module
const quizzesModule = (() => {
  // Import necessary modules (replace with actual imports or declarations)
  const navigationModule = window.navigationModule // Assuming it's a global variable or replace with actual import
  const supabase = window.supabase // Assuming it's a global variable or replace with actual import
  const notificationModule = window.notificationModule // Assuming it's a global variable or replace with actual import
  const authModule = window.authModule // Assuming it's a global variable or replace with actual import

  // DOM Elements
  const quizzesList = document.getElementById("quizzes-list")
  const resultsList = document.getElementById("results-list")
  const takeQuizSection = document.getElementById("take-quiz-section")
  const quizTitle = document.getElementById("quiz-title")
  const quizDescription = document.getElementById("quiz-description")
  const currentQuestionEl = document.getElementById("current-question")
  const totalQuestionsEl = document.getElementById("total-questions")
  const questionText = document.getElementById("question-text")
  const optionsContainer = document.getElementById("options-container")
  const prevQuestionBtn = document.getElementById("prev-question")
  const nextQuestionBtn = document.getElementById("next-question")
  const submitQuizBtn = document.getElementById("submit-quiz")

  // Quiz state
  let currentQuiz = null
  let currentQuizQuestions = []
  let currentQuestionIndex = 0
  let userAnswers = {}

  // Initialize quizzes module
  const init = () => {
    setupEventListeners()
  }

  // Set up event listeners
  const setupEventListeners = () => {
    // Navigation buttons in quiz
    prevQuestionBtn.addEventListener("click", showPreviousQuestion)
    nextQuestionBtn.addEventListener("click", showNextQuestion)
    submitQuizBtn.addEventListener("click", submitQuiz)

    // Back to results button
    document.getElementById("back-to-results").addEventListener("click", () => {
      navigationModule.navigateTo("results-section")
    })
  }

  // Load available quizzes
  const loadQuizzes = async () => {
    try {
      const { data, error } = await supabase.from("quizzes").select("*")

      if (error) throw error

      renderQuizzes(data)
    } catch (error) {
      notificationModule.show(error.message, "error")
    }
  }

  // Render quizzes list
  const renderQuizzes = (quizzes) => {
    quizzesList.innerHTML = ""

    if (quizzes.length === 0) {
      quizzesList.innerHTML = "<p>No quizzes available.</p>"
      return
    }

    quizzes.forEach((quiz) => {
      const quizCard = document.createElement("div")
      quizCard.className = "quiz-card"
      quizCard.innerHTML = `
                <div class="quiz-card-body">
                    <h3>${quiz.title}</h3>
                    <p>${quiz.description || "No description available."}</p>
                </div>
                <div class="quiz-card-footer">
                    <button class="btn btn-primary take-quiz-btn" data-quiz-id="${quiz.id}">Take Quiz</button>
                </div>
            `

      quizzesList.appendChild(quizCard)

      // Add event listener to take quiz button
      quizCard.querySelector(".take-quiz-btn").addEventListener("click", () => {
        startQuiz(quiz.id)
      })
    })
  }

  // Start a quiz
  const startQuiz = async (quizId) => {
    try {
      // Get quiz details
      const { data: quizData, error: quizError } = await supabase.from("quizzes").select("*").eq("id", quizId).single()

      if (quizError) throw quizError

      // Get quiz questions
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select(`
                    *,
                    options(*)
                `)
        .eq("quiz_id", quizId)

      if (questionsError) throw questionsError

      // Set quiz state
      currentQuiz = quizData
      currentQuizQuestions = questionsData
      currentQuestionIndex = 0
      userAnswers = {}

      // Navigate to take quiz section
      navigationModule.navigateTo("take-quiz-section")

      // Set quiz details
      quizTitle.textContent = currentQuiz.title
      quizDescription.textContent = currentQuiz.description || ""
      totalQuestionsEl.textContent = currentQuizQuestions.length

      // Show first question
      showQuestion(0)
    } catch (error) {
      notificationModule.show(error.message, "error")
    }
  }

  // Show a question
  const showQuestion = (index) => {
    const question = currentQuizQuestions[index]

    // Update question number
    currentQuestionIndex = index
    currentQuestionEl.textContent = index + 1

    // Set question text
    questionText.textContent = question.question_text

    // Clear options container
    optionsContainer.innerHTML = ""

    // Add options
    question.options.forEach((option) => {
      const optionBtn = document.createElement("button")
      optionBtn.className = "option-btn"
      optionBtn.dataset.optionId = option.id
      optionBtn.textContent = option.option_text

      // Check if this option is selected
      if (userAnswers[question.id] === option.id) {
        optionBtn.classList.add("selected")
      }

      // Add event listener
      optionBtn.addEventListener("click", () => {
        // Remove selected class from all options
        optionsContainer.querySelectorAll(".option-btn").forEach((btn) => {
          btn.classList.remove("selected")
        })

        // Add selected class to clicked option
        optionBtn.classList.add("selected")

        // Save user answer
        userAnswers[question.id] = option.id
      })

      optionsContainer.appendChild(optionBtn)
    })

    // Update navigation buttons
    updateNavigationButtons()
  }

  // Show previous question
  const showPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      showQuestion(currentQuestionIndex - 1)
    }
  }

  // Show next question
  const showNextQuestion = () => {
    if (currentQuestionIndex < currentQuizQuestions.length - 1) {
      showQuestion(currentQuestionIndex + 1)
    }
  }

  // Update navigation buttons
  const updateNavigationButtons = () => {
    // Disable/enable previous button
    prevQuestionBtn.disabled = currentQuestionIndex === 0

    // Show/hide next and submit buttons
    if (currentQuestionIndex === currentQuizQuestions.length - 1) {
      nextQuestionBtn.classList.add("hidden")
      submitQuizBtn.classList.remove("hidden")
    } else {
      nextQuestionBtn.classList.remove("hidden")
      submitQuizBtn.classList.add("hidden")
    }
  }

  // Submit quiz
  const submitQuiz = async () => {
    try {
      // Check if all questions are answered
      const answeredQuestions = Object.keys(userAnswers).length
      if (answeredQuestions < currentQuizQuestions.length) {
        const unanswered = currentQuizQuestions.length - answeredQuestions
        notificationModule.show(
          `You have ${unanswered} unanswered question(s). Please answer all questions before submitting.`,
          "error",
        )
        return
      }

      // Calculate score
      let score = 0
      const correctAnswers = {}

      // Get correct answers for each question
      for (const question of currentQuizQuestions) {
        const correctOption = question.options.find((option) => option.is_correct)
        if (correctOption) {
          correctAnswers[question.id] = correctOption.id
          if (userAnswers[question.id] === correctOption.id) {
            score++
          }
        }
      }

      // Save quiz result
      const { data: resultData, error: resultError } = await supabase
        .from("quiz_results")
        .insert([
          {
            quiz_id: currentQuiz.id,
            user_id: authModule.getCurrentUser().id,
            score: score,
          },
        ])
        .select()
        .single()

      if (resultError) throw resultError

      // Save user answers
      const userAnswersArray = Object.entries(userAnswers).map(([questionId, optionId]) => ({
        result_id: resultData.id,
        question_id: questionId,
        selected_option_id: optionId,
      }))

      const { error: answersError } = await supabase.from("user_answers").insert(userAnswersArray)

      if (answersError) throw answersError

      // Show success message
      notificationModule.show(
        `Quiz submitted successfully! Your score: ${score}/${currentQuizQuestions.length}`,
        "success",
      )

      // Navigate to results page
      navigationModule.navigateTo("results-section")
    } catch (error) {
      notificationModule.show(error.message, "error")
    }
  }

  // Load user's quiz results
  const loadResults = async () => {
    try {
      const { data, error } = await supabase
        .from("quiz_results")
        .select(`
                    *,
                    quizzes(*)
                `)
        .eq("user_id", authModule.getCurrentUser().id)
        .order("completed_at", { ascending: false })

      if (error) throw error

      renderResults(data)
    } catch (error) {
      notificationModule.show(error.message, "error")
    }
  }

  // Render results list
  const renderResults = (results) => {
    resultsList.innerHTML = ""

    if (results.length === 0) {
      resultsList.innerHTML = "<p>You have not taken any quizzes yet.</p>"
      return
    }

    results.forEach((result) => {
      const resultItem = document.createElement("div")
      resultItem.className = "result-item"

      const date = new Date(result.completed_at).toLocaleDateString()
      const time = new Date(result.completed_at).toLocaleTimeString()

      resultItem.innerHTML = `
                <div class="result-header">
                    <h3>${result.quizzes.title}</h3>
                    <span class="result-score">${result.score} / ${result.quizzes.question_count || "?"}</span>
                </div>
                <p>Completed on: ${date} at ${time}</p>
                <button class="btn view-result-btn" data-result-id="${result.id}">View Details</button>
            `

      resultsList.appendChild(resultItem)

      // Add event listener to view result button
      resultItem.querySelector(".view-result-btn").addEventListener("click", () => {
        viewResultDetails(result.id)
      })
    })
  }

  // View result details
  const viewResultDetails = async (resultId) => {
    try {
      // Get result details
      const { data: resultData, error: resultError } = await supabase
        .from("quiz_results")
        .select(`
                    *,
                    quizzes(*)
                `)
        .eq("id", resultId)
        .single()

      if (resultError) throw resultError

      // Get questions and user answers
      const { data: answersData, error: answersError } = await supabase
        .from("user_answers")
        .select(`
                    *,
                    questions(*),
                    options(*)
                `)
        .eq("result_id", resultId)

      if (answersError) throw answersError

      // Get all options for each question
      const questionIds = answersData.map((answer) => answer.question_id)
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select(`
                    *,
                    options(*)
                `)
        .in("id", questionIds)

      if (questionsError) throw questionsError

      // Navigate to result detail section
      navigationModule.navigateTo("result-detail-section")

      // Set result details
      document.getElementById("result-quiz-title").textContent = resultData.quizzes.title
      document.getElementById("result-score").textContent = resultData.score
      document.getElementById("result-total").textContent = questionsData.length
      document.getElementById("result-date").textContent = new Date(resultData.completed_at).toLocaleString()

      // Render questions and answers
      renderResultQuestions(questionsData, answersData)
    } catch (error) {
      notificationModule.show(error.message, "error")
    }
  }

  // Render result questions
  const renderResultQuestions = (questions, userAnswers) => {
    const resultQuestionsContainer = document.getElementById("result-questions")
    resultQuestionsContainer.innerHTML = ""

    questions.forEach((question, index) => {
      const userAnswer = userAnswers.find((answer) => answer.question_id === question.id)
      const userSelectedOption = userAnswer ? userAnswer.options : null

      const questionItem = document.createElement("div")
      questionItem.className = "question-item"

      questionItem.innerHTML = `
                <h3>Question ${index + 1}: ${question.question_text}</h3>
                <div class="options-container">
                    ${renderResultOptions(question.options, userSelectedOption)}
                </div>
            `

      resultQuestionsContainer.appendChild(questionItem)
    })
  }

  // Render result options
  const renderResultOptions = (options, userSelectedOption) => {
    let optionsHtml = ""

    options.forEach((option) => {
      let optionClass = ""

      if (option.is_correct) {
        optionClass = "correct"
      } else if (userSelectedOption && userSelectedOption.id === option.id) {
        optionClass = "incorrect"
      }

      optionsHtml += `
                <div class="option-item ${optionClass}">
                    <span>${option.option_text}</span>
                    ${option.is_correct ? '<span class="correct-indicator">✓</span>' : ""}
                    ${userSelectedOption && userSelectedOption.id === option.id && !option.is_correct ? '<span class="incorrect-indicator">✗</span>' : ""}
                </div>
            `
    })

    return optionsHtml
  }

  // Public API
  return {
    init,
    loadQuizzes,
    loadResults,
  }
})()
