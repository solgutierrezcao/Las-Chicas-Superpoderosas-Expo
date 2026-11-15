const Productos = [
    {
        id: 1,
        nombre: "Peluchito de Bombón",
        categoria: "Coleccionables",
        precio: 12500,
        imagen: "Assets/Productos/PelucheBombon.png",
        etiqueta: "MÁS VENDIDO"
    },
    {
        id: 2,
        nombre: "Taza de Burbuja",
        categoria: "Decoración",
        precio: 8000,
        imagen: "Assets/Productos/TazaBurbuja.png",
        etiqueta: "NUEVO"
    },
    {
        id: 3,
        nombre: "Remera Powerpuff",
        categoria: "Indumentaria",
        precio: 15000,
        imagen: "Assets/Productos/Remera.png",
        etiqueta: "DESTACADO"
    },
    {
        id: 4,
        nombre: "Set de stickers",
        categoria: "Accesorios",
        precio: 4500,
        imagen: "Assets/Productos/Stickers.png",
        etiqueta: "POPULAR"
    }
];


let Carrito = JSON.parse(localStorage.getItem("powerpuffCarrito")) || [];

function FormatearPrecio(Precio) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0
    }).format(Precio);
}


function MostrarProductos() {

    const Contenedor = document.getElementById("productosDestacados");

    if (!Contenedor) return;

    Contenedor.innerHTML = Productos.map(Producto => `

        <article class="producto-card">

            <div class="producto-imagen">

                <span class="producto-etiqueta">
                    ${Producto.etiqueta}
                </span>

                <img
                    src="${Producto.imagen}"
                    alt="${Producto.nombre}"
                    onerror="this.style.opacity='0.15'"
                >

            </div>

            <div class="producto-info">

                <span class="producto-categoria">
                    ${Producto.categoria}
                </span>

                <h3>${Producto.nombre}</h3>

                <p class="producto-precio">
                    ${FormatearPrecio(Producto.precio)}
                </p>

                <button
                    class="btn-producto"
                    onclick="AgregarAlCarrito(${Producto.id})"
                >
                    <i class="fa-solid fa-bag-shopping"></i>
                    AGREGAR AL CARRITO
                </button>

            </div>

        </article>

    `).join("");

}


function AgregarAlCarrito(ID) {

    const Producto = Productos.find(P => P.id === ID);

    if (!Producto) return;

    const Existente = Carrito.find(P => P.id === ID);

    if (Existente) {
        Existente.cantidad++;
    } else {
        Carrito.push({
            ...Producto,
            cantidad: 1
        });
    }

    GuardarCarrito();

    MostrarMensaje(`${Producto.nombre} se agregó al carrito ♡`);

}


function GuardarCarrito() {

    localStorage.setItem(
        "powerpuffCarrito",
        JSON.stringify(Carrito)
    );

    ActualizarContador();

}

function ActualizarContador() {

    const Contador = document.getElementById("contadorCarrito");

    if (!Contador) return;

    const Cantidad = Carrito.reduce(
        (Total, Producto) => Total + Producto.cantidad,
        0
    );

    Contador.textContent = Cantidad;

}

function MostrarMensaje(Texto) {

    let Mensaje = document.getElementById("mensajePowerpuff");

    if (!Mensaje) {

        Mensaje = document.createElement("div");

        Mensaje.id = "mensajePowerpuff";

        document.body.appendChild(Mensaje);

    }

    Mensaje.textContent = Texto;

    Mensaje.classList.add("mensaje-visible");

    clearTimeout(Mensaje.timeout);

    Mensaje.timeout = setTimeout(() => {
        Mensaje.classList.remove("mensaje-visible");
    }, 2500);

}

function InicializarMenu() {

    const Boton = document.getElementById("menuToggle");
    const Menu = document.getElementById("navLinks");

    if (!Boton || !Menu) return;

    Boton.addEventListener("click", () => {

        Menu.classList.toggle("abierto");

        const Abierto = Menu.classList.contains("abierto");

        Boton.innerHTML = Abierto
            ? '<i class="fa-solid fa-xmark"></i>'
            : '<i class="fa-solid fa-bars"></i>';

    });

}

document.addEventListener("DOMContentLoaded", () => {

    MostrarProductos();

    ActualizarContador();

    InicializarMenu();

});
