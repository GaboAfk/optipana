# OptiPana

<img src="public/logo-optipana.png" alt="OptiPana" width="256" />

Tienda web de lentes y montajes ópticas con catálogo interactivo, panel de prueba virtual (try-on) y ofertas promocionales.

Construido con Next.js 16, React 19, Tailwind CSS 4 y Framer Motion.

## Características

- **Catálogo de productos** con filtros por categoría y género, efecto hover con imagen alternativa y tarjetas alineadas.
- **Panel de prueba virtual (Try-On)** que permite subir una foto o usar la cámara para previsualizar lentes sobre el rostro, con recorte, zoom (rueda o pinch con dos dedos) y guardado automático en `localStorage`.
- **Ofertas promocionales** con countdown, financiamiento Cashea y precios destacados, todo con alineación inferior consistente.
- **Fondo ambiental WebGL** (Portal Field) con shaders personalizados.
- **Diseño responsive** con comportamientos táctiles específicos para mobile (drag-to-close, pinch-to-zoom, hover táctil).

## Try-On Virtual (IA)

El panel de prueba virtual usa **[Puter.js](https://puter.com)** — un servicio que da acceso gratuito a modelos de IA generativa de imagen (Gemini, GPT Image, etc.) sin necesidad de API keys ni servidor backend.

### ¿Cómo funciona?

El flujo es: **foto del usuario + prompt + imagen del lente del catálogo = resultado**

1. **Foto del usuario**: el usuario sube una imagen o toma una foto con la cámara. Se recorta a 320×320px centrada en el rostro.
2. **Imagen del lente**: se carga la imagen del producto desde el catálogo (`product.img` o `product.hoverImg`) y se convierte a base64.
3. **Prompt**: se construye un prompt detallado en inglés que instruye al modelo a colocar los lentes del catálogo sobre el rostro del usuario, preservando identidad, tono de piel, expresión, iluminación y fondo.
4. **Generación**: se llama a `puter.ai.txt2img()` con el prompt y las dos imágenes (rostro + lente). El modelo devuelve una imagen fotorrealista de la persona usando los lentes.

### Modelos disponibles

| ID | Nombre |
|----|--------|
| `google/gemini-2.5-flash-image` | Gemini 2.5 Flash Image (por defecto) |
| `google/gemini-3.1-flash-image-preview` | Nano Banana 2 |
| `gemini-3-pro-image-preview` | Nano Banana Pro |
| `gpt-image-2` | GPT Image 2 |

### Requisitos de Puter.js

- El script se carga desde `https://js.puter.com/v2/` en el `<head>` del layout.
- **No requiere API key**: Puter gestiona la autenticación del lado del cliente.
- **Cuenta gratuita**: los usuarios finales pueden crear una cuenta gratuita en [puter.com](https://puter.com) para obtener créditos de uso. La primera vez que se usa el try-on, Puter abre un popup de login si el usuario no tiene sesión activa.
- **Sin backend**: toda la generación ocurre en el navegador mediante el SDK de Puter.

## Requisitos

- Node.js 18.18+ (recomendado 20+)
- npm 10+

## Instalación

```bash
git clone https://github.com/GaboAfk/optipana.git
cd optipana
npm install
```

## Desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

## Build de producción

```bash
npm run build
npm start
```

El servidor de producción arranca en `http://localhost:3000`.

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Servidor de desarrollo con Turbopack |
| `npm run build` | Build de producción |
| `npm start` | Servidor de producción |
| `npm run lint` | Linter (ESLint) |

## Estructura del proyecto

```
src/
├── app/                  # Layout y página principal (App Router)
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/           # Componentes de UI
│   ├── Catalog.tsx       # Catálogo con filtros y tarjetas de producto
│   ├── TryOnPanel.tsx    # Panel de prueba virtual con cámara y recorte
│   ├── Offers.tsx        # Cards de ofertas (2x1, Cashea, precios)
│   ├── Header.tsx        # Navegación
│   ├── Hero.tsx          # Sección principal
│   ├── About.tsx         # Sección "nosotros"
│   ├── Services.tsx      # Sección de servicios
│   ├── Jornadas.tsx      # Jornadas promocionales
│   ├── Locations.tsx     # Locales físicos
│   ├── Testimonials.tsx  # Testimonios
│   ├── VideoCarousel.tsx # Carrusel de videos
│   ├── Footer.tsx        # Pie de página
│   └── ...
├── data/
│   └── products.ts       # Catálogo de productos
└── effects/
    └── portal-field/     # Efectos WebGL de fondo
public/
├── glasses_catalog/      # Imágenes de productos
├── hero_reel/            # Videos del hero
└── walking-guy-cashea.gif # GIF de Cashea
```

## Tecnologías

- [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- [React 19](https://react.dev)
- [Tailwind CSS 4](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/)
- [TypeScript](https://www.typescriptlang.org/)

## Despliegue

### Vercel (recomendado)

1. Sube el repositorio a GitHub/GitLab/Bitbucket.
2. Importa el proyecto en [vercel.com/new](https://vercel.com/new).
3. Vercel detecta Next.js automáticamente. No requiere configuración adicional.

### Otro hosting (VPS, Docker, etc.)

```bash
npm run build
npm start
```

Asegúrate de que el servidor escuche en el puerto correcto y de que haya un reverse proxy (nginx, Caddy) con HTTPS delante, ya que la función de cámara requiere contexto seguro.
