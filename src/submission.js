import './style.css';
import dayjs from "https://unpkg.com/dayjs/esm/index.js";

document.addEventListener("DOMContentLoaded", () => {
  // Display current date (optional, if you add #date somewhere)
  const dateElement = document.getElementById('date');
  if (dateElement) {
    dateElement.innerHTML = dayjs().format("ddd MMM D YYYY");
  }
  
  let currentUser = JSON.parse(localStorage.getItem("currentUser")) || { name: "Guest", role: "student" };


  // References
  const tableNameInput = document.getElementById('tableNameInput');
  const tableMatricInput = document.getElementById('tableMatricInput');
  const tableAddBtn = document.getElementById('tableAddBtn');
  const tableBody = document.getElementById('tableBody');
  const tableSection = document.getElementById('tableSection');
  const cancelEditBtn = document.getElementById('cancelEditBtn')
  const downloadBtn = document.getElementById('downloadBtn')
  const attendanceStatus = document.getElementById('attendanceStatus')
  const courseFilter = document.getElementById('courseFilter')
  const logoutBtn = document.getElementById('logoutBtn')

  //Load from localStorage
  let attendanceRecords = JSON.parse(localStorage.getItem('attendanceRecords')) || {};

  let editIndex = null;
  let editCourse = null
  let currentCourse = "all"

  logoutBtn?.addEventListener("click", () => {
    //Remove stored user info
    localStorage.removeItem("currentUser")

    // Redirect back to student form
    window.location.href = "index.html"
  })

  function populateFilter() {
    if (!courseFilter) return; // it will return a value and stop the function execution
    courseFilter.innerHTML = `<option value="all">All Courses</option>`
    Object.keys(attendanceRecords).forEach(course => { //Object.keys() is a built-in method that returns an array of a given object's own enumerable property names (keys)
      const option = document.createElement("option")
      option.value = course
      option.textContent = course
      courseFilter.appendChild(option)
    })
  }

  // Render Table
  function renderInfo() {
    if (!tableBody) return;

    // Sort records by matric for each course
    for (const course in attendanceRecords) {
      attendanceRecords[course].sort((a, b) => {
      return a.matric.localeCompare(b.matric, undefined, { numeric: true})
      })
    }

    tableBody.innerHTML = '';

    if (Object.keys(attendanceRecords).length === 0) {
      tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4">No records found.</td></tr>`
      return;
    }

    for (const course in attendanceRecords) {
      if (currentCourse !== "all" && currentCourse !== course) continue; //continue - it skips the current iteration and move to the next iteration

      // Separator row
      const headerRow = document.createElement("tr");
      headerRow.innerHTML = `
        <td colspan="5" class="bg-blue-900 text-white font-bold text-lg px-2 py-2">
          Course: ${course}
        </td>`;
      tableBody.appendChild(headerRow);

      attendanceRecords[course].forEach((item, index) => {
        const rowClass = index % 2 === 0 ? 'bg-white' : 'bg-gray-100';
        const tr = document.createElement('tr');
        tr.className = rowClass;
        const canDelete = ["classrep", "lecturer"].includes(currentUser.role?.toLowerCase());

        tr.innerHTML = `
          <td class="px-2 py-2">${item.name}</td>
          <td class="px-2 py-2">${item.matric}</td>
          <td class="px-2 py-2">${item.date}</td>
          <td class="px-2 py-2">${item.status}</td>
          <td class="px-2 py-2 text-center">
            <div class="flex gap-4 justify-center">
              <button class="editBtn rounded-lg cursor-pointer" data-course="${course}" data-index="${index}">
                <img src="images/edit.png" class="w-5" alt="Edit">
              </button>
              ${canDelete
                ? `<button class="deleteBtn rounded-lg cursor-pointer"><img src="images/bin.png" class="w-5" alt="Delete"></button>` 
              : ''}

            </div>
          </td>
        `;
        tableBody.appendChild(tr);

        // Edit
        const editBtn = tr.querySelector('.editBtn')
        if (editBtn) {
          editBtn.addEventListener('click', () => {
          editIndex = Number(editBtn.dataset.index);
          editCourse = editBtn.dataset.course
          tableNameInput.value = item.name;
          tableMatricInput.value = item.matric;
          attendanceStatus.value = item.status || 'Present'
          tableAddBtn.textContent = 'Save';
          cancelEditBtn.classList.remove('hidden')
          tableSection.scrollIntoView({ behavior: 'smooth' });
          })
        }

        // Delete
        if (canDelete) {
          const deleteBtn = tr.querySelector('.deleteBtn')
          if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
              attendanceRecords[course].splice(index, 1)
              if (attendanceRecords[course].length === 0) delete attendanceRecords[course]
              saveAndRender()
            })
          }
        }
      });
    }
  }

  // Save & re-render
  function saveAndRender() {
    localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));
    renderInfo();

     // Also refresh the summary
    const summaryDateInput = document.getElementById("summaryDate");
    const selected = summaryDateInput?.value
    ? dayjs(summaryDateInput.value).format("DD-MM-YYYY")
    : null;

    renderSummary(selected);
  }

  function showAlert(message, type = "info") {
  const alertBox = document.getElementById('alertBox')

    // Tailwind classes for different alert types
    const alertTypes = {
      success: "bg-green-100 text-green-800 border border-green-300",
      warning: "bg-yellow-100 text-yellow-800 border border-yellow-300",
    }

    alertBox.innerHTML = `
    <div class="rounded-lg shadow-lg px-4 py-3 mb-2 ${alertTypes[type]} animate-fade-in">
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

  // Add or edit info
  function addInfo() {
  const name = tableNameInput.value.trim();
  const matric = tableMatricInput.value.trim();
  const date = dayjs().format('DD-MM-YYYY');
  const status = attendanceStatus.value || 'Present';

  if (!name || !matric) {
    showAlert("⚠️ Please fill in both name and matric number.", "warning");
    return;
  }

  // determine which course we're targeting (edit vs new)
  const targetCourse = editIndex !== null ? editCourse : currentCourse;

  if (!targetCourse || targetCourse === 'all') {
    showAlert("⚠️ Please select a course to add to.", "warning");
    return;
  }

  attendanceRecords[targetCourse] = attendanceRecords[targetCourse] || [];

  // Prevent duplicates (skip the item being edited)
  const exists = attendanceRecords[targetCourse].some((item, idx) => item.matric === matric && idx !== editIndex);
  if (exists) {
    showAlert("⚠️ Matric number already exists!", "warning");
    return;
  }

  if (editIndex !== null) {
    // Save edit into the correct course
    attendanceRecords[targetCourse][editIndex] = { name, matric, date, status };
    editIndex = null;
    editCourse = null;
    tableAddBtn.textContent = 'Add';
    cancelEditBtn.classList.add('hidden');
  } else {
    attendanceRecords[targetCourse].push({ name, matric, date, status });
  }

  // reset form
  tableNameInput.value = '';
  tableMatricInput.value = '';
  attendanceStatus.value = 'Present';
  saveAndRender();
}


  //Cancel Edit
  function cancelEdit() {
    editIndex = null
    editCourse = null
    tableNameInput.value = ''
    tableMatricInput.value = ''
    attendanceStatus.value = 'Present'
    tableAddBtn.textContent = 'Add'
    cancelEditBtn.classList.add('hidden')
  }

  function downloadList() {
    downloadBtn?.addEventListener('click', () => {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      // Current date + time
      const timestamp = dayjs().format("MMM D, YYYY - h:mm A");

      //Selected date for summary - defaults to today if none is picked
      const summaryDateInput = document.getElementById("summaryDate")
      const selectedDate = summaryDateInput?.value ? dayjs(summaryDateInput.value).format("DD-MM-YYYY") : dayjs().format("DD-MM-YYYY")

      let y = 15

      //Section 1: Attendance Records
      for (const course in attendanceRecords) {
        if (currentCourse !== "all" && currentCourse !== course) continue;

        // Title for each course
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(`${course} Student Attendance List - ${timestamp}`, 14, y);

        // Add table
        doc.autoTable({
          startY: y + 5,
          head: [["Name", "Matric No", "Date", "Status"]],
          body: attendanceRecords[course].map(rec => [
            rec.name, rec.matric, rec.date, rec.status
          ]),
          headStyles: {
          fillColor: [30, 64, 175], 
          textColor: [255, 255, 255], 
          halign: 'left',          
          fontStyle: 'bold'
          },
          styles: {
          textColor: [0, 0, 0], 
          halign: 'left',
          fontSize: 10
          }
        });

        y = doc.lastAutoTable.finalY + 15;
      }

      // Section 2: Daily Summary
      let summaryData = {}

      for (const course in attendanceRecords) {
        if (currentCourse !== "all" && currentCourse !== course) continue

        if (!summaryData[course]) {
          summaryData[course] = { Present: 0, Absent: 0, Excused: 0 }
        }

        attendanceRecords[course].forEach(rec => {
          if (rec.date === selectedDate) {
            summaryData[course][rec.status] = (summaryData[course][rec.status] || 0) + 1
          }
        })
      }

      if (Object.keys(summaryData).length > 0) {
        doc.setFontSize(14)
        doc.text(`Daily Attendance Summary - ${selectedDate}`, 14, y)

        doc.autoTable({
          startY: y + 5,
          head: [["Course", "Present", "Absent", "Excused"]],
          body: Object.entries(summaryData).map(([course, s]) => [
            course, s.Present, s.Absent, s.Excused
          ]),
          headStyles: {
          fillColor: [30, 64, 175], 
          textColor: [255, 255, 255], 
          halign: 'left',          
          fontStyle: 'bold'
          },
          styles: {
          textColor: [0, 0, 0], 
          halign: 'left',
          fontSize: 10
          }
        })
      }

      // File name with timestamp (safe for filenames)
      const fileName = `attendance_${dayjs().format("YYYY-MM-DD_HH-mm")}.pdf`;
      doc.save(fileName);
    });
  }

  function renderSummary(selectedDate = null) {
    const summaryContent =  document.getElementById('summaryContent')
    if(!summaryContent) return;

    //This will be today's date if no date is selected
    const targetDate = selectedDate || dayjs().format('DD-MM-YYYY')
    let summaryData = {}

    for (const course in attendanceRecords) {
      if (currentCourse !== "all" && currentCourse !== course) continue

      if (!summaryData[course]) {
        summaryData[course] = { Present: 0, Absent: 0, Excused: 0 }
      }

      attendanceRecords[course].forEach(rec => {
        if (rec.date === targetDate) {
          summaryData[course][rec.status] = (summaryData[course][rec.status] || 0) + 1
        }
      })
    }

    if (Object.keys(summaryData).length === 0 || Object.values(summaryData).every(s => Object.values(s).every(s => s === 0))) {
      summaryContent.innerHTML = `<p class="text-gray-500">No attendance recors for ${targetDate}</p>`
      return
    }

    let html = `
    <table class="w-full border-collapse border-2">
      <thead class="bg-gray-200">
        <tr>
          <th class="border-2 px-2 py-1">Course</th>
          <th class="border-2 px-2 py-1">Present</th>
          <th class="border-2 px-2 py-1">Absent</th>
          <th class="border-2 px-2 py-1">Excused</th>
        </tr>
      </thead>
    <tbody>
    `;

    for (const course in summaryData) {
      const s = summaryData[course]
      html += `
      <tr>
        <td class="border-2 px-2 py-1">${course}</td>
        <td class="border-2 px-2 py-1 text-center">${s.Present}</td>
        <td class="border-2 px-2 py-1 text-center">${s.Absent}</td>
        <td class="border-2 px-2 py-1 text-center">${s.Excused}</td>
      </tr>
      `
    }

    html += `</tbody></table>`
    summaryContent.innerHTML = html
  }

  // Event listeners
  tableAddBtn?.addEventListener("click", e => { e.preventDefault(); addInfo();})
  cancelEditBtn?.addEventListener("click", e => { e.preventDefault(); cancelEdit();})
  courseFilter?.addEventListener("change", e => {currentCourse = e.target.value;
    cancelEdit();
    renderInfo(); 
  })

  const summaryDateInput = document.getElementById("summaryDate")

  if (summaryDateInput) {
    summaryDateInput.innerHTML = dayjs().format("DD-MM-YYYY")

    summaryDateInput.addEventListener("change", e => {
      const selected = dayjs(e.target.value).format("DD-MM-YYYY")
      renderSummary(selected)
    })
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', e => {
      e.preventDefault()
      cancelEdit()
    })
  }

  // Initial render
  populateFilter()
  renderInfo()
  downloadList()
  renderSummary()
})