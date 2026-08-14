import prisma from './prismaClient.js';

export async function ensureTablesExist() {
  try {
    // 1. Tabla: tours
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`tours\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`nombre\` VARCHAR(255) NOT NULL,
        \`slug\` VARCHAR(255) NOT NULL UNIQUE,
        \`descripcion\` LONGTEXT NOT NULL,
        \`itinerario\` LONGTEXT NULL,
        \`precio_adulto\` DECIMAL(10, 2) NOT NULL,
        \`precio_nino\` DECIMAL(10, 2) NOT NULL,
        \`duracion_dias\` INT NOT NULL,
        \`cupos_disponibles\` INT NOT NULL,
        \`servicios_incluidos\` LONGTEXT NOT NULL,
        \`servicios_excluidos\` LONGTEXT NOT NULL,
        \`que_llevar\` LONGTEXT NOT NULL,
        \`fechas_disponibles\` LONGTEXT NOT NULL,
        \`activo\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`destacado\` BOOLEAN NOT NULL DEFAULT FALSE,
        \`pais\` VARCHAR(50) NOT NULL DEFAULT 'Perú',
        \`categoria\` VARCHAR(50) NOT NULL DEFAULT 'Trekking',
        \`ciudad\` VARCHAR(50) NOT NULL DEFAULT 'Cusco',
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Asegurar que columnas clave existan si la tabla ya habia sido creada previamente
    const addColumnSafe = async (table, column, def) => {
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${def};`);
        console.log(`[initDb] Column ${table}.${column} added successfully.`);
      } catch (e) {
        // Ignorar si la columna ya existe
      }
    };

    await addColumnSafe('tours', 'itinerario', 'LONGTEXT NULL');
    await addColumnSafe('tours', 'fechas_disponibles', 'LONGTEXT NOT NULL DEFAULT "[]"');
    await addColumnSafe('tours', 'pais', 'VARCHAR(50) NOT NULL DEFAULT "Perú"');
    await addColumnSafe('tours', 'categoria', 'VARCHAR(50) NOT NULL DEFAULT "Trekking"');
    await addColumnSafe('tours', 'ciudad', 'VARCHAR(50) NOT NULL DEFAULT "Cusco"');
    await addColumnSafe('tours', 'activo', 'BOOLEAN NOT NULL DEFAULT TRUE');
    await addColumnSafe('tours', 'destacado', 'BOOLEAN NOT NULL DEFAULT FALSE');

    // 2. Tabla: imagenes
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`imagenes\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`tourId\` INT NOT NULL,
        \`url\` VARCHAR(500) NOT NULL,
        \`altText\` VARCHAR(255) NULL,
        \`orden\` INT NOT NULL DEFAULT 0,
        FOREIGN KEY (\`tourId\`) REFERENCES \`tours\`(\`id\` ) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    await addColumnSafe('imagenes', 'altText', 'VARCHAR(255) NULL');
    await addColumnSafe('imagenes', 'orden', 'INT NOT NULL DEFAULT 0');

    // 3. Tabla: tour_variantes
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`tour_variantes\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`tourId\` INT NOT NULL,
        \`duracion_dias\` INT NOT NULL,
        \`precio_adulto\` DECIMAL(10, 2) NOT NULL,
        \`precio_nino\` DECIMAL(10, 2) NOT NULL,
        \`cupos_disponibles\` INT NOT NULL,
        \`itinerario\` LONGTEXT NULL,
        \`servicios_incluidos\` LONGTEXT NULL,
        \`servicios_excluidos\` LONGTEXT NULL,
        \`fechas_disponibles\` LONGTEXT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        FOREIGN KEY (\`tourId\`) REFERENCES \`tours\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Tabla: guias
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`guias\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`nombre\` VARCHAR(255) NOT NULL,
        \`rol\` VARCHAR(255) NOT NULL,
        \`experiencia\` VARCHAR(255) NOT NULL,
        \`idiomas\` VARCHAR(255) NOT NULL,
        \`foto\` VARCHAR(500) NOT NULL,
        \`descripcion\` LONGTEXT NOT NULL,
        \`activo\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`orden\` INT NOT NULL DEFAULT 0,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Tabla: garantias
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`garantias\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`titulo\` VARCHAR(255) NOT NULL,
        \`descripcion\` LONGTEXT NOT NULL,
        \`icono\` VARCHAR(100) NOT NULL,
        \`color\` VARCHAR(100) NOT NULL,
        \`imagenUrl\` VARCHAR(500) NULL,
        \`activo\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`orden\` INT NOT NULL DEFAULT 0,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. Tabla: reservas
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`reservas\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`tourId\` INT NOT NULL,
        \`fechaViaje\` DATETIME(3) NOT NULL,
        \`cantAdultos\` INT NOT NULL,
        \`cantNinos\` INT NOT NULL,
        \`precioTotal\` DECIMAL(10, 2) NOT NULL,
        \`duracion_dias\` INT NOT NULL DEFAULT 1,
        \`estado\` VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        \`tokenSeguridad\` VARCHAR(36) NOT NULL UNIQUE,
        \`titularNombre\` VARCHAR(255) NOT NULL,
        \`titularEmail\` VARCHAR(255) NOT NULL,
        \`titularTelefono\` VARCHAR(50) NULL,
        \`referenciaPago\` VARCHAR(255) NULL,
        \`urlPago\` TEXT NULL,
        \`pagadoEn\` DATETIME(3) NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        FOREIGN KEY (\`tourId\`) REFERENCES \`tours\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 7. Tabla: pasajeros
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`pasajeros\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`nombre\` VARCHAR(150) NOT NULL,
        \`apellido\` VARCHAR(150) NOT NULL,
        \`dni\` VARCHAR(20) NULL,
        \`tipo\` VARCHAR(10) NOT NULL,
        \`reservaId\` INT NOT NULL,
        FOREIGN KEY (\`reservaId\`) REFERENCES \`reservas\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 8. Tabla: attractions (Puntos GIS)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`attractions\` (
        \`id\` VARCHAR(36) PRIMARY KEY,
        \`name\` VARCHAR(255) NOT NULL,
        \`category\` VARCHAR(50) NOT NULL DEFAULT 'ATRACTIVO',
        \`latitude\` DOUBLE NOT NULL,
        \`longitude\` DOUBLE NOT NULL,
        \`altitude\` INT NULL,
        \`description\` TEXT NULL,
        \`tourId\` INT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        FOREIGN KEY (\`tourId\`) REFERENCES \`tours\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 9. Tabla: dynamic_forms
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`dynamic_forms\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`titulo\` VARCHAR(255) NOT NULL,
        \`descripcion\` TEXT NULL,
        \`activo\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`version\` INT NOT NULL DEFAULT 1,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 10. Tabla: dynamic_questions
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`dynamic_questions\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`formId\` INT NOT NULL,
        \`codigo\` VARCHAR(100) NOT NULL UNIQUE,
        \`seccion\` VARCHAR(100) NOT NULL,
        \`preguntaText\` TEXT NOT NULL,
        \`tipoControl\` VARCHAR(50) NOT NULL,
        \`opciones\` LONGTEXT NULL,
        \`orden\` INT NOT NULL DEFAULT 0,
        \`obligatorio\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`ayudaText\` TEXT NULL,
        \`condicionMostrar\` LONGTEXT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        FOREIGN KEY (\`formId\`) REFERENCES \`dynamic_forms\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 11. Tabla: risk_rules
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`risk_rules\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`nombre\` VARCHAR(255) NOT NULL,
        \`descripcion\` TEXT NULL,
        \`ponderacion\` INT NOT NULL DEFAULT 1,
        \`condicion\` LONGTEXT NOT NULL,
        \`dictamenResult\` VARCHAR(50) NOT NULL,
        \`mensajeAlerta\` TEXT NOT NULL,
        \`tagsRespuesta\` LONGTEXT NOT NULL,
        \`activo\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 12. Tabla: pasajero_profiles
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`pasajero_profiles\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`documentoIdentidad\` VARCHAR(50) NOT NULL UNIQUE,
        \`nombre\` VARCHAR(150) NOT NULL,
        \`apellido\` VARCHAR(150) NOT NULL,
        \`email\` VARCHAR(255) NOT NULL,
        \`telefono\` VARCHAR(50) NULL,
        \`fechaNacimiento\` DATETIME(3) NULL,
        \`altitudResidencia\` INT NULL,
        \`contactosEmergencia\` LONGTEXT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 13. Tabla: passenger_evaluations
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`passenger_evaluations\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`reservaId\` INT NULL,
        \`pasajeroId\` INT NULL,
        \`profileId\` INT NULL,
        \`formId\` INT NOT NULL,
        \`respuestasJSON\` LONGTEXT NOT NULL,
        \`scoreRiesgoTotal\` INT NOT NULL DEFAULT 0,
        \`dictamenCalculado\` VARCHAR(50) NOT NULL,
        \`dictamenFinal\` VARCHAR(50) NOT NULL,
        \`observacionesAdmin\` TEXT NULL,
        \`alertasGeneradas\` LONGTEXT NOT NULL,
        \`consentimientoFirmado\` BOOLEAN NOT NULL DEFAULT FALSE,
        \`ipOrigen\` VARCHAR(45) NULL,
        \`fechaFirma\` DATETIME(3) NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        FOREIGN KEY (\`reservaId\`) REFERENCES \`reservas\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
        FOREIGN KEY (\`pasajeroId\`) REFERENCES \`pasajeros\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
        FOREIGN KEY (\`profileId\`) REFERENCES \`pasajero_profiles\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
        FOREIGN KEY (\`formId\`) REFERENCES \`dynamic_forms\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ [initDb] 100% de tablas y columnas de MySQL verificadas y alineadas con Prisma.');
  } catch (err) {
    console.error('⚠️ [initDb] Error al verificar columnas/tablas en MySQL:', err.message);
  }
}
