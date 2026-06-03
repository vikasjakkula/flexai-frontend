// =================== SERVICES ===================
const SERVICES = [
  { num: '01', name: '3D Modeling', desc: 'Creation of detailed objects, characters, or environments tailored to specific client needs, ideal for games, products, and visualizations.' },
  { num: '02', name: 'Rendering', desc: 'High-quality, photorealistic renders that showcase designs with custom lighting, textures, and materials to bring concepts to life.' },
  { num: '03', name: 'Motion Design', desc: 'Dynamic animations and motion graphics that add energy and storytelling to brands, products, and digital experiences.' },
  { num: '04', name: 'Branding', desc: 'Crafting cohesive visual identities — from logos to full brand systems — that communicate a clear and memorable presence.' },
  { num: '05', name: 'Web Design', desc: 'Designing clean, modern, and conversion-focused websites with attention to layout, typography, and user experience.' },
];

// Converts the ServicesSection React component into a pure JavaScript string renderer.
function renderServicesSection() {
  let html = '';
  html += `<section class="px-5 sm:px-8 md:px-10 py-20 sm:py-24 md:py-32 rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px] relative z-0" style="background: #FFFFFF;">`;
  html += `<h2 class="font-black uppercase text-center mb-16 sm:mb-20 md:mb-28" style="color: #0C0C0C; font-size: clamp(3rem, 12vw, 160px); line-height: 1; letter-spacing: -0.02em;">Services</h2>`;

  html += `<div class="max-w-5xl mx-auto">`;
  SERVICES.forEach((s, i) => {
    const borderTop = 'border-top:1px solid rgba(12, 12, 12, 0.15);';
    const borderBottom = i === SERVICES.length - 1 ? 'border-bottom:1px solid rgba(12, 12, 12, 0.15);' : '';
    html += `<div class="flex items-start gap-6 sm:gap-10 md:gap-14 py-8 sm:py-10 md:py-12" style="${borderTop}${borderBottom}">`;
      html += `<div class="font-black flex-shrink-0" style="color: #0C0C0C; font-size: clamp(3rem, 10vw, 140px); line-height: 0.9;">${s.num}</div>`;
      html += `<div class="flex flex-col gap-3 sm:gap-4 md:gap-5 pt-2">`;
        html += `<div class="font-medium uppercase" style="color: #0C0C0C; font-size: clamp(1rem, 2.2vw, 2.1rem); line-height: 1.1; letter-spacing: 0.01em;">${s.name}</div>`;
        html += `<p class="font-light leading-relaxed max-w-2xl" style="color: #0C0C0C; opacity: 0.6; font-size: clamp(0.85rem, 1.6vw, 1.25rem);">${s.desc}</p>`;
      html += `</div>`;
    html += `</div>`;
  });
  html += `</div>`;
  html += `</section>`;
  return html;
}

// =================== PROJECTS ===================
const PROJECTS = [
  {
    num: '01',
    name: 'Nextlevel Studio',
    category: 'Client',
    col1a: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055344_5eff02e0-87a5-41ce-b64f-eb08da8f33db.png&w=1280&q=85',
    col1b: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055431_11d841fd-8b41-46a5-82e4-b04f2407a7d8.png&w=1280&q=85',
    col2: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055451_e317bf2d-28d4-48cc-86b0-6f72f25b6327.png&w=1280&q=85',
  },
  {
    num: '02',
    name: 'Aura Brand Identity',
    category: 'Personal',
    col1a: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055654_911201c5-36d9-4bc6-bac7-331adfce159f.png&w=1280&q=85',
    col1b: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055723_5ceda0b8-d9c2-4665-b2e3-83ba19ba76d1.png&w=1280&q=85',
    col2: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055753_adc5dcbd-a8e6-49c0-b43a-9b030d835cea.png&w=1280&q=85',
  },
  {
    num: '03',
    name: 'Solaris Digital',
    category: 'Client',
    col1a: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055759_963cfb0b-4bd1-4b0f-9d0a-09bd6cf95b2f.png&w=1280&q=85',
    col1b: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_060108_438f781a-9846-4dcc-89ab-c4e6cb830f5b.png&w=1280&q=85',
    col2: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055818_9d062121-ad7e-46b9-999a-1a6a692ef1ee.png&w=1280&q=85',
  },
];

// Converts the ProjectCard React component into a pure JavaScript string renderer.
function renderProjectCard(project, index, total, progress/* not used, just kept to match signature */) {
  // scale logic omitted as not representable in static HTML
  return `
    <div class="sticky" style="top: calc(6rem + ${index * 28}px)">
      <div style="background: #0C0C0C; border-color: #D7E2EA;" class="rounded-[40px] sm:rounded-[50px] md:rounded-[60px] border-2 p-4 sm:p-6 md:p-8">
        <!-- Top row -->
        <div class="flex flex-col md:flex-row md:items-start gap-5 md:gap-8 mb-6 sm:mb-8 md:mb-10 px-2 sm:px-4 md:px-6 pt-2 md:pt-4">
          <div class="font-black flex-shrink-0" style="color: #D7E2EA; font-size: clamp(3rem, 10vw, 140px); line-height: 0.85;">
            ${project.num}
          </div>
          <div class="flex-1 flex flex-col gap-2 sm:gap-3 pt-1 md:pt-4">
            <div class="uppercase tracking-widest font-light" style="color: #D7E2EA; opacity: 0.55; font-size: clamp(0.7rem, 1vw, 0.95rem);">
              ${project.category}
            </div>
            <div class="font-medium uppercase leading-none" style="color: #D7E2EA; font-size: clamp(1.4rem, 3.4vw, 3.2rem); letter-spacing: -0.01em;">
              ${project.name}
            </div>
          </div>
          <div class="flex-shrink-0 md:pt-4">
            <!-- LiveProjectButton placeholder -->
            <button class="live-project-button">View Project</button>
          </div>
        </div>

        <!-- Image grid -->
        <div class="flex gap-3 sm:gap-4 md:gap-5">
          <div class="flex flex-col gap-3 sm:gap-4 md:gap-5" style="width: 40%;">
            <div class="rounded-[40px] sm:rounded-[50px] md:rounded-[60px] overflow-hidden" style="height: clamp(130px, 16vw, 230px);">
              <img src="${project.col1a}" alt="" class="w-full h-full object-cover block" loading="lazy" />
            </div>
            <div class="rounded-[40px] sm:rounded-[50px] md:rounded-[60px] overflow-hidden" style="height: clamp(160px, 22vw, 340px);">
              <img src="${project.col1b}" alt="" class="w-full h-full object-cover block" loading="lazy" />
            </div>
          </div>
          <div class="rounded-[40px] sm:rounded-[50px] md:rounded-[60px] overflow-hidden self-stretch" style="width: 60%;">
            <img src="${project.col2}" alt="" class="w-full h-full object-cover block" loading="lazy" />
          </div>
        </div>
      </div>
    </div>
  `;
}

// Converts the ProjectsSection React component into a pure JavaScript string renderer.
function renderProjectsSection() {
  let html = '';
  html += `<section class="relative z-10 rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px] -mt-10 sm:-mt-12 md:-mt-14 px-5 sm:px-8 md:px-10 pt-20 sm:pt-24 md:pt-32 pb-32" style="background: #0C0C0C;">`;
  html += `<h2 class="hero-heading font-black uppercase text-center leading-none tracking-tight mb-16 sm:mb-20 md:mb-28" style="font-size: clamp(3rem, 12vw, 160px);">Project</h2>`;
  html += `<div class="max-w-7xl mx-auto">`;
  PROJECTS.forEach((p, i) => {
    html += `<div class="h-[85vh]" key="${p.num}">`;
    html += renderProjectCard(p, i, PROJECTS.length);
    html += `</div>`;
  });
  html += `</div>`;
  html += `</section>`;
  return html;
}

// Expose for global usage, similar to the Object.assign in the React version
window.ServicesSection = renderServicesSection;
window.ProjectsSection = renderProjectsSection;

export { renderServicesSection, renderProjectsSection };