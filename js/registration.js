import { hasPlaceholderConfig, registerForEvent } from "../firebase/firebase.js";

const form = document.getElementById("registrationForm");
const submitBtn = document.getElementById("submitBtn");
const btnText = submitBtn.querySelector(".btn-text");
const btnSpinner = submitBtn.querySelector(".btn-spinner");
const formMessage = document.getElementById("formMessage");

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  formMessage.style.display = "none";
  formMessage.className = "form-message";
  document.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));

  if (hasPlaceholderConfig) {
    showMessage(
      "error",
      "Firebase config is missing. Set <code>window.FIREBASE_CONFIG</code> in <code>EventRegistration.html</code> before using the form."
    );
    return;
  }

  const data = {
    name: form.name.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    rollNumber: form.rollNumber.value.trim(),
    department: form.department.value,
    year: form.year.value,
    eventName: form.eventName.value,
  };

  const errors = [];
  if (!data.name) errors.push("name");
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push("email");
  if (!data.phone || !/^\d{10}$/.test(data.phone)) errors.push("phone");
  if (!data.rollNumber) errors.push("rollNumber");
  if (!data.department) errors.push("department");
  if (!data.year) errors.push("year");

  if (errors.length) {
    errors.forEach((id) => document.getElementById(id).classList.add("invalid"));
    showMessage("error", "Please fill in all required fields correctly. Phone must be 10 digits.");
    return;
  }

  submitBtn.disabled = true;
  btnText.style.display = "none";
  btnSpinner.style.display = "inline";

  try {
    const result = await registerForEvent(data);

    showMessage(
      "success",
      "Registration successful! Your Registration ID is <strong>" +
        result.registrationId +
        "</strong>. Your details have been saved in Firebase."
    );
    form.reset();
  } catch (err) {
    if (err?.status === 409) {
      showMessage("error", err.message || "You have already registered for this event.");
    } else if (err?.status === 400) {
      showMessage("error", err.message || "All fields are required.");
    } else {
      showMessage("error", "Registration failed. Please try again.");
    }
  } finally {
    submitBtn.disabled = false;
    btnText.style.display = "inline";
    btnSpinner.style.display = "none";
  }
});

function showMessage(type, html) {
  formMessage.className = "form-message " + type;
  formMessage.innerHTML = html;
  formMessage.style.display = "block";
  formMessage.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
