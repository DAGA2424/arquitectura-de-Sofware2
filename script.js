// === 🚀 CONFIGURACIÓN DE SUPABASE ===
const SUPABASE_URL = "https://eoczwvclmwwxjrvbtwjm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvY3p3dmNsbXd3eGpydmJ0d2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMzUzMTEsImV4cCI6MjA3NTYxMTMxMX0.5mvtMVVlyWKVx_UIuxpM-ZY_UNcJL_im3VLAWHbiPQQ";



// === 📅 GENERAR LISTA DE 16 SEMANAS ===
const semanasList = document.getElementById("semanasList");
const docsPreview = document.getElementById("docsPreview");
const semanaTitulo = document.getElementById("semanaTitulo");
const uploadPanel = document.getElementById("uploadPanel");
const fileUpload = document.getElementById("fileUpload");
const uploadBtn = document.getElementById("uploadBtn");
const uploadStatus = document.getElementById("uploadStatus");
const semanaSelect = document.getElementById("semanaSelect");

// Crear lista de semanas
for (let i = 1; i <= 16; i++) {
  const li = document.createElement("li");
  li.textContent = `Semana ${i}`;
  li.addEventListener("click", () => mostrarDocumentos(i));
  semanasList.appendChild(li);

  // También llenar el selector en el panel de subida
  const option = document.createElement("option");
  option.value = i;
  option.textContent = `Semana ${i}`;
  semanaSelect.appendChild(option);
}


// === 🧾 MOSTRAR DOCUMENTOS DE CADA SEMANA ===
async function mostrarDocumentos(semana) {
  semanaTitulo.textContent = `📖 Documentos — Semana ${semana}`;
  docsPreview.innerHTML = "Cargando documentos...";

  const { data, error } = await supabase.storage.from("documentos").list(`semana${semana}/`);
  const { data: { session } } = await supabase.auth.getSession();

  if (error) {
    docsPreview.innerHTML = `<p>Error al cargar: ${error.message}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    docsPreview.innerHTML = "<p>No hay documentos subidos todavía.</p>";
    return;
  }

  docsPreview.innerHTML = "";
  data.forEach(file => {
    const url = `${SUPABASE_URL}/storage/v1/object/public/documentos/semana${semana}/${file.name}`;

    const fileDiv = document.createElement("div");
    fileDiv.classList.add("file-item");

    // Vista previa según tipo de archivo
    let contenido;
    if (file.name.endsWith(".pdf")) {
      contenido = document.createElement("iframe");
      contenido.src = url;
    } else if (file.name.match(/\.(jpg|jpeg|png)$/)) {
      contenido = document.createElement("img");
      contenido.src = url;
    } else {
      contenido = document.createElement("a");
      contenido.href = url;
      contenido.textContent = file.name;
      contenido.target = "_blank";
    }

    fileDiv.appendChild(contenido);

    // Mostrar botón eliminar si está logueado
    if (session) {
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "🗑️ Eliminar";
      deleteBtn.classList.add("delete-btn");
      deleteBtn.addEventListener("click", async () => {
        if (!confirm(`¿Deseas eliminar "${file.name}"?`)) return;

        const { error: deleteError } = await supabase.storage
          .from("documentos")
          .remove([`semana${semana}/${file.name}`]);

        if (deleteError) alert("❌ Error al eliminar: " + deleteError.message);
        else {
          alert("✅ Archivo eliminado correctamente.");
          mostrarDocumentos(semana);
        }
      });
      fileDiv.appendChild(deleteBtn);
    }

    docsPreview.appendChild(fileDiv);
  });
}


// === 🚀 SUBIR ARCHIVOS (SOLO USUARIOS LOGUEADOS) ===
uploadBtn.addEventListener("click", async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return alert("Debes iniciar sesión para subir documentos.");

  const file = fileUpload.files[0];
  const semanaSeleccionada = semanaSelect.value;

  if (!semanaSeleccionada) return alert("Selecciona una semana.");
  if (!file) return alert("Selecciona un archivo primero.");

  uploadStatus.textContent = "Subiendo...";

  const { error } = await supabase.storage
    .from("documentos")
    .upload(`semana${semanaSeleccionada}/${file.name}`, file, { upsert: true });

  if (error) uploadStatus.textContent = "❌ Error: " + error.message;
  else {
    uploadStatus.textContent = "✅ Archivo subido correctamente.";
    fileUpload.value = "";
    mostrarDocumentos(semanaSeleccionada);
  }
});


// === 🔐 LOGIN Y AUTENTICACIÓN ===
document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  const loginModal = document.getElementById("loginModal");
  const closeModal = document.getElementById("closeModal");
  const googleBtn = document.getElementById("googleBtn");
  const loginForm = document.getElementById("loginForm");
  const logoutBtn = document.getElementById("logoutBtn");

  // Abrir y cerrar modal
  loginBtn.addEventListener("click", () => loginModal.classList.remove("hidden"));
  closeModal.addEventListener("click", () => loginModal.classList.add("hidden"));
  window.addEventListener("click", e => { if (e.target === loginModal) loginModal.classList.add("hidden"); });

  // Login con correo y contraseña
  loginForm.addEventListener("submit", async e => {
    e.preventDefault();
    const usuario = e.target.usuario.value;
    const password = e.target.password.value;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: usuario, password
    });

    if (error) alert("Error al iniciar sesión: " + error.message);
    else {
      alert("Bienvenido, " + data.user.email);
      loginModal.classList.add("hidden");
      loginForm.reset();
    }
  });

  // Login con Google
  googleBtn.addEventListener("click", async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) alert("Error al iniciar con Google: " + error.message);
  });

  // Logout
  logoutBtn.addEventListener("click", async () => {
    const { error } = await supabase.auth.signOut();
    if (error) alert("❌ Error al cerrar sesión: " + error.message);
    else alert("👋 Sesión cerrada correctamente.");
  });

  checkSession(); // Al cargar
});


// === 👤 VERIFICAR SESIÓN ACTUAL ===
async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();
  const uploadPanel = document.getElementById("uploadPanel");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (session) {
    uploadPanel.classList.remove("hidden");
    loginBtn.textContent = `👋 ${session.user.email}`;
    logoutBtn.classList.remove("hidden");
  } else {
    uploadPanel.classList.add("hidden");
    loginBtn.textContent = "Login";
    logoutBtn.classList.add("hidden");
  }
}

// Detectar cambios en la sesión
supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_IN") checkSession();
  if (event === "SIGNED_OUT") checkSession();
});


// === 🎠 CARRUSEL AUTOMÁTICO DE INICIO ===
document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".slide");
  const prevBtn = document.querySelector(".prev");
  const nextBtn = document.querySelector(".next");
  let index = 0;
  let interval;

  const showSlide = i => slides.forEach((slide, idx) => slide.classList.toggle("active", idx === i));
  const nextSlide = () => { index = (index + 1) % slides.length; showSlide(index); };
  const prevSlideFn = () => { index = (index - 1 + slides.length) % slides.length; showSlide(index); };

  const startAutoSlide = () => interval = setInterval(nextSlide, 5000);
  const resetInterval = () => { clearInterval(interval); startAutoSlide(); };

  prevBtn.addEventListener("click", () => { prevSlideFn(); resetInterval(); });
  nextBtn.addEventListener("click", () => { nextSlide(); resetInterval(); });

  showSlide(index);
  startAutoSlide();
});




