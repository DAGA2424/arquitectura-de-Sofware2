/************** SUPABASE CONFIG **************/
const SUPABASE_URL = "https://eoczwvclmwwxjrvbtwjm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvY3p3dmNsbXd3eGpydmJ0d2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMzUzMTEsImV4cCI6MjA3NTYxMTMxMX0.5mvtMVVlyWKVx_UIuxpM-ZY_UNcJL_im3VLAWHbiPQQ";

// ⚠️ NO DECLARAMOS supabase
const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

console.log("Supabase listo", supabaseClient);

const slides = document.querySelectorAll(".slide");
const dots = document.querySelectorAll(".dot");
const next = document.querySelector(".next");
const prev = document.querySelector(".prev");

let index = 0;

function showSlide(i) {
slides.forEach(slide => slide.classList.remove("active"));
dots.forEach(dot => dot.classList.remove("active"));
    
slides[i].classList.add("active");
dots[i].classList.add("active");
  }

next.addEventListener("click", () => {
index = (index + 1) % slides.length;
showSlide(index);
  });

prev.addEventListener("click", () => {
    index = (index - 1 + slides.length) % slides.length;
    showSlide(index);
  });

dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      index = i;
      showSlide(index);
    });
  });

  // Auto play
setInterval(() => {
    index = (index + 1) % slides.length;
    showSlide(index);
  }, 5000);
  
/************** ELEMENTOS DOM **************/
const semanasList = document.getElementById("semanasList");
const docsPreview = document.getElementById("docsPreview");
const semanaTitulo = document.getElementById("semanaTitulo");
const uploadPanel = document.getElementById("uploadPanel");
const fileUpload = document.getElementById("fileUpload");
const uploadBtn = document.getElementById("uploadBtn");
const uploadStatus = document.getElementById("uploadStatus");
const semanaSelect = document.getElementById("semanaSelect");

/************** GENERAR SEMANAS **************/
for (let i = 1; i <= 16; i++) {
  const li = document.createElement("li");
  li.textContent = `Semana ${i}`;
  li.onclick = () => mostrarDocumentos(i);
  semanasList.appendChild(li);

  const opt = document.createElement("option");
  opt.value = i;
  opt.textContent = `Semana ${i}`;
  semanaSelect.appendChild(opt);
}

async function mostrarDocumentos(semana) {
  semanaTitulo.textContent = `Documentos - Semana ${semana}`;
  docsPreview.innerHTML = "Cargando...";

  const { data: sessionData } = await supabaseClient.auth.getSession();
  const isLogged = !!sessionData.session;

  const { data, error } = await supabaseClient
    .storage
    .from("documentos")
    .list(`semana${semana}`);

  if (error) {
    docsPreview.innerHTML = "Error al cargar documentos";
    return;
  }

  if (!data.length) {
    docsPreview.innerHTML = "No hay documentos";
    return;
  }

  docsPreview.innerHTML = "";

  data.forEach(file => {
    const fileUrl = `${SUPABASE_URL}/storage/v1/object/public/documentos/semana${semana}/${file.name}`;
    const ext = file.name.split('.').pop().toLowerCase();

    const card = document.createElement("div");
    card.className = "doc-card";

    /* ===== PREVISUALIZACIÓN ===== */
    let preview;
    if (ext === "pdf") {
      preview = document.createElement("iframe");
      preview.src = fileUrl;
    } else if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
      preview = document.createElement("img");
      preview.src = fileUrl;
    } else {
      preview = document.createElement("div");
      preview.className = "no-preview";
      preview.textContent = "Sin previsualización";
    }

    /* ===== BOTONES ===== */
    const actions = document.createElement("div");
    actions.className = "doc-actions";

    const verBtn = document.createElement("a");
    verBtn.href = fileUrl;
    verBtn.target = "_blank";
    verBtn.textContent = "Ver";
    verBtn.className = "btn ver";

    const downloadBtn = document.createElement("a");
    downloadBtn.href = fileUrl;
    downloadBtn.download = file.name;
    downloadBtn.textContent = "Descargar";
    downloadBtn.className = "btn descargar";

    actions.appendChild(verBtn);
    actions.appendChild(downloadBtn);

    /* ===== SOLO LOGUEADO → ELIMINAR ===== */
    if (isLogged) {
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Eliminar";
      deleteBtn.className = "btn eliminar";

      deleteBtn.onclick = async () => {
        if (!confirm("¿Eliminar archivo?")) return;

        await supabaseClient.storage
          .from("documentos")
          .remove([`semana${semana}/${file.name}`]);

        mostrarDocumentos(semana);
      };

      actions.appendChild(deleteBtn);
    }
    

    card.appendChild(preview);
    card.appendChild(actions);
    docsPreview.appendChild(card);
  });
  
}


/************** SUBIR ARCHIVOS **************/
uploadBtn.onclick = async () => {
  const { data } = await supabaseClient.auth.getSession();
  if (!data.session) {
    alert("Debes iniciar sesión");
    return;
  }

  const file = fileUpload.files[0];
  const semana = semanaSelect.value;

  if (!file || !semana) {
    alert("Seleccione semana y archivo");
    return;
  }

  uploadStatus.textContent = "Subiendo...";

  const { error } = await supabaseClient.storage
    .from("documentos")
    .upload(`semana${semana}/${file.name}`, file, { upsert: true });

  if (error) {
    uploadStatus.textContent = "Error al subir";
  } else {
    uploadStatus.textContent = "Archivo subido";
    fileUpload.value = "";
    mostrarDocumentos(semana);
  }
};

/************** LOGIN / LOGOUT **************/
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginModal = document.getElementById("loginModal");
const closeModal = document.getElementById("closeModal");
const loginForm = document.getElementById("loginForm");
const googleBtn = document.getElementById("googleBtn");

loginBtn.onclick = () => loginModal.classList.remove("hidden");
closeModal.onclick = () => loginModal.classList.add("hidden");

loginForm.onsubmit = async e => {
  e.preventDefault();

  const email = e.target.usuario.value;
  const password = e.target.password.value;

  const { error } = await supabaseClient.auth.signInWithPassword({
    email, password
  });

  if (error) alert(error.message);
  else loginModal.classList.add("hidden");
};

googleBtn.onclick = async () => {
  await supabaseClient.auth.signInWithOAuth({ provider: "google" });
};

logoutBtn.onclick = async () => {
  await supabaseClient.auth.signOut();
};

/************** SESIÓN **************/
async function checkSession() {
  const { data } = await supabaseClient.auth.getSession();

  if (data.session) {
    uploadPanel.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
    loginBtn.textContent = data.session.user.email;
  } else {
    uploadPanel.classList.add("hidden");
    logoutBtn.classList.add("hidden");
    loginBtn.textContent = "Login";
  }
}

// ===== FUNCIONES DEL MODAL (AQUÍ VAN) =====
function abrirDocModal(url, ext) {
  const modal = document.getElementById("docModal");
  const body = document.getElementById("docModalBody");

  if (ext === "pdf") {
    body.innerHTML = `<iframe src="${url}"></iframe>`;
  } else if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
    body.innerHTML = `<img src="${url}">`;
  } else {
    body.innerHTML = `<p>No se puede previsualizar este archivo</p>`;
  }

  modal.style.display = "block";
}

function cerrarDocModal() {
  document.getElementById("docModal").style.display = "none";
  document.getElementById("docModalBody").innerHTML = "";
}
supabaseClient.auth.onAuthStateChange(() => {
  checkSession();
});

checkSession();
