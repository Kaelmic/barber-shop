document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.querySelector(".navbar");
  const form = document.querySelector(".booking-form");
  const successMessage = document.getElementById("success-message");

  const nameInput = document.querySelector('input[name="Customer Name"]');
  const phoneInput = document.querySelector('input[name="Phone Number"]');
  const dateInput = document.getElementById("dateInput");
  const dayDisplay = document.getElementById("day-display");
  const timeInput = document.getElementById("timeInput");
  const serviceSelect = document.getElementById("serviceSelect");
  const submitBtn = form?.querySelector('button[type="submit"]');

  const config = {
    startHour: 9,
    endHour: 18,
    cutoffHour: 20,
    closedDays: [0],
    slotMinutes: ["00", "15", "30", "45"],
  };

  function formatDate(date) {
    return date.toISOString().split("T")[0];
  }

  function getMinimumBookingDate() {
    const date = new Date();

    if (date.getHours() >= config.cutoffHour) {
      date.setDate(date.getDate() + 1);
    }

    return formatDate(date);
  }

  function getDayName(dateValue) {
    return new Date(`${dateValue}T00:00:00`).toLocaleDateString("en-US", {
      weekday: "long",
    });
  }

  function isClosedDay(dateValue) {
    return config.closedDays.includes(new Date(`${dateValue}T00:00:00`).getDay());
  }

  function resetTimeSlots(message = "Select time") {
    if (!timeInput) return;
    timeInput.innerHTML = `<option value="">${message}</option>`;
  }

  function setMinimumDate() {
    if (!dateInput) return;
    dateInput.min = getMinimumBookingDate();
  }

  function generateTimeSlots() {
    resetTimeSlots();

    if (!dateInput?.value || !timeInput) return;

    const now = new Date();
    const selectedDate = dateInput.value;
    const isToday = selectedDate === formatDate(now);

    if (selectedDate < getMinimumBookingDate()) {
      resetTimeSlots("Choose a valid date first");
      return;
    }

    if (isClosedDay(selectedDate)) {
      resetTimeSlots("Closed on this day");
      return;
    }

    let availableSlots = 0;

    for (let hour = config.startHour; hour <= config.endHour; hour++) {
      config.slotMinutes.forEach((minute) => {
        if (hour === config.endHour && minute !== "00") return;

        const time = `${String(hour).padStart(2, "0")}:${minute}`;
        const slotDateTime = new Date(`${selectedDate}T${time}:00`);

        if (isToday && slotDateTime <= now) return;

        const option = document.createElement("option");
        option.value = time;
        option.textContent = time;
        timeInput.appendChild(option);

        availableSlots++;
      });
    }

    if (!availableSlots) {
      resetTimeSlots("No available times today");
    }
  }

  function updateDayMessage() {
    if (!dayDisplay || !dateInput) return;

    const selectedDate = dateInput.value;

    if (!selectedDate) {
      dayDisplay.textContent = "";
      return;
    }

    if (selectedDate < getMinimumBookingDate()) {
      dayDisplay.textContent = "Please choose a valid future date.";
      dateInput.value = "";
      resetTimeSlots();
      return;
    }

    if (isClosedDay(selectedDate)) {
      dayDisplay.textContent = `Sorry, we are closed on ${getDayName(selectedDate)}. Please choose another date.`;
      dateInput.value = "";
      resetTimeSlots();
      return;
    }

    dayDisplay.textContent = `Selected day: ${getDayName(selectedDate)}`;
  }

  function validateForm() {
    const name = nameInput?.value.trim();
    const phone = phoneInput?.value.trim();
    const selectedDate = dateInput?.value;
    const selectedTime = timeInput?.value;

    if (!name || !/^[A-Za-z\s]+$/.test(name)) {
      alert("Please enter a valid name using letters only.");
      return false;
    }

    if (!phone || !/^[\+0-9\s]+$/.test(phone)) {
      alert("Please enter a valid phone number.");
      return false;
    }

    if (!serviceSelect?.value) {
      alert("Please choose a service.");
      return false;
    }

    if (!selectedDate || selectedDate < getMinimumBookingDate()) {
      alert("Please choose a valid booking date.");
      return false;
    }

    if (isClosedDay(selectedDate)) {
      alert("Sorry, we are closed on Sundays.");
      return false;
    }

    if (!selectedTime) {
      alert("Please choose a valid booking time.");
      return false;
    }

    const selectedDateTime = new Date(`${selectedDate}T${selectedTime}:00`);

    if (selectedDateTime <= new Date()) {
      alert("Please choose a future time.");
      generateTimeSlots();
      timeInput.value = "";
      return false;
    }

    return true;
  }

  function initRevealAnimations() {
    const revealElements = document.querySelectorAll(".reveal");

    function revealOnScroll() {
      revealElements.forEach((element) => {
        const elementTop = element.getBoundingClientRect().top;

        if (elementTop < window.innerHeight - 100) {
          element.classList.add("active");
        }
      });
    }

    window.addEventListener("scroll", revealOnScroll);
    window.addEventListener("load", revealOnScroll);
    revealOnScroll();
  }

  function initNavbarScroll() {
    if (!navbar) return;

    function updateNavbar() {
      navbar.classList.toggle("scrolled", window.scrollY > 60);
    }

    window.addEventListener("scroll", updateNavbar);
    updateNavbar();
  }

  function initInputFilters() {
    nameInput?.addEventListener("input", () => {
      nameInput.value = nameInput.value.replace(/[^A-Za-z\s]/g, "");
    });

    phoneInput?.addEventListener("input", () => {
      phoneInput.value = phoneInput.value.replace(/[^\d+\s]/g, "");
    });
  }

  function initBookingForm() {
    if (!form || !successMessage || !dateInput || !timeInput) return;

    setMinimumDate();
    resetTimeSlots();

    dateInput.addEventListener("change", () => {
      setMinimumDate();
      updateDayMessage();
      generateTimeSlots();
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      successMessage.style.display = "none";
      setMinimumDate();

      if (!validateForm()) return;

      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";

      try {
        const response = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Form submission failed");
        }

        form.reset();
        dayDisplay.textContent = "";
        resetTimeSlots();
        setMinimumDate();

        successMessage.style.display = "block";
        successMessage.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      } catch (error) {
        alert("Something went wrong. Please try again.");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Request";
      }
    });
  }

  initNavbarScroll();
  initRevealAnimations();
  initInputFilters();
  initBookingForm();
});

function scrollToBooking(serviceName) {
  const bookingSection = document.getElementById("booking");
  const serviceSelect = document.getElementById("serviceSelect");

  if (serviceSelect && serviceName) {
    serviceSelect.value = serviceName;
  }

  bookingSection?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}
