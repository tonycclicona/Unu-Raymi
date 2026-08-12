# Modelo de Datos GIS: Módulo MapaSudamerica

Se extienden los modelos de Prisma para dar soporte completo a las entidades geográficas requeridas en el sistema.

## Entidades Prisma (`backend/prisma/schema.prisma`)

```prisma
// 1. Países Operativos
model GisCountry {
  id        Int                     @id @default(autoincrement())
  nombre    String                  @db.VarChar(100)
  isoCode   String                  @unique @db.VarChar(10)
  geometria String?                 @db.LongText // Polígono GeoJSON
  activo    Boolean                 @default(true)
  areas     GisAdministrativeArea[]
  tours     TouristAttraction[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("gis_countries")
}

// 2. Divisiones Político-Administrativas (Región, Provincia, Distrito/Comuna/Municipio)
model GisAdministrativeArea {
  id           Int                     @id @default(autoincrement())
  countryId    Int
  country      GisCountry              @relation(fields: [countryId], references: [id])
  parentId     Int?
  parent       GisAdministrativeArea?  @relation("AdminHierarchy", fields: [parentId], references: [id])
  children     GisAdministrativeArea[] @relation("AdminHierarchy")

  nombre       String                  @db.VarChar(150)
  adminLevel   Int                     // 1: Región/Depto, 2: Provincia, 3: Distrito/Comuna
  adminType    String                  @db.VarChar(50) // "region", "departamento", "provincia", "distrito", "comuna", "municipio"
  geometria    String?                 @db.LongText
  fuente       String?                 @default("OSM/GeoBoundaries") @db.VarChar(100)
  verificado   Boolean                 @default(false)
  verificadoEn DateTime?

  attractions  TouristAttraction[]

  createdAt    DateTime                @default(now())
  updatedAt    DateTime                @updatedAt

  @@map("gis_administrative_areas")
}

// 3. Atractivos Turísticos
model TouristAttraction {
  id                   Int                    @id @default(autoincrement())
  nombre               String                 @db.VarChar(255)
  slug                 String                 @unique @db.VarChar(255)
  descripcion          String                 @db.LongText
  categoria            String                 @db.VarChar(100) // "laguna", "montana", "ruinas", "mirador"
  
  countryId            Int
  country              GisCountry             @relation(fields: [countryId], references: [id])
  administrativeAreaId Int?
  administrativeArea   GisAdministrativeArea? @relation(fields: [administrativeAreaId], references: [id])
  localidad            String?                @db.VarChar(150)

  latitud              Float
  longitud             Float
  geometria            String?                @db.LongText // Point GeoJSON
  altitudMetros        Int
  dificultad           String                 @db.VarChar(50) // "facil", "moderado", "exigente", "extremo"
  duracionDias         Float                  @default(1.0)
  
  estado               String                 @default("verified") @db.VarChar(50) // draft, pending_review, verified, active, archived
  fuente               String?                @default("Agencia Unu-Raymi") @db.VarChar(150)
  verificado           Boolean                @default(true)
  verificadoEn         DateTime?              @default(now())
  creadoPor            String?                @db.VarChar(100)

  rutasRelacionadas    RouteAttraction[]

  createdAt            DateTime               @default(now())
  updatedAt            DateTime               @updatedAt

  @@map("tourist_attractions")
}

// 4. Rutas Turísticas y Expediciones
model GisRoute {
  id               Int                @id @default(autoincrement())
  nombre           String             @db.VarChar(255)
  slug             String             @unique @db.VarChar(255)
  descripcion      String             @db.LongText
  tipoRuta         String             @db.VarChar(50) // "trekking", "transporte", "mixto"
  dificultad       String             @db.VarChar(50)
  duracionDias     Float
  distanciaKm      Float
  altitudMaxMetros Int
  altitudMinMetros Int
  desnivelPositivo Int?
  desnivelNegativo Int?
  
  geometria        String?            @db.LongText // LineString GeoJSON
  gpxFileUrl       String?            @db.VarChar(500)
  geojsonFileUrl   String?            @db.VarChar(500)

  estado           String             @default("active") @db.VarChar(50) // active, temporarily_closed, archived
  verificado       Boolean            @default(true)
  verificadoEn     DateTime?          @default(now())

  segmentos        GisRouteSegment[]
  atractivos       RouteAttraction[]
  puntosInteres    GisRoutePoint[]
  advertencias     GisRouteWarning[]

  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt

  @@map("gis_routes")
}

// 5. Segmentos de Ruta
model GisRouteSegment {
  id               Int      @id @default(autoincrement())
  routeId          Int
  route            GisRoute @relation(fields: [routeId], references: [id], onDelete: Cascade)

  nombre           String   @db.VarChar(255)
  ordenIndex       Int
  puntoInicio      String   @db.VarChar(150)
  puntoFin         String   @db.VarChar(150)
  tipoTransporte   String   @db.VarChar(50) // "bus", "trekking", "bote", "tren"
  distanciaKm      Float
  duracionMinutos  Int
  altitudInicioM   Int
  altitudFinM      Int
  geometria        String?  @db.LongText
  dificultad       String?  @db.VarChar(50)
  advertencias     String?  @db.Text

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@map("gis_route_segments")
}

// 6. Tabla Intermedia: Relación Ruta <-> Atractivos Turísticos
model RouteAttraction {
  routeId      Int
  route        GisRoute          @relation(fields: [routeId], references: [id], onDelete: Cascade)
  attractionId Int
  attraction   TouristAttraction @relation(fields: [attractionId], references: [id], onDelete: Cascade)

  @@id([routeId, attractionId])
  @@map("gis_route_attractions")
}

// 7. Puntos de Interés / Servicios Cercanos (Hospitales, Farmacias, Alojamientos, Restaurantes)
model GisPointOfInterest {
  id            Int             @id @default(autoincrement())
  nombre        String          @db.VarChar(255)
  categoria     String          @db.VarChar(100) // "hospital", "clinica", "farmacia", "restaurante", "alojamiento", "campamento", "mirador", "emergencia"
  latitud       Float
  longitud      Float
  direccion     String?         @db.VarChar(255)
  telefono      String?         @db.VarChar(50)
  horario       String?         @db.VarChar(100)
  fuente        String?         @default("OpenStreetMap") @db.VarChar(100)
  verificado    Boolean         @default(true)
  activo        Boolean         @default(true)

  rutas         GisRoutePoint[]

  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@map("gis_points_of_interest")
}

// 8. Relación Ruta <-> Punto de Interés
model GisRoutePoint {
  id                  Int                @id @default(autoincrement())
  routeId             Int
  route               GisRoute           @relation(fields: [routeId], references: [id], onDelete: Cascade)
  pointOfInterestId   Int
  pointOfInterest     GisPointOfInterest @relation(fields: [pointOfInterestId], references: [id], onDelete: Cascade)
  tipoPunto           String             @db.VarChar(50) // "parada", "emergencia", "mirador", "abastecimiento"
  ordenIndex          Int
  notas               String?            @db.Text

  @@map("gis_route_points")
}

// 9. Advertencias Operativas de Ruta
model GisRouteWarning {
  id          Int      @id @default(autoincrement())
  routeId     Int
  route       GisRoute @relation(fields: [routeId], references: [id], onDelete: Cascade)
  severidad   String   @db.VarChar(50) // "baja", "moderada", "alta", "critica"
  titulo      String   @db.VarChar(255)
  descripcion String   @db.Text
  activo      Boolean  @default(true)
  validoDesde DateTime @default(now())
  validoHasta DateTime?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("gis_route_warnings")
}
```
