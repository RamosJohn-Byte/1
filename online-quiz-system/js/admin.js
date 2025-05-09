// Admin Module
const adminModule = (() => {
  // DOM Elements
  const adminQuizzesList = document.getElementById("admin-quizzes-list")
  const adminResultsList = document.getElementById("admin-results-list")
  const createQuizBtn = document.getElementById("create-quiz-btn")
  const quizForm = document.getElementById("quiz-form")
  const questionsContainer = document.getElementById("questions-container")
  const addQuestionBtn = document.getElementById("add-question-btn")
  const cancelQuizBtn = document.getElementById("cancel-quiz-btn")
  const editQuizHeader = document.getElementById("edit-quiz-header")

  // Templates
  const questionTemplate = document.getElementById("question-template")
  const optionTemplate = document.getElementById("option-template")

  // Admin state
  let currentEditQuizId = null

  // Mocked Modules (Replace with actual implementations or imports)
  const navigationModule = {
    navigateTo: (sectionId) => {
      console.log(`Navigating to: ${sectionId}`)
      // Implement actual navigation logic here
      const sections = document.querySelectorAll(".section")
      sections.forEach((section) => section.classList.remove("active"))
      const targetSection = document.getElementById(sectionId)
      if (targetSection) {
        targetSection.classList.add("active")
      }
    },
  }

  const supabase = {
    from: (tableName) => {
      return {
        select: (fields) => {
          return {
            order: (field, options) => {
              return {
                eq: (field, value) => {
                  return {
                    single: () => {
                      return new Promise((resolve) => {
                        resolve({ data: {}, error: null })
                      })
                    },
                    delete: () => {
                      return new Promise((resolve) => {
                        resolve({ data: {}, error: null })
                      })
                    },
                    update: (data) => {
                      return {
                        eq: (field, value) => {
                          return {
                            select: () => {
                              return {
                                single: () => {
                                  return new Promise((resolve) => {
                                    resolve({ data: {}, error: null })
                                  })
                                },
                              }
                            },
                          }
                        },
                      }
                    },
                    insert: (data) => {
                      return {
                        select: () => {
                          return {
                            single: () => {
                              return new Promise((resolve) => {
                                resolve({ data: {}, error: null })
                              })
                            },
                          }
                        },
                      }
                    },
                  }
                },
                eq: (field, value) => {
                  return new Promise((resolve) => {
                    resolve({ data: [], error: null })
                  })
                },
              }
            },
          }
        },
      }
    },
  }

  const notificationModule = {
    show: (message, type) => {
      console.log(`Notification: ${message} (${type})`)
      // Implement actual notification display logic here
      alert(`${type.toUpperCase()}: ${message}`)
    },
  }

  const quizzesModule = {
    viewResultDetails: (resultId) => {
      console.log(`Viewing result details for ID: ${resultId}`)
      // Implement actual result viewing logic here
      alert(`Viewing result details for ID: ${resultId}`)
    },
  }

  const authModule = {
    getCurrentUser: () => {
      return {
        id: "user123",
      }
    },
  }

  // Initialize admin module
  const init = () => {
    setupEventListeners()
    setupTabNavigation()
  }

  // Set up event listeners
  const setupEventListeners = () => {
    // Create quiz button
    createQuizBtn.addEventListener("click", () => {
      currentEditQuizId = null
      editQuizHeader.textContent = "Create New Quiz"
      resetQuizForm()
      navigationModule.navigateTo("edit-quiz-section")
    })

    // Add question button
    addQuestionBtn.addEventListener("click", addQuestion)

    // Cancel quiz button
    cancelQuizBtn.addEventListener("click", () => {
      navigationModule.navigateTo("admin-section")
    })

    // Quiz form submission
    quizForm.addEventListener("submit", saveQuiz)
  }

  // Set up tab navigation
  const setupTabNavigation = () => {
    const tabButtons = document.querySelectorAll(".tab-btn")
    const tabContents = document.querySelectorAll(".tab-content")

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        // Remove active class from all buttons and contents
        tabButtons.forEach((btn) => btn.classList.remove("active"))
        tabContents.forEach((content) => content.classList.remove("active"))

        // Add active class to clicked button and corresponding content
        button.classList.add("active")
        const contentId = button.id.replace("-tab", "-content")
        document.getElementById(contentId).classList.add("active")

        // Load data for the active tab
        if (contentId === "manage-quizzes-content") {
          loadAdminQuizzes()
        } else if (contentId === "view-results-content") {
          loadAdminResults()
        }
      })
    })
  }

  // Load admin data
  const loadAdminData = () => {
    // Load quizzes by default (first tab)
    loadAdminQuizzes()
  }

  // Load admin quizzes
  const loadAdminQuizzes = async () => {
    try {
      const { data, error } = await supabase.from("quizzes").select("*").order("created_at", { ascending: false })

      if (error) throw error

      renderAdminQuizzes(data)
    } catch (error) {
      notificationModule.show(error.message, "error")
    }
  }

  // Render admin quizzes
  const renderAdminQuizzes = (quizzes) => {
    adminQuizzesList.innerHTML = ""

    if (quizzes.length === 0) {
      adminQuizzesList.innerHTML = "<p>No quizzes available.</p>"
      return
    }

    quizzes.forEach((quiz) => {
      const quizItem = document.createElement("div")
      quizItem.className = "quiz-card"
      quizItem.innerHTML = `
                <div class="quiz-card-body">
                    <h3>${quiz.title}</h3>
                    <p>${quiz.description || "No description available."}</p>
                </div>
                <div class="quiz-card-footer">
                    <button class="btn edit-quiz-btn" data-quiz-id="${quiz.id}">Edit</button>
                    <button class="btn btn-danger delete-quiz-btn" data-quiz-id="${quiz.id}">Delete</button>
                </div>
            `

      adminQuizzesList.appendChild(quizItem)

      // Add event listeners
      quizItem.querySelector(".edit-quiz-btn").addEventListener("click", () => {
        editQuiz(quiz.id)
      })

      quizItem.querySelector(".delete-quiz-btn").addEventListener("click", () => {
        deleteQuiz(quiz.id)
      })
    })
  }

  // Load admin results
  const loadAdminResults = async () => {
    try {
      const { data, error } = await supabase
        .from("quiz_results")
        .select(`
                    *,
                    quizzes(*),
                    users(email)
                `)
        .order("completed_at", { ascending: false })

      if (error) throw error

      renderAdminResults(data)
    } catch (error) {
      notificationModule.show(error.message, "error")
    }
  }

  // Render admin results
  const renderAdminResults = (results) => {
    adminResultsList.innerHTML = ""

    if (results.length === 0) {
      adminResultsList.innerHTML = "<p>No quiz results available.</p>"
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
                <p>User: ${result.users.email}</p>
                <p>Completed on: ${date} at ${time}</p>
                <button class="btn view-result-btn" data-result-id="${result.id}">View Details</button>
            `

      adminResultsList.appendChild(resultItem)

      // Add event listener to view result button
      resultItem.querySelector(".view-result-btn").addEventListener("click", () => {
        quizzesModule.viewResultDetails(result.id)
      })
    })
  }

  // Edit quiz
  const editQuiz = async (quizId) => {
    try {
      // Get quiz details
      const { data: quizData, error: quizError } = await supabase.from("quizzes").select("*").eq("id", quizId).single()

      if (quizError) throw quizError

      // Get quiz questions and options
      const { data: questionsData, error: questionsError } = await supabase
        .from("questions")
        .select(`
                    *,
                    options(*)
                `)
        .eq("quiz_id", quizId)

      if (questionsError) throw questionsError

      // Set current edit quiz id
      currentEditQuizId = quizId

      // Set form header
      editQuizHeader.textContent = "Edit Quiz"

      // Reset form
      resetQuizForm()

      // Fill form with quiz data
      document.getElementById("quiz-title-input").value = quizData.title
      document.getElementById("quiz-description-input").value = quizData.description || ""

      // Add questions and options
      questionsData.forEach((question) => {
        const questionElement = addQuestion()

        // Set question text
        questionElement.querySelector(".question-text-input").value = question.question_text

        // Add options
        question.options.forEach((option) => {
          const optionElement = addOption(questionElement)

          // Set option text
          optionElement.querySelector(".option-text-input").value = option.option_text

          // Set correct option
          if (option.is_correct) {
            optionElement.querySelector(".correct-option").checked = true
          }
        })
      })

      // Navigate to edit quiz section
      navigationModule.navigateTo("edit-quiz-section")
    } catch (error) {
      notificationModule.show(error.message, "error")
    }
  }

  // Delete quiz
  const deleteQuiz = async (quizId) => {
    if (!confirm("Are you sure you want to delete this quiz? This action cannot be undone.")) {
      return
    }

    try {
      const { error } = await supabase.from("quizzes").delete().eq("id", quizId)

      if (error) throw error

      notificationModule.show("Quiz deleted successfully", "success")
      loadAdminQuizzes()
    } catch (error) {
      notificationModule.show(error.message, "error")
    }
  }

  // Reset quiz form
  const resetQuizForm = () => {
    quizForm.reset()
    questionsContainer.innerHTML = ""

    // Add at least one question
    addQuestion()
  }

  // Add question
  const addQuestion = () => {
    const questionElement = document.importNode(questionTemplate.content, true).firstElementChild
    questionsContainer.appendChild(questionElement)

    // Add event listeners
    questionElement.querySelector(".add-option-btn").addEventListener("click", () => {
      addOption(questionElement)
    })

    questionElement.querySelector(".remove-question-btn").addEventListener("click", () => {
      questionElement.remove()
    })

    // Add at least two options
    addOption(questionElement)
    addOption(questionElement)

    return questionElement
  }

  // Add option
  const addOption = (questionElement) => {
    const optionElement = document.importNode(optionTemplate.content, true).firstElementChild
    const optionsContainer = questionElement.querySelector(".options-container")
    optionsContainer.appendChild(optionElement)

    // Set unique name for radio buttons
    const questionIndex = Array.from(questionsContainer.children).indexOf(questionElement)
    optionElement.querySelector(".correct-option").name = `correct-option-${questionIndex}`

    // Add event listener
    optionElement.querySelector(".remove-option-btn").addEventListener("click", () => {
      // Prevent removing if there are only two options
      if (optionsContainer.children.length <= 2) {
        notificationModule.show("Each question must have at least two options", "error")
        return
      }

      optionElement.remove()
    })

    return optionElement
  }

  // Save quiz
  const saveQuiz = async (e) => {
    e.preventDefault()

    try {
      // Get form data
      const title = document.getElementById("quiz-title-input").value
      const description = document.getElementById("quiz-description-input").value

      // Validate questions
      const questionElements = questionsContainer.querySelectorAll(".question-item")
      if (questionElements.length === 0) {
        notificationModule.show("Quiz must have at least one question", "error")
        return
      }

      // Save quiz
      let quizId

      if (currentEditQuizId) {
        // Update existing quiz
        const { data, error } = await supabase
          .from("quizzes")
          .update({
            title,
            description,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentEditQuizId)
          .select()
          .single()

        if (error) throw error

        quizId = data.id

        // Delete existing questions and options
        const { error: deleteError } = await supabase.from("questions").delete().eq("quiz_id", quizId)

        if (deleteError) throw deleteError
      } else {
        // Create new quiz
        const { data, error } = await supabase
          .from("quizzes")
          .insert([
            {
              title,
              description,
              created_by: authModule.getCurrentUser().id,
            },
          ])
          .select()
          .single()

        if (error) throw error

        quizId = data.id
      }

      // Save questions and options
      for (const questionElement of questionElements) {
        const questionText = questionElement.querySelector(".question-text-input").value

        // Save question
        const { data: questionData, error: questionError } = await supabase
          .from("questions")
          .insert([
            {
              quiz_id: quizId,
              question_text: questionText,
            },
          ])
          .select()
          .single()

        if (questionError) throw questionError

        const questionId = questionData.id

        // Save options
        const optionElements = questionElement.querySelectorAll(".option-item")
        const options = []

        for (const optionElement of optionElements) {
          const optionText = optionElement.querySelector(".option-text-input").value
          const isCorrect = optionElement.querySelector(".correct-option").checked

          options.push({
            question_id: questionId,
            option_text: optionText,
            is_correct: isCorrect,
          })
        }

        const { error: optionsError } = await supabase.from("options").insert(options)

        if (optionsError) throw optionsError
      }

      notificationModule.show(`Quiz ${currentEditQuizId ? "updated" : "created"} successfully`, "success")
      navigationModule.navigateTo("admin-section")
    } catch (error) {
      notificationModule.show(error.message, "error")
    }
  }

  // Public API
  return {
    init,
    loadAdminData,
  }
})()
