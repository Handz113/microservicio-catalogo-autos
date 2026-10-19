require('dotenv').config();
const express = require('express');

const app = express();

// Seguridad: Ocultar la cabecera x-powered-by de Express
app.disable('x-powered-by');

// Middleware para procesar cuerpos en formato JSON
app.use(express.json());

// Puerto definido por variable de entorno o fallback a 3000
const PORT = process.env.PORT || 3000;

/**
 * Catálogo de automóviles en memoria (Colección inicial de 5 vehículos)
 * Cumple estrictamente con el contrato de datos:
 * - id: Number (entero positivo autogenerado)
 * - marca: String (no vacío)
 * - modelo: String (no vacío)
 * - anio: Number (entero entre 1900 y 2027)
 * - precio: Number (flotante/entero mayor a 0)
 * - color: String (no vacío)
 */
let catalogoAutos = [
  {
    id: 1,
    marca: 'Toyota',
    modelo: 'Corolla',
    anio: 2022,
    precio: 24500.0,
    color: 'Blanco'
  },
  {
    id: 2,
    marca: 'Honda',
    modelo: 'Civic',
    anio: 2021,
    precio: 26200.5,
    color: 'Gris'
  },
  {
    id: 3,
    marca: 'Ford',
    modelo: 'Mustang',
    anio: 2023,
    precio: 45000.0,
    color: 'Rojo'
  },
  {
    id: 4,
    marca: 'Chevrolet',
    modelo: 'Onix',
    anio: 2020,
    precio: 15800.0,
    color: 'Azul'
  },
  {
    id: 5,
    marca: 'Mazda',
    modelo: 'Mazda 3',
    anio: 2024,
    precio: 28900.0,
    color: 'Negro'
  }
];

// Contador incremental para autogenerar IDs únicos
let siguienteId = 6;

/**
 * Middleware de Autenticación: autenticarApiKey
 * Verifica la presencia y validez del header X-API-Key contra process.env.API_KEY.
 */
const autenticarApiKey = (req, res, next) => {
  const apiKeyHeader = req.header('X-API-Key');
  const serverApiKey = process.env.API_KEY;

  if (!apiKeyHeader || typeof apiKeyHeader !== 'string' || apiKeyHeader.trim() === '') {
    return res.status(401).json({
      error: 'Unauthorized',
      mensaje: "Acceso no autorizado. El encabezado 'X-API-Key' es requerido y no puede estar vacío."
    });
  }

  if (!serverApiKey || apiKeyHeader.trim() !== serverApiKey.trim()) {
    return res.status(401).json({
      error: 'Unauthorized',
      mensaje: "Acceso no autorizado. La clave provista en 'X-API-Key' es incorrecta."
    });
  }

  next();
};

/**
 * Middleware de Validación: validarEsquemaAuto
 * Valida los tipos de datos y rangos permitidos en el cuerpo (body) de la petición.
 */
const validarEsquemaAuto = (req, res, next) => {
  const { marca, modelo, anio, precio, color } = req.body || {};
  const errores = [];

  // Validación de 'marca'
  if (marca === undefined || marca === null) {
    errores.push("El atributo 'marca' es obligatorio.");
  } else if (typeof marca !== 'string' || marca.trim() === '') {
    errores.push("El atributo 'marca' debe ser una cadena de texto no vacía.");
  }

  // Validación de 'modelo'
  if (modelo === undefined || modelo === null) {
    errores.push("El atributo 'modelo' es obligatorio.");
  } else if (typeof modelo !== 'string' || modelo.trim() === '') {
    errores.push("El atributo 'modelo' debe ser una cadena de texto no vacía.");
  }

  // Validación de 'anio'
  if (anio === undefined || anio === null) {
    errores.push("El atributo 'anio' es obligatorio.");
  } else if (typeof anio !== 'number' || !Number.isInteger(anio) || anio < 1900 || anio > 2027) {
    errores.push("El atributo 'anio' debe ser un número entero entre 1900 y 2027.");
  }

  // Validación de 'precio'
  if (precio === undefined || precio === null) {
    errores.push("El atributo 'precio' es obligatorio.");
  } else if (typeof precio !== 'number' || isNaN(precio) || !isFinite(precio) || precio <= 0) {
    errores.push("El atributo 'precio' debe ser un número mayor a 0 (entero o decimal).");
  }

  // Validación de 'color'
  if (color === undefined || color === null) {
    errores.push("El atributo 'color' es obligatorio.");
  } else if (typeof color !== 'string' || color.trim() === '') {
    errores.push("El atributo 'color' debe ser una cadena de texto no vacía.");
  }

  if (errores.length > 0) {
    return res.status(400).json({
      error: 'Bad Request',
      mensaje: 'Fallo en la validación del esquema del automóvil.',
      detalles: errores
    });
  }

  next();
};

// ============================================================================
// ENDPOINTS
// ============================================================================

/**
 * GET /
 * Health check público y catálogo de rutas disponibles del microservicio.
 */
app.get('/', (req, res) => {
  res.status(200).json({
    estado: 'OK',
    servicio: 'Microservicio de Catálogo de Autos',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    rutas_disponibles: [
      {
        metodo: 'GET',
        ruta: '/',
        descripcion: 'Health check del servicio y listado de rutas disponibles',
        autenticacion_requerida: false
      },
      {
        metodo: 'GET',
        ruta: '/api/autos',
        descripcion: 'Obtener el catálogo completo de autos (permite filtros opcionales: ?marca=X&color=Y)',
        autenticacion_requerida: false
      },
      {
        metodo: 'GET',
        ruta: '/api/autos/:id',
        descripcion: 'Obtener un automóvil específico mediante su ID numérico entero positivo',
        autenticacion_requerida: false
      },
      {
        metodo: 'POST',
        ruta: '/api/autos',
        descripcion: 'Registrar un nuevo automóvil en el catálogo',
        autenticacion_requerida: 'Requiere header X-API-Key'
      }
    ]
  });
});

/**
 * GET /api/autos
 * Público. Retorna 200 OK con el catálogo completo o filtrado por query params.
 * Filtros admitidos: ?marca=X & ?color=Y (búsqueda insensible a mayúsculas/minúsculas).
 */
app.get('/api/autos', (req, res) => {
  const { marca, color } = req.query;
  let autosFiltrados = catalogoAutos;

  if (marca && typeof marca === 'string' && marca.trim() !== '') {
    const filtroMarca = marca.trim().toLowerCase();
    autosFiltrados = autosFiltrados.filter(
      auto => auto.marca.toLowerCase() === filtroMarca
    );
  }

  if (color && typeof color === 'string' && color.trim() !== '') {
    const filtroColor = color.trim().toLowerCase();
    autosFiltrados = autosFiltrados.filter(
      auto => auto.color.toLowerCase() === filtroColor
    );
  }

  res.status(200).json(autosFiltrados);
});

/**
 * GET /api/autos/:id
 * Público. Valida que :id sea un entero positivo (si no, retorna 400).
 * Si no encuentra el auto, retorna 404 Not Found.
 * Si existe, retorna 200 OK con el objeto.
 */
app.get('/api/autos/:id', (req, res) => {
  const { id } = req.params;

  // Validación estricta de entero positivo (sin signos negativos, decimales o caracteres no numéricos)
  const esEnteroPositivo = /^[1-9]\d*$/.test(id);
  if (!esEnteroPositivo) {
    return res.status(400).json({
      error: 'Bad Request',
      mensaje: "El parámetro de ruta ':id' debe ser un número entero positivo mayor a cero."
    });
  }

  const idNumero = parseInt(id, 10);
  const auto = catalogoAutos.find(item => item.id === idNumero);

  if (!auto) {
    return res.status(404).json({
      error: 'Not Found',
      mensaje: `No se encontró ningún automóvil con el ID ${idNumero}.`
    });
  }

  res.status(200).json(auto);
});

/**
 * POST /api/autos
 * Protegido por autenticarApiKey y validarEsquemaAuto.
 * Inserta un nuevo auto en memoria limpiando espacios en blanco con .trim() y retorna 201 Created.
 */
app.post('/api/autos', autenticarApiKey, validarEsquemaAuto, (req, res) => {
  const { marca, modelo, anio, precio, color } = req.body;

  const nuevoAuto = {
    id: siguienteId++,
    marca: marca.trim(),
    modelo: modelo.trim(),
    anio: anio,
    precio: Number(Number(precio).toFixed(2)),
    color: color.trim()
  };

  catalogoAutos.push(nuevoAuto);

  res.status(201).json(nuevoAuto);
});

// ============================================================================
// MANEJO DE ERRORES GLOBALES
// ============================================================================

// Middleware para rutas no encontradas (404 Not Found)
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    mensaje: `La ruta solicitada '${req.method} ${req.originalUrl}' no existe en este servidor.`
  });
});

// Middleware de manejo de errores y excepciones internas (500 Internal Server Error)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Manejo de error de sintaxis si el cliente envía JSON mal formado
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Bad Request',
      mensaje: 'El cuerpo de la petición contiene un formato JSON inválido.'
    });
  }

  // Log interno del error para depuración segura del servidor
  console.error('Error interno no controlado:', err.message);

  const respuestaError = {
    error: 'Internal Server Error',
    mensaje: 'Ha ocurrido un error interno en el servidor.'
  };

  // Solo exponer detalles adicionales fuera del entorno de producción
  if (process.env.NODE_ENV !== 'production') {
    respuestaError.detalle = err.message;
  }

  res.status(500).json(respuestaError);
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log(`Servidor de Catálogo de Autos ejecutándose en el puerto ${PORT}`);
});

module.exports = { app, server };
