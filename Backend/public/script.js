class AuthManager {
  constructor() {
    this.isSignUp = true
    this.isLoading = false
    this.isTransitioning = false
    this.formData = {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    }

    this.initializeElements()
    this.bindEvents()

    this.updateFormMode();
  }

  initializeElements() {
    this.authForm = document.getElementById("authForm")
    this.formTitle = document.getElementById("formTitle")
    this.nameFields = document.getElementById("nameFields")
    this.confirmPasswordField = document.getElementById("confirmPasswordField")
    this.forgotPassword = document.getElementById("forgotPassword")
    this.submitBtn = document.getElementById("submitBtn")
    this.submitText = document.getElementById("submitText")
    this.loadingSpinner = document.getElementById("loadingSpinner")
    this.loadingText = document.getElementById("loadingText")
    this.toggleText = document.getElementById("toggleText")
    this.toggleBtn = document.getElementById("toggleBtn")
    this.mainForm = document.getElementById("mainForm")
  }

  bindEvents() {
    this.mainForm.addEventListener("submit", (e) => this.handleSubmit(e))
    this.toggleBtn.addEventListener("click", () => this.toggleMode())

    // Bind input change events
    const inputs = this.mainForm.querySelectorAll("input")
    inputs.forEach((input) => {
      input.addEventListener("input", (e) => this.handleInputChange(e))
    })
  }

  handleInputChange(e) {
    this.formData[e.target.name] = e.target.value
  }

async handleSubmit(e) {
    e.preventDefault()
    this.isLoading = true
    this.updateLoadingState()

    try {
      let response

      if (this.isSignUp) {
        if (this.formData.password !== this.formData.confirmPassword) {
          alert("Passwords do not match!")
          this.isLoading = false
          this.updateLoadingState()
          return
        }

        const fullName = `${this.formData.firstName} ${this.formData.lastName}`.trim()

        // Signup request
        response = await axios.post("http://localhost:5000/auth/signup", {
          name: fullName,
          email: this.formData.email,
          password: this.formData.password,
        }, { withCredentials: true })

        alert(response.data.message || "Signup successful! Please login now.")
        this.toggleMode()

      } else {
        // Login request
        response = await axios.post("http://localhost:5000/auth/login", {
          email: this.formData.email,
          password: this.formData.password,
        }, { withCredentials: true })

        alert(response.data.message || "OTP sent to your email")

        // Store email in sessionStorage for OTP page
        sessionStorage.setItem("otpEmail", this.formData.email)

        window.location.href = "otp.html"
      }

    } catch (error) {
      console.error(error)
      alert(error.response?.data?.message || "Something went wrong")
    }

    this.isLoading = false
    this.updateLoadingState()
}



  updateLoadingState() {
    if (this.isLoading) {
      this.submitText.classList.add("hidden")
      this.loadingSpinner.classList.remove("hidden")
      this.submitBtn.disabled = true
      this.loadingText.textContent = this.isSignUp ? "Creating Account..." : "Accessing Portal..."
    } else {
      this.submitText.classList.remove("hidden")
      this.loadingSpinner.classList.add("hidden")
      this.submitBtn.disabled = false
    }
  }

  toggleMode() {
    if (this.isTransitioning) return

    this.isTransitioning = true

    // Add slide out animation
    this.authForm.classList.remove("enhanced-bounce-slide-in")
    this.authForm.classList.add(this.isSignUp ? "smooth-diagonal-slide-out-right" : "smooth-diagonal-slide-out-left")

    setTimeout(() => {
      this.isSignUp = !this.isSignUp
      this.updateFormMode()
      this.clearFormData()

      // Remove slide out and add slide in
      this.authForm.classList.remove("smooth-diagonal-slide-out-left", "smooth-diagonal-slide-out-right")

      setTimeout(() => {
        this.authForm.classList.add("enhanced-bounce-slide-in")
        this.isTransitioning = false
      }, 50)
    }, 400)
  }

  updateFormMode() {
    if (this.isSignUp) {
      this.formTitle.textContent = "Join Your Institution"
      this.nameFields.classList.remove("hidden")
      this.confirmPasswordField.classList.remove("hidden")
      this.forgotPassword.classList.add("hidden")
      this.submitText.textContent = "Join ClassSync"
      this.toggleText.textContent = "Already have an account?"
      this.toggleBtn.textContent = "Sign In"

      // Make name fields required
      document.getElementById("firstName").required = true
      document.getElementById("lastName").required = true
      document.getElementById("confirmPassword").required = true
    } else {
      this.formTitle.textContent = "Access Your Portal"
      this.nameFields.classList.add("hidden")
      this.confirmPasswordField.classList.add("hidden")
      this.forgotPassword.classList.remove("hidden")
      this.submitText.textContent = "Access Portal"
      this.toggleText.textContent = "Don't have an account?"
      this.toggleBtn.textContent = "Sign Up"

      // Remove required from name fields
      document.getElementById("firstName").required = false
      document.getElementById("lastName").required = false
      document.getElementById("confirmPassword").required = false
    }
  }

  clearFormData() {
    this.formData = {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    }

    // Clear form inputs
    const inputs = this.mainForm.querySelectorAll("input")
    inputs.forEach((input) => {
      input.value = ""
    })
  }
}

// Initialize the auth manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new AuthManager()
})
