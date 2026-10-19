# Microservicio de Catálogo de Autos (RESTful API)

Microservicio web RESTful desarrollado con **Node.js** y **Express** para la gestión y consulta de un catálogo de automóviles. La arquitectura está diseñada bajo principios de bajo acoplamiento, seguridad por diseño y lista para despliegue en entornos de producción en la nube (como [Render.com](https://render.com)).

---

## 🏛️ Arquitectura del Microservicio

El microservicio implementa una arquitectura por capas basada en patrones estándar de la industria:

```
├── server.js           # Núcleo del servicio: configuración, middlewares, rutas y controladores
├── .env.example        # Plantilla segura de variables de entorno (sin credenciales)
├── .gitignore          # Exclusión de archivos confidenciales y dependencias
├── package.json        # Manifiesto de dependencias, scripts y metadatos de Node.js
└── README.md           # Documentación técnica y guía de despliegue
```

### Características de Diseño y Seguridad
- **Ocultamiento de tecnología:** Deshabilitación de la cabecera `X-Powered-By` en Express para evitar técnicas de huella digital (*fingerprinting*).
- **Externalización de la configuración (12-Factor App):** Toda variable crítica o sensible (`PORT`, `API_KEY`) es inyectada mediante variables de entorno a través de `dotenv`.
- **Autenticación por API Key:** Protección de endpoints de escritura mediante el encabezado `X-API-Key`.
- **Validación estricta de esquemas:** Middleware dedicado que evalúa tipos de datos, nulidad, cadenas vacías y rangos numéricos antes de persistir la información.
- **Manejo uniforme de errores:** Respuestas estandarizadas en formato JSON para códigos HTTP 400, 401, 404 y 500, ocultando trazas de ejecución en producción.

---


## 💻 Instalación y Ejecución en Entorno Local

### Prerrequisitos
- [Node.js](https://nodejs.org/) v18.0.0 o superior.
- [npm](https://www.npmjs.com/) (incluido con la instalación de Node.js).

### Pasos de Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/Handz113/microservicio-catalogo-autos
   cd microservicio-catalogo-autos
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar las variables de entorno:**
   Copia el archivo de ejemplo para crear tu entorno local:
   ```bash
   cp .env.example .env
   ```
   Abre `.env` y define tus valores locales (por ejemplo):
   ```env
   PORT=3000
   API_KEY=mi_clave_secreta_local_123
   ```

4. **Iniciar el servidor en modo desarrollo (con recarga automática):**
   ```bash
   npm run dev
   ```

5. **Iniciar en modo estándar / producción:**
   ```bash
   npm start
   ```

El servicio estará escuchando en `http://localhost:3000`.
