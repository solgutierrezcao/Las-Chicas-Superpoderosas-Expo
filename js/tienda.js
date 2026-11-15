const Productos = [
    {
        id: 1,
        nombre: "Peluche de Bombón",
        categoria: "peluches",
        precio: 12500,
        imagen: "Assets/Productos/PelucheBombon.png",
        etiqueta: "Favorito"
    },
    {
        id: 2,
        nombre: "Taza de Burbuja",
        categoria: "decoracion",
        precio: 8500,
        imagen: "Assets/Productos/TazaBurbuja.png",
        etiqueta: "Nuevo"
    },
    {
        id: 3,
        nombre: "Remera Powerpuff",
        categoria: "ropa",
        precio: 18000,
        imagen: "Assets/Productos/Remera.png",
        etiqueta: "Popular"
    },
    {
        id: 4,
        nombre: "Pack de stickers",
        categoria: "accesorios",
        precio: 4500,
        imagen: "Assets/Productos/Stickers.png",
        etiqueta: "Oferta"
    }
];

let Carrito = JSON.parse(localStorage.getItem("powerpuffCarrito")) || [];

let CategoriaActual = "todos";
let TextoBusqueda = "";
let OrdenActual = "default";

const Catalogo = document.getElementById("catalogoProductos");
const Buscador = document.getElementById("buscarProducto");
const Ordenar = document.getElementById("ordenarProductos");
const SinResultados = document.getElementById("sinResultados");

const PanelCarrito = document.getElementById("carritoPanel");
const FondoCarrito = document.getElementById("fondoCarrito");
const ProductosCarrito = document.getElementById("carritoProductos");
const TotalCarrito = document.getElementById("carritoTotal");
const ContadorCarrito = document.getElementById("contadorCarrito");

function FormatearPrecio(Precio) {
    return Precio.toLocaleString("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0
    });
}

function MostrarProductos() {

    let Lista = [...Productos];

    if (CategoriaActual !== "todos") {
        Lista = Lista.filter(
            Producto => Producto.categoria === CategoriaActual
        );
    }

    if (TextoBusqueda.trim() !== "") {
        Lista = Lista.filter(Producto =>
            Producto.nombre.toLowerCase().includes(TextoBusqueda.toLowerCase())
        );
    }

    if (OrdenActual === "menor") {
        Lista.sort((a, b) => a.precio - b.precio);
    }

    if (OrdenActual === "mayor") {
        Lista.sort((a, b) => b.precio - a.precio);
    }

    if (OrdenActual === "nombre") {
        Lista.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

    Catalogo.innerHTML = "";

    SinResultados.hidden = Lista.length > 0;

    Lista.forEach(Producto => {

        const Tarjeta = document.createElement("article");
        Tarjeta.className = "producto-card";

        Tarjeta.innerHTML = `
            <div class="producto-imagen">
                <span class="producto-etiqueta">${Producto.etiqueta}</span>
                <img src="${Producto.imagen}"
                     alt="${Producto.nombre}"
                     onerror="this.style.display='none'">
            </div>

            <div class="producto-info">
                <span class="producto-categoria">${Producto.categoria}</span>
                <h3>${Producto.nombre}</h3>
                <p class="producto-precio">${FormatearPrecio(Producto.precio)}</p>

                <button class="boton-agregar" data-id="${Producto.id}">
                    <i class="bi bi-bag-plus"></i>
                    Agregar al carrito
                </button>
            </div>
        `;

        Catalogo.appendChild(Tarjeta);
    });

    Catalogo.querySelectorAll(".boton-agregar").forEach(Boton => {
        Boton.addEventListener("click", () => {
            AgregarAlCarrito(Number(Boton.dataset.id));
        });
    });
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
    MostrarCarrito();
    MostrarMensaje(`${Producto.nombre} agregado al carrito ♡`);
}

function GuardarCarrito() {
    localStorage.setItem("powerpuffCarrito", JSON.stringify(Carrito));
    ActualizarContador();
}

function ActualizarContador() {

    const Cantidad = Carrito.reduce(
        (Total, Producto) => Total + Producto.cantidad,
        0
    );

    ContadorCarrito.textContent = Cantidad;
}

function MostrarCarrito() {

    ProductosCarrito.innerHTML = "";

    if (Carrito.length === 0) {
        ProductosCarrito.innerHTML = `
            <p class="carrito-vacio">
                Todavía no agregaste productos ♡
            </p>
        `;
    }

    let Total = 0;

    Carrito.forEach(Producto => {

        Total += Producto.precio * Producto.cantidad;

        const Item = document.createElement("div");
        Item.className = "carrito-item";

        Item.innerHTML = `
            <img src="${Producto.imagen}" alt="${Producto.nombre}"
                 onerror="this.style.display='none'">

            <div class="carrito-item-info">
                <h4>${Producto.nombre}</h4>
                <p>${FormatearPrecio(Producto.precio * Producto.cantidad)}</p>

                <div class="carrito-cantidad">
                    <button data-accion="restar" data-id="${Producto.id}">−</button>
                    <span>${Producto.cantidad}</span>
                    <button data-accion="sumar" data-id="${Producto.id}">+</button>
                </div>
            </div>

            <button class="eliminar-producto"
                    data-accion="eliminar"
                    data-id="${Producto.id}"
                    aria-label="Eliminar producto">
                <i class="bi bi-trash"></i>
            </button>
        `;

        ProductosCarrito.appendChild(Item);
    });

    TotalCarrito.textContent = FormatearPrecio(Total);

    ProductosCarrito.querySelectorAll("[data-accion]").forEach(Boton => {
        Boton.addEventListener("click", () => {
            ModificarCarrito(
                Number(Boton.dataset.id),
                Boton.dataset.accion
            );
        });
    });

    ActualizarContador();
}

function ModificarCarrito(ID, Accion) {

    const Producto = Carrito.find(P => P.id === ID);

    if (!Producto) return;

    if (Accion === "sumar") {
        Producto.cantidad++;
    }

    if (Accion === "restar") {
        Producto.cantidad--;

        if (Producto.cantidad <= 0) {
            Carrito = Carrito.filter(P => P.id !== ID);
        }
    }

    if (Accion === "eliminar") {
        Carrito = Carrito.filter(P => P.id !== ID);
    }

    GuardarCarrito();
    MostrarCarrito();
}

function AbrirCarrito() {
    PanelCarrito.classList.add("abierto");
    FondoCarrito.classList.add("abierto");
    document.body.style.overflow = "hidden";
}

function CerrarCarrito() {
    PanelCarrito.classList.remove("abierto");
    FondoCarrito.classList.remove("abierto");
    document.body.style.overflow = "";
}

function MostrarMensaje(Texto) {

    const Mensaje = document.getElementById("mensajeTienda");

    Mensaje.textContent = Texto;
    Mensaje.classList.add("visible");

    clearTimeout(MostrarMensaje.Temporizador);

    MostrarMensaje.Temporizador = setTimeout(() => {
        Mensaje.classList.remove("visible");
    }, 2500);
}

document.querySelectorAll(".filtro").forEach(Boton => {

    Boton.addEventListener("click", () => {

        document.querySelector(".filtro.activo")?.classList.remove("activo");

        Boton.classList.add("activo");

        CategoriaActual = Boton.dataset.categoria;

        MostrarProductos();
    });
});

Buscador.addEventListener("input", () => {
    TextoBusqueda = Buscador.value;
    MostrarProductos();
});


Ordenar.addEventListener("change", () => {
    OrdenActual = Ordenar.value;
    MostrarProductos();
});


document.getElementById("abrirCarrito").addEventListener("click", AbrirCarrito);
document.getElementById("cerrarCarrito").addEventListener("click", CerrarCarrito);
document.getElementById("seguirComprando").addEventListener("click", CerrarCarrito);
FondoCarrito.addEventListener("click", CerrarCarrito);

document.getElementById("finalizarCompra").addEventListener("click", () => {

    if (Carrito.length === 0) {
        MostrarMensaje("Tu carrito está vacío ♡");
        return;
    }

    MostrarMensaje("¡Gracias por tu compra! Esta es una tienda de demostración.");

});


MostrarProductos();
MostrarCarrito();

