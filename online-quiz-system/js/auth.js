// Import necessary modules (assuming they are in separate files)
import { createClient } from "@supabase/supabase-js"
import * as navigationModule from "./navigation.js"
import * as notificationModule from "./notification.js"

// Initialize Supabase client
const supabaseUrl = "YOUR_SUPABASE_URL" // Replace with your Supabase URL
const supabaseKey = "YOUR_SUPABASE_ANON_KEY" // Replace with your Supabase Anon Key
const supabase = createClient(supabaseUrl, supabaseKey)

// Assume these modules are defined elsewhere and imported here
// For example: import * as navigationModule from './navigation.js';
//               import * as notificationModule from './notification.js';

// Auth Module
const authModule = (() => {
  // DOM Elements
  const loginForm = document.getElementById("login-form")
  const registerForm = document.getElementById("register-form")
  const logoutLink = document.getElementById("logout-link")
  const loginLink = document.getElementById("login-link")
  const registerLink = document.getElementById("register-link")
  const adminLink = document.getElementById("admin-link")

  // Current user state
  let currentUser = null

  // Initialize auth state
  const init = async () => {
    // Check if user is already logged in
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (session) {
      await setUserData(session.user)
      updateAuthUI(true)
    } else {
      updateAuthUI(false)
    }

    // Set up auth state change listener
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        await setUserData(session.user)
        updateAuthUI(true)
        navigationModule.navigateTo("home-section")
        notificationModule.show("Logged in successfully", "success")
      } else if (event === "SIGNED_OUT") {
        currentUser = null
        updateAuthUI(false)
        navigationModule.navigateTo("home-section")
        notificationModule.show("Logged out successfully", "success")
      }
    })

    // Set up event listeners
    setupEventListeners()
  }

  // Set user data including admin status
  const setUserData = async (user) => {
    currentUser = user

    // Check if user is admin
    const { data, error } = await supabase.from("users").select("is_admin").eq("id", user.id).single()

    if (data && data.is_admin) {
      currentUser.isAdmin = true
    } else {
      currentUser.isAdmin = false
    }
  }

  // Update UI based on auth state
  const updateAuthUI = (isLoggedIn) => {
    if (isLoggedIn) {
      loginLink.classList.add("hidden")
      registerLink.classList.add("hidden")
      logoutLink.classList.remove("hidden")

      // Show admin link if user is admin
      if (currentUser && currentUser.isAdmin) {
        adminLink.classList.remove("hidden")
      } else {
        adminLink.classList.add("hidden")
      }
    } else {
      loginLink.classList.remove("hidden")
      registerLink.classList.remove("hidden")
      logoutLink.classList.add("hidden")
      adminLink.classList.add("hidden")
    }
  }

  // Set up event listeners
  const setupEventListeners = () => {
    // Login form submission
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      const email = document.getElementById("login-email").value
      const password = document.getElementById("login-password").value

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        // Reset form
        loginForm.reset()
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

      // Validate passwords match
      if (password !== confirmPassword) {
        notificationModule.show("Passwords do not match", "error")
        return
      }

      try {
        // Register user with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        })

        if (authError) throw authError

        // Add user to our users table
        const { data, error } = await supabase.from("users").insert([
          {
            id: authData.user.id,
            email,
            is_admin: false,
          },
        ])

        if (error) throw error

        // Reset form
        registerForm.reset()
        notificationModule.show("Registration successful! You are now logged in.", "success")
      } catch (error) {
        notificationModule.show(error.message, "error")
      }
    })

    // Logout link
    logoutLink.addEventListener("click", async (e) => {
      e.preventDefault()

      try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      } catch (error) {
        notificationModule.show(error.message, "error")
      }
    })

    // Login link
    loginLink.addEventListener("click", (e) => {
      e.preventDefault()
      navigationModule.navigateTo("login-section")
    })

    // Register link
    registerLink.addEventListener("click", (e) => {
      e.preventDefault()
      navigationModule.navigateTo("register-section")
    })

    // Admin link
    adminLink.addEventListener("click", (e) => {
      e.preventDefault()
      navigationModule.navigateTo("admin-section")
    })
  }

  // Get current user
  const getCurrentUser = () => {
    return currentUser
  }

  // Check if user is logged in
  const isLoggedIn = () => {
    return !!currentUser
  }

  // Check if user is admin
  const isAdmin = () => {
    return currentUser && currentUser.isAdmin
  }

  // Public API
  return {
    init,
    getCurrentUser,
    isLoggedIn,
    isAdmin,
  }
})()
