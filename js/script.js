import { Producto, ProductoFisico, ProductoDigital } from './productos.js';
import { finalizarCompra } from './checkout.js';

class Carrito {
  constructor() {
    const carritoGuardado = localStorage.getItem('carrito'); //persistencia de datos de manera local (cerrar ventana/cargar página)
    this.items = carritoGuardado ? JSON.parse(carritoGuardado) : [];
    this.mostrarCarrito();
    this.actualizarContador();
  }

  agregarProducto(id) {
    const producto = productos.find((prod) => prod.id === id);
    if (!producto) return;

    const itemEncontrado = this.items.find(
      (item) => item.producto.id === producto.id
    );
    if (itemEncontrado) {
      itemEncontrado.cantidad++;
    } else {
      this.items.push({ producto, cantidad: 1 });
    }

    this.guardarCarrito();
    this.mostrarCarrito();
    this.actualizarContador();
  }

  actualizarContador() {
    const contador = document.querySelector('.icon-cart span');
    contador.textContent = this.items.reduce(
      (total, item) => total + item.cantidad,
      0
    );
  }

  eliminarProducto(id) {
    this.items = this.items.filter((item) => item.producto.id !== id);
    this.guardarCarrito();
    this.mostrarCarrito();
    this.actualizarContador();
  }

  calcularTotal() {
    return this.items.reduce(
      (total, item) => total + item.producto.precio * item.cantidad,
      0
    );
  }

  mostrarCarrito() {
    const carritoDiv = document.querySelector('.list-cart');

    // Verifica si el carrito tiene productos
    if (this.items.length === 0) {
      carritoDiv.innerHTML =
        '<p class="carrito-vacio">El carrito está vacío</p>';
    } else {
      carritoDiv.innerHTML = '';

      this.items.forEach((item) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item';
        itemDiv.innerHTML = `
        <div class="image"><img src="${item.producto.imagen}" alt="${
          item.producto.nombre
        }"></div>
        <div class="name">${item.producto.nombre}</div>
        <div class="total-price">$${item.producto.precio}</div>
        <div class="quantity">
             <button class="minus" ${
               item.cantidad === 1 ? 'disabled' : ''
             }>-</button>
        <span>${item.cantidad}</span>
        <button class="plus">+</button>
        </div>
        <div class="delete-product">X</div>`;
        carritoDiv.appendChild(itemDiv);
      });

      document.getElementById(
        'total'
      ).textContent = `Total: $${this.calcularTotal().toFixed(2)}`;
    }

    // Escuchadores de eventos para los botones plus y minus
    carritoDiv.querySelectorAll('.plus').forEach((button, index) => {
      button.addEventListener('click', () => {
        const item = this.items[index];
        this.agregarProducto(item.producto.id);
      });
    });

    carritoDiv.querySelectorAll('.minus').forEach((button, index) => {
      button.addEventListener('click', () => {
        const item = this.items[index]; // Obtiene el item correspondiente

        if (item.cantidad > 1) {
          item.cantidad--;

          this.guardarCarrito(); // Guarda cambios en localStorage
          this.mostrarCarrito(); // Vuelve a renderizar el carrito
          this.actualizarContador(); // Actualiza el contador del carrito
        }
      });
    });

    // Escuchador de evento para el botón de eliminación
    carritoDiv.querySelectorAll('.delete-product').forEach((button, index) => {
      button.addEventListener('click', () => {
        const item = this.items[index];
        this.eliminarProducto(item.producto.id);
      });
    });
  }

  guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(this.items));
  }
}

export let carrito;
let productos = [];

document.addEventListener('DOMContentLoaded', function () {
  carrito = new Carrito();

  if (document.body.classList.contains('tienda')) {
    cargarProductos();
  }

  cargarmenuHamburguesa();

  // Escuchador de evento para el botón de búsqueda
  document
    .querySelector('.search-button')
    .addEventListener('click', buscarProductos);

  // Escuchador de evento para el campo de búsqueda al presionar Enter
  document.querySelector('.search-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      buscarProductos();
    }
  });

  let currentPage = 1;
  const productsPerPage = 6;

  async function cargarProductos() {
    const productosDiv = document.getElementById('productos');
    if (!productosDiv) return;
    try {
      const response = await fetch('bd.json');
      const data = await response.json();

      productos = data.map((prod) => {
        if (prod.tipo === 'fisico') {
          return new ProductoFisico(
            prod.id,
            prod.nombre,
            prod.descripcion,
            prod.estrellas,
            prod.precio,
            prod.imagen,
            prod.tipo,
            prod.material,
            prod.tipoMadera,
            prod.color,
            prod.reforzada,
            prod.tapizada
          );
        } else {
          return new ProductoDigital(
            prod.id,
            prod.nombre,
            prod.descripcion,
            prod.estrellas,
            prod.precio,
            prod.imagen,
            prod.tipo,
            prod.formato,
            prod.peso,
            prod.urlDescarga
          );
        }
      });
      mostrarProductos(productos);
      actualizarPaginacion();
    } catch (error) {
      console.error('Error al cargar productos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al cargar productos',
        text: 'No se pudo cargar la lista de productos. Intenta de nuevo más tarde.',
        customClass: {
          confirmButton: 'btn-ok',
        },
      });
    }
  }

  function mostrarProductos(productosParaMostrar = productos) {
    const productosDiv = document.getElementById('productos');
    productosDiv.innerHTML = '';

    // Calcular el índice de los productos para la página actual
    const start = (currentPage - 1) * productsPerPage;
    const end = start + productsPerPage;
    const productosPagina = productosParaMostrar.slice(start, end);

    productosPagina.forEach((producto) => {
      const productCard = document.createElement('div');
      productCard.className = 'product-card';

      productCard.innerHTML = `
        <img src="${producto.imagen}" alt="${producto.nombre}">
         
        <div class="product-info">
          <h2>${producto.nombre}</h2>
          <p class="description">${producto.descripcion}</p>         
          <img class="estrellas" src="${producto.estrellas}" alt="Imagen-estrellas">
          <p class="price">$${producto.precio}</p>
          <button class="add-product" data-id="${producto.id}">Agregar al carrito</button>
        </div>
      `;
      productosDiv.appendChild(productCard);
    });

    // Escuchadores para los botones de agregar al carrito
    document.querySelectorAll('.add-product').forEach((button) => {
      button.addEventListener('click', (e) => {
        const id = parseInt(e.target.getAttribute('data-id'), 10);
        carrito.agregarProducto(id);
      });
    });

    actualizarPaginacion();
  }

  // Mostrar y ocultar el carrito
  document.querySelector('.icon-cart').addEventListener('click', () => {
    document.getElementById('carrito').classList.toggle('show');
    document.getElementById('overlay').classList.toggle('show-overlay');
  });

  document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('carrito').classList.remove('show');
    document.getElementById('overlay').classList.remove('show-overlay');
  });

  // Cierra el carrito al hacer clic fuera del carrito (en el overlay)
  document.getElementById('overlay').addEventListener('click', () => {
    document.getElementById('carrito').classList.remove('show');
    document.getElementById('overlay').classList.remove('show-overlay');
  });

  // Método para vaciar el carrito
  function vaciarCarrito() {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¡No podrás deshacer esta acción!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, vaciar carrito',
      cancelButtonText: 'Cancelar',
      customClass: {
        confirmButton: 'btn-confirm',
        cancelButton: 'btn-cancel',
      },
    }).then((result) => {
      if (result.isConfirmed) {
        carrito.items = [];
        carrito.guardarCarrito();
        carrito.mostrarCarrito();
        carrito.actualizarContador();

        Swal.fire({
          title: '¡Vaciado!',
          text: 'El carrito ha sido vaciado.',
          icon: 'success',
          confirmButtonText: 'Ok',
          customClass: {
            confirmButton: 'btn-ok',
          },
        }).then(() => {
          // Cierra el carrito y el overlay después de que el usuario presiona "Ok"
          document.getElementById('carrito').classList.remove('show');
          document.getElementById('overlay').classList.remove('show-overlay');
        });
      }
    });
  }

  // Escuchador para el botón: Vaciar el carrito
  document
    .querySelector('.clear-cart')
    .addEventListener('click', vaciarCarrito);

  // Función para actualizar la paginación
  function actualizarPaginacion() {
    const totalPages = Math.ceil(productos.length / productsPerPage);
    document.getElementById(
      'page-info'
    ).textContent = `${currentPage} de ${totalPages}`;

    // Deshabilitar o habilitar botones de paginación
    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages;
    document.getElementById('first-page').disabled = currentPage === 1;
    document.getElementById('last-page').disabled = currentPage === totalPages;
  }

  // Controladores de eventos para los botones de paginación
  const prevPage = document.getElementById('prev-page');
  if (prevPage) {
    prevPage.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        mostrarProductos();
        actualizarPaginacion();
      }
    });
  }

  const nextPage = document.getElementById('next-page');
  if (nextPage) {
    nextPage.addEventListener('click', () => {
      const totalPages = Math.ceil(productos.length / productsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        mostrarProductos();
        actualizarPaginacion();
      }
    });
  }

  const firstPage = document.getElementById('first-page');
  if (firstPage) {
    firstPage.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage = 1;
        mostrarProductos();
        actualizarPaginacion();
      }
    });
  }

  const lastPage = document.getElementById('last-page');
  if (lastPage) {
    lastPage.addEventListener('click', () => {
      const totalPages = Math.ceil(productos.length / productsPerPage);
      if (currentPage < totalPages) {
        currentPage = totalPages;
        mostrarProductos();
        actualizarPaginacion();
      }
    });
  }

  //Buscador de productos
  function buscarProductos() {
    const productoBuscado = document
      .querySelector('.search-input')
      .value.toLowerCase();
    const volverBusquedaBtn = document.getElementById('volver-busqueda');
    const mensajeNoEncontrado = document.getElementById(
      'mensaje-no-encontrado'
    );

    //Filtra los productos en funcion del producto buscado
    const productosFiltrados = productos.filter(
      (producto) =>
        producto.nombre.toLowerCase().includes(productoBuscado) ||
        producto.descripcion.toLowerCase().includes(productoBuscado)
    );

    // Mostrar el botón "Volver" solo si hay un término de búsqueda activo
    volverBusquedaBtn.style.display = productoBuscado ? 'inline-block' : 'none';

    // Mostrar mensaje si no se encuentran productos
    mensajeNoEncontrado.style.display =
      productosFiltrados.length === 0 ? 'block' : 'none';

    currentPage = 1; // Resetear a la primera página
    mostrarProductos(productosFiltrados);
  }

  // Funcionalidad del botón volver
  document.getElementById('volver-busqueda').addEventListener('click', () => {
    document.querySelector('.search-input').value = '';
    // currentPage = 1;
    mostrarProductos(productos);
    document.getElementById('volver-busqueda').style.display = 'none';
  });

  // Slider
  const slider = document.getElementById('slider'); //contenedor que engloba las imagenes
  if (slider) {
    const btnLeft = document.querySelector('.btn-left');
    const btnRight = document.querySelector('.btn-right');
    const sliderSection = document.querySelectorAll('.slider-section'); //toma todos los elementos que tengan la clase slider-section

    // Escuchadores para los botones left y right (para realizar el movimiento al presionar los botones)
    if (btnLeft) {
      btnLeft.addEventListener('click', (e) => moveToLeft());
    }

    if (btnRight) {
      btnRight.addEventListener('click', (e) => moveToRight());
    }

    // Set Interval permite realizar una función (moveToRight()) luego de x tiempo (segundos) -
    // para que realice el movimiento en forma automática
    setInterval(() => {
      moveToRight();
    }, 3000); // 3s

    let operacion = 0; // acumulador
    let counter = 0;
    let withImg = 100 / sliderSection.length;

    function moveToRight() {
      if (!slider) {
        console.error('El elemento #slider no existe en el DOM.');
        return;
      }

      if (counter >= sliderSection.length - 1) {
        counter = 0;
        operacion = 0;
        slider.style.transform = `translate(-${operacion}%)`;
        slider.style.transition = 'none';
        return;
      }
      counter++; // se ejecuta cada vez que le doy click al botón derecho
      operacion = operacion + withImg;
      slider.style.transform = `translate(-${operacion}%)`;
      slider.style.transition = 'All .6s ease';
    }

    function moveToLeft() {
      counter--;
      if (counter < 0) {
        counter = sliderSection.length - 1; // el contador tiene el valor de la cantidad de imágenes
        operacion = withImg * (sliderSection.length - 1); // me trae la última posición
        slider.style.transform = `translate(-${operacion}%)`;
        slider.style.transition = 'none';
        return;
      }
      operacion = operacion - withImg;
      slider.style.transform = `translate(-${operacion}%)`;
      slider.style.transition = 'All .6s ease';
    }
  }

  // Escuchador de evento para el botón "Finalizar compra"
  document
    .querySelector('.checkOut')
    .addEventListener('click', finalizarCompra);

  function cargarmenuHamburguesa() {
    // Menú hamburguesa
    // Selección de elementos
    const abrirMenu = document.getElementById('abrir'); // botón menu hamburguesa
    const cerrarMenu = document.getElementById('cerrar'); // botón x
    const nav = document.getElementById('nav');

    // Evento para abrir el menú hamburguesa
    if (abrirMenu && cerrarMenu && nav) {
      abrirMenu.addEventListener('click', () => {
        nav.classList.add('active');
        abrirMenu.style.display = 'none';
        cerrarMenu.style.display = 'block';
      });

      // Evento para cerrar el menú hamburguesa
      cerrarMenu.addEventListener('click', () => {
        nav.classList.remove('active');
        abrirMenu.style.display = 'block';
        cerrarMenu.style.display = 'none';
      });
    }
  }

  // Inicializar la carga de productos al cargar la página
  cargarProductos();
});
