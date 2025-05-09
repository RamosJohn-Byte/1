// Navigation Module
const navigationModule = (() => {
  // Import necessary modules (or declare if not using modules)
  const authModule = window.authModule // Assuming authModule is a global variable or accessible through window
  const notificationModule = window.notificationModule // Assuming notificationModule is a global variable or accessible through window
  const quizzesModule = window.quizzesModule // Assuming quizzesModule is a global variable or accessible through window
  const adminModule = window.adminModule // Assuming adminModule is a global variable or accessible through window

  // DOM Elements
  const navLinks = document.querySelectorAll("nav a")
  const sections = document.querySelectorAll("main section")

  // Initialize navigation
  const init = () => {
    setupEventListeners()
  }

  // Set up event listeners
  const setupEventListeners = () => {
    // Navigation links
    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        if (
          link.id === "login-link" ||
          link.id === "register-link" ||
          link.id === "logout-link" ||
          link.id === "admin-link"
        ) {
          // These are handled in auth.js
          return
        }

        e.preventDefault()

        // Get the section id from the link id
        const sectionId = link.id.replace("-link", "-section")
        navigateTo(sectionId)
      })
    })
  }

  // Navigate to a section
  const navigateTo = (sectionId) => {
    // Check if user is logged in for protected sections
    if ((sectionId === "quizzes-section" || sectionId === "results-section") && !authModule.isLoggedIn()) {
      notificationModule.show("Please log in to access this page", "error")
      navigateTo("login-section")
      return
    }

    // Check if user is admin for admin sections
    if ((sectionId === "admin-section" || sectionId === "edit-quiz-section") && !authModule.isAdmin()) {
      notificationModule.show("You do not have permission to access this page", "error")
      navigateTo("home-section")
      return
    }

    // Hide all sections
    sections.forEach((section) => {
      section.classList.remove("active-section")
    })

    // Show the selected section
    const section = document.getElementById(sectionId)
    if (section) {
      section.classList.add("active-section")

      // Update active nav link
      navLinks.forEach((link) => {
        link.classList.remove("active")
        if (link.id === sectionId.replace("-section", "-link")) {
          link.classList.add("active")
        }
      })

      // Load section data if needed
      if (sectionId === "quizzes-section") {
        quizzesModule.loadQuizzes()
      } else if (sectionId === "results-section") {
        quizzesModule.loadResults()
      } else if (sectionId === "admin-section") {
        adminModule.loadAdminData()
      }
    }
  }

  // Public API
  return {
    init,
    navigateTo,
  }
})()
