import { Warning } from 'postcss';
import './style.css';
import dayjs from "https://unpkg.com/dayjs/esm/index.js";

// Logged in user (default: student)
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || { name: "Guest", role: "student" };

// Form references
const studentNameInput = document.getElementById('studentNameInput');
const studentMatricInput = document.getElementById('studentMatricInput');
const submitAttendance = document.getElementById('submitAttendance');
const courseInput = document.getElementById('courseInput')

let attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || {};

// Save submissions to localStorage
function saveRecords() {
  localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));
}

function showAlert(message, type = "info") {
  const alertBox = document.getElementById('alertBox')

  // Tailwind classes for different alert types
  const alertTypes = {
    success: "bg-green-100 text-green-800 border border-green-300",
    warning: "bg-yellow-100 text-yellow-800 border border-yellow-300",
  }

  alertBox.innerHTML = `
  <div class="rounded-lg shadow-lg px-4 py-3 mb-2 ${alertTypes[type]} animate-fade-in -z-50">
    <div class="flex items-center justify-between">
    <span class="text-sm font-medium text-neutral-800">${message}</span>
    <button onclick="this.parentElement.parentElement.remove()" class="ml-3 text-lg font-bold">&times;</button>
    </div>
  </div>
  `
  alertBox.classList.remove("hidden")

  //Auto-hide after 3 seconds
  setTimeout(() => {
    alertBox.classList.add("hidden")
  }, 3000)
}

// Add attendance
function addInfo() {
  const name = studentNameInput.value.trim();
  const matric = studentMatricInput.value.trim();
  const course = courseInput.value.trim()
  const date = dayjs().format('DD-MM-YYYY')

  if (!name || !matric || !course) {
    showAlert("⚠️ Please fill in name, matric number and course.", "warning");
    return;
  }

  if (!attendanceRecords[course]) {
    attendanceRecords[course] =[]
  }

  const exists = attendanceRecords[course].some(item => item.matric === matric && item.date === date);
  if (exists) {
    showAlert("⚠️ Matric number already exists!", "warning");
    return;
  }

  attendanceRecords[course].push({ name, matric, date, status: "Present" });
  saveRecords();

  // Reset form
  studentNameInput.value = '';
  studentMatricInput.value = '';
  courseInput.value = ''

  // Reset back to student until name is retyped
  currentUser = { name: "Guest", role: "student" };

  showAlert(`✅ Attendance recorded for ${course}`, "success")
}

// Event listeners
if (submitAttendance) {
  submitAttendance.addEventListener('click', e => {
    e.preventDefault();
    addInfo();
  });
}

// On load: default back to "student"
currentUser = { name: "Guest", role: "student" };

// Users database (leturers / class reps)
let users = [
  { name: "Abdulrahmon", password: "classrep", role: "classrep" },
  { name: "Abdulkareem", password: "lecturer", role: "lecturer" }
]

const loginModal = document.getElementById("loginModal")
const loginSubmit = document.getElementById("loginSubmit")
const loginError = document.getElementById("loginError")
const closeLogin = document.getElementById("closeLogin")
const openLogin = document.getElementById("openLogin");

//Secret key (Alt + L) to open login
document.addEventListener("keydown", e => {
  if (e.altKey && e.key.toLowerCase() === "l") {
    loginModal.classList.remove("hidden")
  }
})

//Close Modal
closeLogin?.addEventListener("click", () => {
  loginModal.classList.add("hidden")
  loginModal.classList.remove("flex")
  loginError.classList.add("hidden")
})

openLogin?.addEventListener("click", () => {
  loginModal.classList.remove("hidden");
  loginModal.classList.add("flex")
  loginError.classList.add("hidden");
});

if (currentUser.role === "student") {
  openLogin.classList.remove("hidden");
} else {
  openLogin.classList.add("hidden");
}

//Handle login
loginSubmit?.addEventListener("click", () => {
  const name = document.getElementById("loginName").value.trim()
  const password = document.getElementById("loginPassword").value.trim()

  const user = users.find(u => u.name.toLowerCase() === name.toLowerCase() && u.password === password)

  if (user) {
    currentUser = {name: user.name, role: user.role}
    localStorage.setItem("currentUser", JSON.stringify(currentUser))

    window.location.href = "submission.html"
  } else {
    loginError.classList.remove("hidden")
  }
})