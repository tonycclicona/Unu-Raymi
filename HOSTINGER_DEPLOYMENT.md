# 🚀 GUÍA DE DESPLIEGUE EN HOSTINGER WEB HOSTING (VIA GITHUB)

Esta guía documenta el procedimiento oficial para desplegar el proyecto **Unu-Raymi** en una suscripción de **Hostinger Business Web Hosting** conectada a **GitHub** para el dominio **`unu-raymi.com`**.

---

## 🏛️ ARQUITECTURA DE DESPLIEGUE

El proyecto está diseñado como un **Monorepo** con 3 aplicaciones independientes ejecutadas sobre la misma estructura de archivos a través del despachador unificado `server.js`:

| Sub-Aplicación | Subdominio u Origen | Variable `APP_TYPE` | Archivo de Inicio |
| :--- | :--- | :--- | :--- |
| **Frontend** | `https://unu-raymi.com` | `frontend` | `server.js` |
| **Admin** | `https://admin.unu-raymi.com` | `admin` | `server.js` |
| **Backend API** | `https://api.unu-raymi.com` | `backend` | `server.js` |

---

## 🛠️ PASO 1: BASE DE DATOS MYSQL EN HOSTINGER

1. Inicia sesión en **Hostinger hPanel**.
2. Ve a **Bases de Datos > Bases de datos MySQL**.
3. Crea una nueva base de datos y un usuario:
   - **Nombre de base de datos**: `u209525223_unu_db` (o el prefijo que asigne Hostinger)
   - **Usuario MySQL**: `u209525223_unuraym1`
   - **Contraseña**: *(guarda esta contraseña en un lugar seguro)*
4. Toma nota de la cadena de conexión completa:
   ```env
   DATABASE_URL="mysql://u209525223_unuraym1:TU_PASSWORD@localhost:3306/u209525223_unu_db"
   ```

---

## 🌐 PASO 2: CREACIÓN DE SUBDOMINIOS

En **hPanel > Dominios > Subdominios**, crea los dos subdominios requeridos:
- `admin` (apuntará a `admin.unu-raymi.com`)
- `api` (apuntará a `api.unu-raymi.com`)

Asegúrate de que los certificados SSL (Let's Encrypt o SSL Gratis de Hostinger) estén activos para el dominio principal y los dos subdominios.

---

## 🐙 PASO 3: CONECTAR GITHUB CON HOSTINGER

1. En hPanel, ve a **Avanzado > Git**.
2. Haz clic en **Crear un nuevo repositorio**.
3. Llena la información:
   - **Repositorio**: `https://github.com/tu-usuario/Unu-Raymi.git`
   - **Rama**: `main`
   - **Directorio de destino**: `/public_html` (o la carpeta asignada)
4. Configura el **Auto-Deploy Webhook** copiando la URL suministrada por Hostinger e ingresándola en GitHub (`Settings > Webhooks > Add webhook` en tu repositorio).

---

## ⚙️ PASO 4: CONFIGURAR APLICACIONES NODE.JS EN HOSTINGER

En hPanel, ve a **Sitios Web > Aplicaciones Node.js** (o Sección Node.js de cPanel):

### 1. Configurar Backend (`api.unu-raymi.com`)
- **Dominio**: `api.unu-raymi.com`
- **Versión Node.js**: `20.x` (o superior)
- **Directorio de la aplicación**: `/public_html`
- **Archivo de inicio**: `server.js`
- **Variables de Entorno**:
  - `APP_TYPE` = `backend`
  - `NODE_ENV` = `production`
  - `DATABASE_URL` = `mysql://usuario:password@localhost:3306/base_datos`
  - `ALLOWED_ORIGINS` = `https://unu-raymi.com,https://admin.unu-raymi.com`
  - `API_BASE_URL` = `https://api.unu-raymi.com`
  - `JWT_SECRET` = `tu_jwt_secret_seguro_aqui`
  - `ADMIN_USER` = `admin`
  - `ADMIN_PASS` = `TuPasswordAdminSeguro!`

### 2. Configurar Admin (`admin.unu-raymi.com`)
- **Dominio**: `admin.unu-raymi.com`
- **Versión Node.js**: `20.x`
- **Directorio de la aplicación**: `/public_html`
- **Archivo de inicio**: `server.js`
- **Variables de Entorno**:
  - `APP_TYPE` = `admin`
  - `NODE_ENV` = `production`
  - `NEXT_PUBLIC_API_URL` = `https://api.unu-raymi.com/api`

### 3. Configurar Frontend (`unu-raymi.com`)
- **Dominio**: `unu-raymi.com`
- **Versión Node.js**: `20.x`
- **Directorio de la aplicación**: `/public_html`
- **Archivo de inicio**: `server.js`
- **Variables de Entorno**:
  - `APP_TYPE` = `frontend`
  - `NODE_ENV` = `production`
  - `NEXT_PUBLIC_API_URL` = `https://api.unu-raymi.com/api`

---

## 🗄️ PASO 5: MIGRAR LA BASE DE DATOS CON PRISMA

Accede por SSH a tu servidor Hostinger (o a través del Terminal en hPanel):

```bash
# Navegar al directorio del proyecto
cd public_html

# Instalar dependencias si no se ejecutó automáticamente
npm install

# Navegar a la carpeta backend y sincronizar la base de datos MySQL
cd backend
npx prisma db push

# (Opcional) Poblar la base de datos con tours y atractivos GIS iniciales
node prisma/seedGisData.js
```

---

## 🔍 PASO 6: VERIFICACIÓN FINAL

1. **API Health check**:
   Abre en el navegador: `https://api.unu-raymi.com/api/health`
   Debe responder: `{ "success": true, "message": "Unu-Raymi API está funcionando correctamente." }`

2. **Panel Admin**:
   Abre: `https://admin.unu-raymi.com` e inicia sesión con las credenciales configuradas.

3. **Portal Web**:
   Navega en `https://unu-raymi.com` y comprueba la carga de tours, mapa interactivo y reserva.

---

¡Felicidades! Tu proyecto **Unu-Raymi** está completamente desplegado y optimizado en Hostinger.
