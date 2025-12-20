/************** SUPABASE CONFIG **************/
const SUPABASE_URL = "https://eoczwvclmwwxjrvbtwjm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvY3p3dmNsbXd3eGpydmJ0d2ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMzUzMTEsImV4cCI6MjA3NTYxMTMxMX0.5mvtMVVlyWKVx_UIuxpM-ZY_UNcJL_im3VLAWHbiPQQ";

// ⚠️ NO DECLARAMOS supabase
const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

console.log("Supabase listo", supabaseClient);

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

/************** MOSTRAR DOCUMENTOS **************/
async function mostrarDocumentos(semana) {
  semanaTitulo.textContent = `Documentos - Semana ${semana}`;
  docsPreview.innerHTML = "Cargando...";

  const { data: sessionData } = await supabaseClient.auth.getSession();

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
    const url = `${SUPABASE_URL}/storage/v1/object/public/documentos/semana${semana}/${file.name}`;

    const div = document.createElement("div");

    const link = document.createElement("a");
    link.href = url;
    link.textContent = file.name;
    link.target = "_blank";

    div.appendChild(link);

    if (sessionData.session) {
      const del = document.createElement("button");
      del.textContent = "Eliminar";
      del.onclick = async () => {
        await supabase.storage
          .from("documentos")
          .remove([`semana${semana}/${file.name}`]);
        mostrarDocumentos(semana);
      };
      div.appendChild(del);
    }

    docsPreview.appendChild(div);
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

supabaseClient.auth.onAuthStateChange(() => {
  checkSession();
});

checkSession();






