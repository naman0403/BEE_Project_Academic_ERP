class OTPManager {
  constructor() {
    this.otp = ["", "", "", ""];
    this.isLoading = false;
    this.isResending = false;
    this.timeLeft = 60;
    this.timer = null;

    // Get email from sessionStorage
    this.email = sessionStorage.getItem("otpEmail");
    if (!this.email) {
      alert("Email not found. Please login again.");
      window.location.href = "/login.html";
      return;
    }

    this.initializeElements();
    this.bindEvents();
    this.startTimer();
    this.focusFirstInput();
  }

  initializeElements() {
    this.otpInputs = document.querySelectorAll(".otp-input");
    this.otpForm = document.getElementById("otpForm");
    this.verifyBtn = document.getElementById("verifyBtn");
    this.verifyText = document.getElementById("verifyText");
    this.verifySpinner = document.getElementById("verifySpinner");
    this.timerText = document.getElementById("timerText");
    this.countdown = document.getElementById("countdown");
    this.resendBtn = document.getElementById("resendBtn");
  }

  bindEvents() {
    this.otpForm.addEventListener("submit", (e) => this.handleSubmit(e));
    this.resendBtn.addEventListener("click", () => this.handleResendOtp());

    this.otpInputs.forEach((input, index) => {
      input.addEventListener("input", (e) => this.handleOtpChange(index, e.target.value));
      input.addEventListener("keydown", (e) => this.handleKeyDown(index, e));
    });
  }

  handleOtpChange(index, value) {
    if (value.length > 1) return;

    this.otp[index] = value;
    this.otpInputs[index].value = value;

    if (value && index < 3) this.otpInputs[index + 1].focus();

    this.updateVerifyButton();
  }

  handleKeyDown(index, e) {
    if (e.key === "Backspace" && !this.otp[index] && index > 0) {
      this.otpInputs[index - 1].focus();
    }
  }

  updateVerifyButton() {
    const otpCode = this.otp.join("");
    this.verifyBtn.disabled = otpCode.length !== 4;
    this.verifyBtn.classList.toggle("opacity-50", otpCode.length !== 4);
  }

  async handleSubmit(e) {
    e.preventDefault();
    const otpCode = this.otp.join("");
    if (otpCode.length !== 4) return;

    this.isLoading = true;
    this.updateLoadingState();

    try {

      const email = sessionStorage.getItem("otpEmail"); 
      if (!email) throw new Error("Email not found. Please login again.");

      const res = await fetch("http://localhost:5000/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", 
        body: JSON.stringify({ otp: otpCode, email:this.email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "OTP verification failed");

      // Redirect based on role returned from backend
      switch (data.role) {
        case "admin":
          window.location.href = "/admin.html";
          break;
        case "teacher":
          window.location.href = "/teacher.html";
          break;
        case "student":
          window.location.href = "/student.html";
          break;
        default:
          window.location.href = "/";
      }
    } catch (err) {
      alert(err.message);
    } finally {
      this.isLoading = false;
      this.updateLoadingState();
    }
  }

  updateLoadingState() {
    if (this.isLoading) {
      this.verifyText.classList.add("hidden");
      this.verifySpinner.classList.remove("hidden");
      this.verifyBtn.disabled = true;
    } else {
      this.verifyText.classList.remove("hidden");
      this.verifySpinner.classList.add("hidden");
      this.updateVerifyButton();
    }
  }

  async handleResendOtp() {
    if (!this.email) {
      alert("Email not found. Please login again.");
      window.location.href = "/login.html";
      return;
    }

    this.isResending = true;
    this.resendBtn.textContent = "Sending...";

    try {
      const res = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: this.email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to resend OTP");

      this.resetOTPInputs();
      this.startTimer();
      this.timerText.classList.remove("hidden");
      this.resendBtn.classList.add("hidden");
    } catch (err) {
      alert(err.message);
    } finally {
      this.isResending = false;
      this.resendBtn.textContent = "Resend Code";
    }
  }

  resetOTPInputs() {
    this.otp = ["", "", "", ""];
    this.otpInputs.forEach((input) => (input.value = ""));
    this.focusFirstInput();
    this.updateVerifyButton();
  }

  startTimer() {
    clearInterval(this.timer);
    this.updateTimerDisplay();
    this.timer = setInterval(() => {
      this.timeLeft--;
      this.updateTimerDisplay();
      if (this.timeLeft <= 0) {
        clearInterval(this.timer);
        this.showResendButton();
      }
    }, 1000);
  }

  updateTimerDisplay() {
    this.countdown.textContent = `${this.timeLeft}s`;
  }

  showResendButton() {
    this.timerText.classList.add("hidden");
    this.resendBtn.classList.remove("hidden");
  }

  focusFirstInput() {
    this.otpInputs[0].focus();
  }
}

// Initialize OTPManager
document.addEventListener("DOMContentLoaded", () => {
  new OTPManager();
});
