/* ============================================
   Introduction to Web Programming — JS
   Student: Jakkula Vikas Yadav | NGIT
   ============================================ */

   document.addEventListener("DOMContentLoaded", () => {

    /* ---------- 1. Show the current year in the footer ---------- */
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  
    /* ---------- 2. Smooth scroll for nav links ---------- */
    const navLinks = document.querySelectorAll('.navbar a[href^="#"]');
  
    navLinks.forEach(link => {
      link.addEventListener("click", (e) => {
        const targetId = link.getAttribute("href");
        const target = document.querySelector(targetId);
        if (!target) return;
  
        e.preventDefault();
        const navHeight = document.querySelector(".navbar").offsetHeight;
        const top = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 10;
  
        window.scrollTo({ top, behavior: "smooth" });
      });
    });
  
    /* ---------- 3. Highlight the active nav item while scrolling ---------- */
    const sectionIds = ["home", "introduction", "concepts", "media", "forms", "resources"];
    const sections = sectionIds
      .map(id => document.getElementById(id))
      .filter(Boolean);
  
    function setActiveLink() {
      const navHeight = document.querySelector(".navbar").offsetHeight;
      const scrollPos = window.scrollY + navHeight + 40;
  
      let currentId = sections[0].id;
      for (const sec of sections) {
        if (sec.offsetTop <= scrollPos) currentId = sec.id;
      }
  
      navLinks.forEach(link => {
        link.classList.toggle(
          "active",
          link.getAttribute("href") === "#" + currentId
        );
      });
    }
  
    window.addEventListener("scroll", setActiveLink, { passive: true });
    setActiveLink();
  
    /* ---------- 4. Simple form handler ---------- */
    const form = document.getElementById("contactForm");
    const status = document.getElementById("formStatus");
  
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
  
        const name = form.name.value.trim();
        const email = form.email.value.trim();
        const message = form.message.value.trim();
  
        if (!name || !email || !message) {
          status.textContent = "⚠ Please fill in all fields.";
          status.style.color = "#EA580C";
          return;
        }
  
        if (!/^\S+@\S+\.\S+$/.test(email)) {
          status.textContent = "⚠ Please enter a valid email address.";
          status.style.color = "#EA580C";
          return;
        }
  
        status.textContent = "✓ Thanks " + name + "! Your message has been recorded.";
        status.style.color = "#2563EB";
        form.reset();
      });
    }
  });