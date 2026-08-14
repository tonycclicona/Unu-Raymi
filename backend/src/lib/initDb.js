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
        \`fechas_disponibles\` LONGTEXT NOT NULL DEFAULT '[]',
        \`activo\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`destacado\` BOOLEAN NOT NULL DEFAULT FALSE,
        \`pais\` VARCHAR(50) NOT NULL DEFAULT 'Perú',
        \`categoria\` VARCHAR(50) NOT NULL DEFAULT 'Trekking',
        \`ciudad\` VARCHAR(50) NOT NULL DEFAULT 'Cusco',
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Tabla: guias
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`guias\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`nombre\` VARCHAR(255) NOT NULL,
        \`rol\` VARCHAR(255) NOT NULL,
        \`experiencia\` VARCHAR(255) NOT NULL,
        \`idiomas\` VARCHAR(255) NOT NULL,
        \`foto\` VARCHAR(500) NULL,
        \`descripcion\` LONGTEXT NULL,
        \`activo\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`orden\` INT NOT NULL DEFAULT 0,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Tabla: garantias
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`garantias\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`titulo\` VARCHAR(255) NOT NULL,
        \`descripcion\` LONGTEXT NOT NULL,
        \`icono\` VARCHAR(100) NOT NULL,
        \`color\` VARCHAR(50) NOT NULL DEFAULT '#84dcc6',
        \`imagenUrl\` VARCHAR(500) NULL,
        \`activo\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`orden\` INT NOT NULL DEFAULT 0,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Tabla: reservas
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`reservas\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`tokenSeguridad\` VARCHAR(36) NOT NULL UNIQUE,
        \`tourId\` INT NOT NULL,
        \`fechaViaje\` VARCHAR(10) NOT NULL,
        \`cantAdultos\` INT NOT NULL,
        \`cantNinos\` INT NOT NULL DEFAULT 0,
        \`precioTotal\` DECIMAL(10, 2) NOT NULL,
        \`titularNombre\` VARCHAR(255) NOT NULL,
        \`titularEmail\` VARCHAR(255) NOT NULL,
        \`titularTelefono\` VARCHAR(50) NOT NULL,
        \`estado\` VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        \`stripePaymentIntentId\` VARCHAR(255) NULL UNIQUE,
        \`openpayChargeId\` VARCHAR(255) NULL UNIQUE,
        \`openpayPaymentUrl\` VARCHAR(500) NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        FOREIGN KEY (\`tourId\`) REFERENCES \`tours\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. Tabla: pasajeros
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`pasajeros\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`reservaId\` INT NOT NULL,
        \`nombre\` VARCHAR(255) NOT NULL,
        \`apellido\` VARCHAR(255) NOT NULL,
        \`documentoIdentidad\` VARCHAR(100) NOT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        FOREIGN KEY (\`reservaId\`) REFERENCES \`reservas\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. Tabla: imagenes
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`imagenes\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`tourId\` INT NOT NULL,
        \`url\` VARCHAR(500) NOT NULL,
        \`altText\` VARCHAR(255) NULL,
        \`orden\` INT NOT NULL DEFAULT 0,
        \`esPortada\` BOOLEAN NOT NULL DEFAULT FALSE,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        FOREIGN KEY (\`tourId\`) REFERENCES \`tours\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Alias retrocompatible por si acaso
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`tour_imagenes\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`tourId\` INT NOT NULL,
        \`url\` VARCHAR(500) NOT NULL,
        \`orden\` INT NOT NULL DEFAULT 0,
        \`esPortada\` BOOLEAN NOT NULL DEFAULT FALSE,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        FOREIGN KEY (\`tourId\`) REFERENCES \`tours\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 7. Tabla: tour_variantes
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`tour_variantes\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`tourId\` INT NOT NULL,
        \`nombre\` VARCHAR(255) NOT NULL,
        \`duracion_dias\` INT NOT NULL,
        \`precio_adulto\` DECIMAL(10, 2) NOT NULL,
        \`precio_nino\` DECIMAL(10, 2) NOT NULL,
        \`cupos_disponibles\` INT NOT NULL,
        \`servicios_incluidos\` LONGTEXT NOT NULL DEFAULT '[]',
        \`servicios_excluidos\` LONGTEXT NOT NULL DEFAULT '[]',
        \`fechas_disponibles\` LONGTEXT NOT NULL DEFAULT '[]',
        \`activo\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        FOREIGN KEY (\`tourId\`) REFERENCES \`tours\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
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
        \`description\` LONGTEXT NULL,
        \`tourId\` INT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        FOREIGN KEY (\`tourId\`) REFERENCES \`tours\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 9. Tabla: dynamic_forms
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`dynamic_forms\` (
        \`id\` VARCHAR(36) PRIMARY KEY,
        \`titulo\` VARCHAR(255) NOT NULL,
        \`descripcion\` LONGTEXT NULL,
        \`activo\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`version\` INT NOT NULL DEFAULT 1,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 10. Tabla: dynamic_questions
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`dynamic_questions\` (
        \`id\` VARCHAR(36) PRIMARY KEY,
        \`formId\` VARCHAR(36) NOT NULL,
        \`codigo\` VARCHAR(100) NOT NULL UNIQUE,
        \`seccion\` VARCHAR(100) NOT NULL DEFAULT 'GENERAL',
        \`preguntaText\` LONGTEXT NOT NULL,
        \`tipoControl\` VARCHAR(50) NOT NULL,
        \`opciones\` LONGTEXT NULL,
        \`condicionMostrar\` LONGTEXT NULL,
        \`orden\` INT NOT NULL DEFAULT 0,
        \`obligatorio\` BOOLEAN NOT NULL DEFAULT FALSE,
        \`ayudaText\` LONGTEXT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        FOREIGN KEY (\`formId\`) REFERENCES \`dynamic_forms\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 11. Tabla: risk_rules
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`risk_rules\` (
        \`id\` VARCHAR(36) PRIMARY KEY,
        \`nombre\` VARCHAR(255) NOT NULL,
        \`descripcion\` LONGTEXT NULL,
        \`ponderacion\` INT NOT NULL DEFAULT 10,
        \`condicion\` LONGTEXT NOT NULL,
        \`dictamenResult\` VARCHAR(50) NOT NULL,
        \`mensajeAlerta\` LONGTEXT NOT NULL,
        \`tagsRespuesta\` LONGTEXT NULL,
        \`activo\` BOOLEAN NOT NULL DEFAULT TRUE,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 12. Tabla: passenger_evaluations
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`passenger_evaluations\` (
        \`id\` VARCHAR(36) PRIMARY KEY,
        \`reservaId\` INT NULL,
        \`pasajeroId\` INT NULL,
        \`documentoIdentidad\` VARCHAR(100) NOT NULL,
        \`nombre\` VARCHAR(255) NOT NULL,
        \`apellido\` VARCHAR(255) NOT NULL,
        \`email\` VARCHAR(255) NULL,
        \`scoreTotal\` INT NOT NULL DEFAULT 0,
        \`dictamen\` VARCHAR(50) NOT NULL,
        \`detallesRiesgo\` LONGTEXT NULL,
        \`alertasGeneradas\` LONGTEXT NULL,
        \`consentimientoFirmado\` BOOLEAN NOT NULL DEFAULT FALSE,
        \`fechaFirma\` DATETIME(3) NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        FOREIGN KEY (\`reservaId\`) REFERENCES \`reservas\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE,
        FOREIGN KEY (\`pasajeroId\`) REFERENCES \`pasajeros\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 13. Tabla: evaluation_responses
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`evaluation_responses\` (
        \`id\` VARCHAR(36) PRIMARY KEY,
        \`evaluationId\` VARCHAR(36) NOT NULL,
        \`preguntaCodigo\` VARCHAR(100) NOT NULL,
        \`respuestaValor\` LONGTEXT NOT NULL,
        \`scoreAplicado\` INT NOT NULL DEFAULT 0,
        \`tagsAsignados\` LONGTEXT NULL,
        \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        FOREIGN KEY (\`evaluationId\`) REFERENCES \`passenger_evaluations\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ [initDb] Todas las tablas de MySQL verificadas/creadas correctamente.');
  } catch (err) {
    console.error('⚠️ [initDb] Error al auto-crear tablas en MySQL:', err.message);
  }
}
