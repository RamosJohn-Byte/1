// Notification Module
const notificationModule = (() => {
  // DOM Elements
  const notification = document.getElementById("notification")
  const notificationMessage = document.getElementById("notification-message")
  const notificationClose = document.getElementById("notification-close")

  // Notification timeout
  let notificationTimeout

  // Initialize notification module
  const init = () => {
    // Set up event listener for close button
    notificationClose.addEventListener("click", hide)
  }

  // Show notification
  const show = (message, type = "info") => {
    // Clear any existing timeout
    if (notificationTimeout) {
      clearTimeout(notificationTimeout)
    }

    // Set message
    notificationMessage.textContent = message

    // Set type
    notification.className = "notification"
    notification.classList.add(type)

    // Show notification
    notification.style.display = "block"

    // Auto-hide after 5 seconds
    notificationTimeout = setTimeout(hide, 5000)
  }

  // Hide notification
  const hide = () => {
    notification.style.display = "none"
  }

  // Public API
  return {
    init,
    show,
    hide,
  }
})()

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
  // Initialize modules
  notificationModule.init()

  // Create Supabase client
  const supabaseUrl = document.querySelector('meta[name="supabase-url"]').content
  const supabaseKey = document.querySelector('meta[name="supabase-key"]').content
  // Import Supabase client
  const { createClient } = require("@supabase/supabase-js")
  window.supabase = createClient(supabaseUrl, supabaseKey)

  // Define global modules
  window.authModule = {
    init: () => {
      console.log("Auth module initialized")
      // Auth module initialization code
      const loginForm = document.getElementById("login-form")
      const registerForm = document.getElementById("register-form")
      const logoutLink = document.getElementById("logout-link")

      // Login form submission
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault()
        const email = document.getElementById("login-email").value
        const password = document.getElementById("login-password").value

        try {
          const { data, error } = await window.supabase.auth.signInWithPassword({
            email,
            password,
          })

          if (error) throw error

          notificationModule.show("Logged in successfully", "success")
          loginForm.reset()
          window.navigationModule.navigateTo("home-section")
        } catch (error) {
          notificationModule.show(error.message, "error")
        }
      })

      // Register form submission
      registerForm.addEventListener("submit", async (e) => {
        e.preventDefault()
        const email = document.getElementById("register-email").value
        const password = document.getElementById("register-password").value
        const confirmPassword = document.getElementById("register-confirm-password").value

        if (password !== confirmPassword) {
          notificationModule.show("Passwords do not match", "error")
          return
        }

        try {
          const { data, error } = await window.supabase.auth.signUp({
            email,
            password,
          })

          if (error) throw error

          notificationModule.show("Registration successful! Please check your email for verification.", "success")
          registerForm.reset()
          window.navigationModule.navigateTo("login-section")
        } catch (error) {
          notificationModule.show(error.message, "error")
        }
      })

      // Logout link
      logoutLink.addEventListener("click", async (e) => {
        e.preventDefault()
        try {
          const { error } = await window.supabase.auth.signOut()
          if (error) throw error
          notificationModule.show("Logged out successfully", "success")
          window.navigationModule.navigateTo("home-section")
        } catch (error) {
          notificationModule.show(error.message, "error")
        }
      })
    },
    getCurrentUser: async () => {
      const { data } = await window.supabase.auth.getUser()
      return data.user
    },
    isLoggedIn: async () => {
      const { data } = await window.supabase.auth.getUser()
      return !!data.user
    },
    isAdmin: async () => {
      const { data: userData } = await window.supabase.auth.getUser()
      if (!userData.user) return false

      const { data, error } = await window.supabase.from("users").select("is_admin").eq("id", userData.user.id).single()

      return data && data.is_admin
    },
  }

  window.navigationModule = {
    init: function () {
      console.log("Navigation module initialized")
      // Navigation module initialization code
      const navLinks = document.querySelectorAll("nav a")

      navLinks.forEach((link) => {
        link.addEventListener("click", async (e) => {
          if (link.id === "login-link") {
            e.preventDefault()
            this.navigateTo("login-section")
          } else if (link.id === "register-link") {
            e.preventDefault()
            this.navigateTo("register-section")
          } else if (link.id === "quizzes-link") {
            e.preventDefault()
            if (await window.authModule.isLoggedIn()) {
              this.navigateTo("quizzes-section")
              window.quizzesModule.loadQuizzes()
            } else {
              notificationModule.show("Please log in to access quizzes", "error")
              this.navigateTo("login-section")
            }
          } else if (link.id === "results-link") {
            e.preventDefault()
            if (await window.authModule.isLoggedIn()) {
              this.navigateTo("results-section")
              window.quizzesModule.loadResults()
            } else {
              notificationModule.show("Please log in to view results", "error")
              this.navigateTo("login-section")
            }
          } else if (link.id === "admin-link") {
            e.preventDefault()
            if (await window.authModule.isAdmin()) {
              this.navigateTo("admin-section")
              window.adminModule.loadAdminData()
            } else {
              notificationModule.show("You don't have admin privileges", "error")
            }
          } else if (link.id === "home-link") {
            e.preventDefault()
            this.navigateTo("home-section")
          }
        })
      })
    },
    navigateTo: (sectionId) => {
      const sections = document.querySelectorAll("main section")
      const navLinks = document.querySelectorAll("nav a")

      // Hide all sections
      sections.forEach((section) => {
        section.classList.remove("active-section")
      })

      // Show the selected section
      const targetSection = document.getElementById(sectionId)
      if (targetSection) {
        targetSection.classList.add("active-section")
      }

      // Update active nav link
      navLinks.forEach((link) => {
        link.classList.remove("active")
        if (link.id === sectionId.replace("-section", "-link")) {
          link.classList.add("active")
        }
      })
    },
  }

  window.quizzesModule = {
    init: function () {
      console.log("Quizzes module initialized")
      // Quizzes module initialization code
      const prevQuestionBtn = document.getElementById("prev-question")
      const nextQuestionBtn = document.getElementById("next-question")
      const submitQuizBtn = document.getElementById("submit-quiz")
      const backToResultsBtn = document.getElementById("back-to-results")

      prevQuestionBtn.addEventListener("click", () => {
        this.showPreviousQuestion()
      })

      nextQuestionBtn.addEventListener("click", () => {
        this.showNextQuestion()
      })

      submitQuizBtn.addEventListener("click", () => {
        this.submitQuiz()
      })

      backToResultsBtn.addEventListener("click", () => {
        window.navigationModule.navigateTo("results-section")
      })
    },
    loadQuizzes: async function () {
      try {
        const { data, error } = await window.supabase.from("quizzes").select("*")

        if (error) throw error

        const quizzesList = document.getElementById("quizzes-list")
        quizzesList.innerHTML = ""

        if (data.length === 0) {
          quizzesList.innerHTML = "<p>No quizzes available.</p>"
          return
        }

        data.forEach((quiz) => {
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

          quizCard.querySelector(".take-quiz-btn").addEventListener("click", () => {
            this.startQuiz(quiz.id)
          })
        })
      } catch (error) {
        notificationModule.show(error.message, "error")
      }
    },
    startQuiz: async (quizId) => {
      // Quiz taking functionality
      console.log("Starting quiz with ID:", quizId)
      // Implementation details would go here
    },
    showPreviousQuestion: () => {
      // Show previous question functionality
      console.log("Showing previous question")
      // Implementation details would go here
    },
    showNextQuestion: () => {
      // Show next question functionality
      console.log("Showing next question")
      // Implementation details would go here
    },
    submitQuiz: () => {
      // Submit quiz functionality
      console.log("Submitting quiz")
      // Implementation details would go here
    },
    loadResults: async () => {
      // Load results functionality
      console.log("Loading results")
      // Implementation details would go here
    },
  }

  window.adminModule = {
    init: function () {
      console.log("Admin module initialized")
      // Admin module initialization code
      const createQuizBtn = document.getElementById("create-quiz-btn")
      const cancelQuizBtn = document.getElementById("cancel-quiz-btn")
      const quizForm = document.getElementById("quiz-form")
      const addQuestionBtn = document.getElementById("add-question-btn")
      const tabButtons = document.querySelectorAll(".tab-btn")

      createQuizBtn.addEventListener("click", () => {
        document.getElementById("edit-quiz-header").textContent = "Create New Quiz"
        this.resetQuizForm()
        window.navigationModule.navigateTo("edit-quiz-section")
      })

      cancelQuizBtn.addEventListener("click", () => {
        window.navigationModule.navigateTo("admin-section")
      })

      quizForm.addEventListener("submit", (e) => {
        e.preventDefault()
        this.saveQuiz()
      })

      addQuestionBtn.addEventListener("click", () => {
        this.addQuestion()
      })

      tabButtons.forEach((button) => {
        button.addEventListener("click", () => {
          tabButtons.forEach((btn) => btn.classList.remove("active"))
          button.classList.add("active")

          const tabContents = document.querySelectorAll(".tab-content")
          tabContents.forEach((content) => content.classList.remove("active"))

          const contentId = button.id.replace("-tab", "-content")
          document.getElementById(contentId).classList.add("active")

          if (contentId === "manage-quizzes-content") {
            this.loadAdminQuizzes()
          } else if (contentId === "view-results-content") {
            this.loadAdminResults()
          }
        })
      })
    },
    loadAdminData: function () {
      this.loadAdminQuizzes()
    },
    loadAdminQuizzes: async () => {
      // Load admin quizzes functionality
      console.log("Loading admin quizzes")
      // Implementation details would go here
    },
    loadAdminResults: async () => {
      // Load admin results functionality
      console.log("Loading admin results")
      // Implementation details would go here
    },
    resetQuizForm: () => {
      // Reset quiz form functionality
      console.log("Resetting quiz form")
      // Implementation details would go here
    },
    addQuestion: () => {
      // Add question functionality
      console.log("Adding question")
      // Implementation details would go here
    },
    saveQuiz: () => {
      // Save quiz functionality
      console.log("Saving quiz")
      // Implementation details would go here
    },
  }

  // Initialize all modules
  window.authModule.init()
  window.navigationModule.init()
  window.quizzesModule.init()
  window.adminModule.init()

  // Check auth state on load
  window.supabase.auth.onAuthStateChange((event, session) => {
    const loginLink = document.getElementById("login-link")
    const registerLink = document.getElementById("register-link")
    const logoutLink = document.getElementById("logout-link")
    const adminLink = document.getElementById("admin-link")

    if (event === "SIGNED_IN" || session) {
      loginLink.classList.add("hidden")
      registerLink.classList.add("hidden")
      logoutLink.classList.remove("hidden")

      // Check if user is admin
      window.authModule.isAdmin().then((isAdmin) => {
        if (isAdmin) {
          adminLink.classList.remove("hidden")
        } else {
          adminLink.classList.add("hidden")
        }
      })

      notificationModule.show("Logged in successfully", "success")
    } else {
      loginLink.classList.remove("hidden")
      registerLink.classList.remove("hidden")
      logoutLink.classList.add("hidden")
      adminLink.classList.add("hidden")
    }
  })
})
