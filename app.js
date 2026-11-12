// REST Countries v5 (la v3.1 de la práctica ya fue dada de baja).
// Obtuve mi API en: (https://restcountries.com/sign-up)
   const API_KEY = "PEGA_AQUI_TU_LLAVE";
const API = "https://api.restcountries.com/countries/v5";
const CAMPOS = "names.common,capitals,region,population,flag";

// Hace la petición y maneja los errores. Regresa el arreglo de países.
async function pedir(url) {
  const respuesta = await fetch(url, {
    headers: { "Authorization": `Bearer ${API_KEY}` }
  });
  if (!respuesta.ok) {
    if (respuesta.status === 404) {
      throw new Error("No se encontró ningún país con ese nombre.");
    }
    if (respuesta.status === 401 || respuesta.status === 403) {
      throw new Error("API key inválida o sin permiso.");
    }
    if (respuesta.status === 429) {
      throw new Error("Demasiadas peticiones. Espera un momento e intenta de nuevo.");
    }
    throw new Error(`Error del servidor (código ${respuesta.status}).`);
  }
  const datos = await respuesta.json();
  return datos.data && datos.data.objects ? datos.data.objects : [];
}

async function buscarPais(nombre) {
  const url = `${API}?q=${encodeURIComponent(nombre)}&response_fields=${CAMPOS}&limit=20`;
  const paises = await pedir(url);
  if (paises.length === 0) {
    throw new Error("No se encontró ningún país con ese nombre.");
  }
  return paises;
}

async function buscarRegion(region) {
  const TAM = 50;
  const todos = [];
  for (let offset = 0; offset < 300; offset += TAM) {
    const url = `${API}?region=${encodeURIComponent(region)}&response_fields=${CAMPOS}&limit=${TAM}&offset=${offset}`;
    const pagina = await pedir(url);
    todos.push(...pagina);
    if (pagina.length < TAM) break;
  }
  if (todos.length === 0) {
    throw new Error("No se encontraron países en esa región.");
  }
  return todos;
}

function mostrarPaises(paises) {
  const contenedor = document.getElementById("resultados");
  contenedor.innerHTML = "";
  paises.forEach(pais => {
    const capital = pais.capitals && pais.capitals.length > 0 ? pais.capitals[0].name : "Sin capital";
    const bandera = pais.flag && pais.flag.url_svg ? pais.flag.url_svg : "";
    const tarjeta = document.createElement("article");
    tarjeta.className = "tarjeta";
    tarjeta.innerHTML = `
      <img src="${bandera}" alt="Bandera de ${pais.names.common}">
      <h3>${pais.names.common}</h3>
      <p><b>Capital:</b> ${capital}</p>
      <p><b>Región:</b> ${pais.region}</p>
      <p><b>Población:</b> ${pais.population.toLocaleString("es-MX")}</p>
    `;
    contenedor.appendChild(tarjeta);
  });
}

const form = document.getElementById("formBuscar");
const mensaje = document.getElementById("mensaje");
const selRegion = document.getElementById("selRegion");
const selOrden = document.getElementById("selOrden");

let paisesActuales = [];

function actualizarVista() {
  const lista = [...paisesActuales];
  if (selOrden.value === "poblacion") {
    lista.sort((a, b) => b.population - a.population);
  } else {
    lista.sort((a, b) => a.names.common.localeCompare(b.names.common));
  }
  mostrarPaises(lista);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  selRegion.value = "";
  const nombre = document.getElementById("txtPais").value.trim();
  mensaje.textContent = "Cargando...";
  try {
    paisesActuales = await buscarPais(nombre);
    actualizarVista();
    mensaje.textContent = `${paisesActuales.length} resultado(s)`;
  } catch (error) {
    paisesActuales = [];
    document.getElementById("resultados").innerHTML = "";
    mensaje.textContent = error.message;
  }
});

selRegion.addEventListener("change", async () => {
  const region = selRegion.value;
  if (!region) return;
  document.getElementById("txtPais").value = "";
  mensaje.textContent = "Cargando...";
  try {
    paisesActuales = await buscarRegion(region);
    actualizarVista();
    mensaje.textContent = `${paisesActuales.length} país(es) en la región`;
  } catch (error) {
    paisesActuales = [];
    document.getElementById("resultados").innerHTML = "";
    mensaje.textContent = error.message;
  }
});

selOrden.addEventListener("change", actualizarVista);