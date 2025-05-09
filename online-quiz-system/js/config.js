// Supabase configuration
const supabaseUrl = "https://lfphlaompbazveppzgwg.supabase.co"
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmcGhsYW9tcGJhenZlcHB6Z3dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3OTQ4OTEsImV4cCI6MjA2MjM3MDg5MX0.lvR2rDzWLw4mJfbzNTz43DEpUWsixEa_DMnyFDV-mRw"

// Initialize Supabase client
const supabase = supabase.createClient(supabaseUrl, supabaseKey)

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

// Make modules available globally
window.notificationModule = notificationModule
window.supabase = supabase
