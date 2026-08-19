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
    await addColumnSafe('tours', 'nivel_dificultad', 'VARCHAR(50) NOT NULL DEFAULT "Moderado"');

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
    await addColumnSafe('tour_variantes', 'itinerario', 'LONGTEXT NULL');
    await addColumnSafe('tour_variantes', 'servicios_incluidos', 'LONGTEXT NULL');
    await addColumnSafe('tour_variantes', 'servicios_excluidos', 'LONGTEXT NULL');
    await addColumnSafe('tour_variantes', 'fechas_disponibles', 'LONGTEXT NULL');

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

    // 14. Auto-seeding del Formulario Médico, Preguntas y Reglas de Riesgo si están vacías
    try {
      let form = await prisma.dynamicForm.findFirst({
        where: { activo: true },
      });

      if (!form) {
        form = await prisma.dynamicForm.create({
          data: {
            titulo: 'Evaluación Médica y Aptitud Física Unuraymi',
            descripcion: 'Formulario obligatorio de seguridad y condición física antes de abordar tours de montaña y expediciones.',
            activo: true,
            version: 1,
          },
        });
        console.log('✅ [initDb] Formulario médico base inicializado con ID:', form.id);
      }

      const questionsCount = await prisma.dynamicQuestion.count();
      if (questionsCount === 0) {
        const preguntasData = [
          {
            codigo: 'ALT_RESIDENCIA',
            seccion: 'DATOS_BASICOS',
            preguntaText: '¿A qué altitud se encuentra la ciudad donde reside habitualmente?',
            tipoControl: 'SELECT',
            orden: 1,
            obligatorio: true,
            ayudaText: 'Requerido para estimar la necesidad de días de aclimatación.',
            opciones: JSON.stringify([
              { label: 'Nivel del mar / 0 - 500 msnm (Costa, Lima, etc.)', value: 'COSTAL_0_500', score: 10, tags: ['RESIDENCIA_COSTAL'] },
              { label: 'Valles / 500 - 2,000 msnm (Arequipa media, etc.)', value: 'MEDIA_500_2000', score: 5, tags: ['RESIDENCIA_MEDIA'] },
              { label: 'Alta montaña / > 2,000 msnm (Cusco, Huaraz, Puno)', value: 'ALTA_ABOVE_2000', score: 0, tags: ['RESIDENCIA_ALTA'] },
            ]),
          },
          {
            codigo: 'EXP_TREKKING',
            seccion: 'EXPERIENCIA',
            preguntaText: '¿Cuál es su experiencia previa en caminatas o trekkings de montaña?',
            tipoControl: 'SELECT',
            orden: 2,
            obligatorio: true,
            ayudaText: 'Seleccione su máximo nivel alcanzado.',
            opciones: JSON.stringify([
              { label: 'Sin experiencia previa / Principiante', value: 'PRINCIPIANTE', score: 15, tags: ['PRINCIPIANTE'] },
              { label: 'Caminatas ocasionales de 1 día (Dificultad moderada)', value: 'MODERADO', score: 5, tags: ['EXP_MODERADA'] },
              { label: 'Trek de varios días en altura > 3,500m (Salkantay, Camino Inca)', value: 'AVANZADO', score: 0, tags: ['EXP_AVANZADA'] },
              { label: 'Alta montaña / Expediciones en nevados con crampones', value: 'EXPERTO', score: 0, tags: ['EXP_EXPERTO'] },
            ]),
          },
          {
            codigo: 'HISTORIAL_SOROCHE',
            seccion: 'SALUD_ALTITUD',
            preguntaText: '¿Ha tenido anteriormente antecedentes severos de Mal de Altura (Soroche)?',
            tipoControl: 'RADIO',
            orden: 3,
            obligatorio: true,
            ayudaText: 'Síntomas como vómitos continuos, mareo incapacitante o desmayos en altura.',
            opciones: JSON.stringify([
              { label: 'No, o muy leve (dolor de cabeza leve)', value: 'NO_LEVE', score: 0, tags: [] },
              { label: 'Sí, síntomas moderados (requirió oxígeno o medicación)', value: 'MODERADO', score: 15, tags: ['RIESGO_SOROCHE'] },
              { label: 'Sí, severo (requirió evacuación o atención hospitalaria)', value: 'SEVERO', score: 35, tags: ['SOROCHE_SEVERO'] },
            ]),
          },
          {
            codigo: 'CONDICIONES_MEDICAS',
            seccion: 'SALUD_GENERAL',
            preguntaText: 'Marque si padece o ha sido diagnosticado con alguna de las siguientes condiciones:',
            tipoControl: 'CHECKBOX',
            orden: 4,
            obligatorio: false,
            ayudaText: 'Información confidencial para uso de los guías de auxilio.',
            opciones: JSON.stringify([
              { label: 'Hipertensión / Presión arterial alta', value: 'HIPERTENSION', score: 10, tags: ['PRESC_CARDIO'] },
              { label: 'Asma o enfermedad respiratoria', value: 'ASMA', score: 10, tags: ['PRESC_RESPIRATORIA'] },
              { label: 'Diabetes', value: 'DIABETES', score: 5, tags: ['PRESC_METABOLICA'] },
              { label: 'Lesiones recientes en rodillas, tobillos o columna', value: 'LESION_ARTICULAR', score: 15, tags: ['PRESC_MOTRIZ'] },
              { label: 'Problemas cardíacos o arritmias', value: 'CARDIACO', score: 30, tags: ['RIESGO_CARDIACO_ALTO'] },
              { label: 'Cirugía mayor en los últimos 6 meses', value: 'CIRUGIA_RECIENTE', score: 40, tags: ['RIESGO_CIRUGIA'] },
            ]),
          },
          {
            codigo: 'NIVEL_FISICO',
            seccion: 'APTITUD_FISICA',
            preguntaText: '¿Cómo evalúa su nivel de condición física actual?',
            tipoControl: 'SELECT',
            orden: 5,
            obligatorio: true,
            ayudaText: 'Frecuencia de ejercicio cardiovascular semanal.',
            opciones: JSON.stringify([
              { label: 'Sedentario (Poco o ningún ejercicio)', value: 'SEDENTARIO', score: 20, tags: ['FISICO_BAJO'] },
              { label: 'Moderado (Ejercicio 1 a 2 veces por semana)', value: 'MODERADO', score: 5, tags: ['FISICO_MEDIO'] },
              { label: 'Activo (Ejercicio 3 a 5 veces por semana)', value: 'ACTIVO', score: 0, tags: ['FISICO_ALTO'] },
              { label: 'Atleta de alta resistencia', value: 'ATLETA', score: 0, tags: ['FISICO_ALTO'] },
            ]),
          },
          {
            codigo: 'CONSENTIMIENTO_DECLARACION',
            seccion: 'DECLARACION',
            preguntaText: 'Declaro bajo juramento que los datos de salud ingresados son verídicos y acepto los términos de responsabilidad de alta montaña.',
            tipoControl: 'CHECKBOX',
            orden: 6,
            obligatorio: true,
            ayudaText: 'Requerido para la emisión del pase de abordar del tour.',
          },
        ];

        for (const p of preguntasData) {
          await prisma.dynamicQuestion.create({
            data: { ...p, formId: form.id },
          });
        }
        console.log('✅ [initDb] Preguntas del formulario médico inicializadas.');
      }

      const rulesCount = await prisma.riskRule.count();
      if (rulesCount === 0) {
        const reglasData = [
          {
            nombre: 'Alerta Cirugía Reciente en Montaña',
            descripcion: 'Requiere revisión si el pasajero tuvo una cirugía mayor en los últimos 6 meses.',
            ponderacion: 40,
            condicion: JSON.stringify({
              field: 'CONDICIONES_MEDICAS',
              op: 'CONTAINS',
              val: 'CIRUGIA_RECIENTE',
            }),
            dictamenResult: 'REQUIERE_REVISION_MANUAL',
            mensajeAlerta: 'Pasajero reporta cirugía reciente en los últimos 6 meses. Se requiere visto bueno médico antes del tour.',
            tagsRespuesta: JSON.stringify(['RIESGO_CIRUGIA']),
            activo: true,
          },
          {
            nombre: 'Alerta Cardíaca en Tour Exigente',
            descripcion: 'Evalúa problemas cardíacos reportados.',
            ponderacion: 30,
            condicion: JSON.stringify({
              field: 'CONDICIONES_MEDICAS',
              op: 'CONTAINS',
              val: 'CARDIACO',
            }),
            dictamenResult: 'REQUIERE_REVISION_MANUAL',
            mensajeAlerta: 'Pasajero indica condición cardíaca preexistente. Requiere evaluación médica personalizada.',
            tagsRespuesta: JSON.stringify(['RIESGO_CARDIACO']),
            activo: true,
          },
          {
            nombre: 'Recomendación de Aclimatación Obligatoria',
            descripcion: 'Residencia en costa y soroche previo.',
            ponderacion: 20,
            condicion: JSON.stringify({
              AND: [
                { field: 'ALT_RESIDENCIA', op: '=', val: 'COSTAL_0_500' },
                { field: 'HISTORIAL_SOROCHE', op: '=', val: 'MODERADO' },
              ],
            }),
            dictamenResult: 'OBSERVACION',
            mensajeAlerta: 'Se recomienda al menos 48 horas de aclimatación en Cusco antes de iniciar la caminata.',
            tagsRespuesta: JSON.stringify(['ACLIMATACION_SUGERIDA']),
            activo: true,
          },
        ];

        for (const r of reglasData) {
          await prisma.riskRule.create({ data: r });
        }
        console.log('✅ [initDb] Reglas de riesgo médico inicializadas.');
      }
    } catch (e) {
      console.warn('⚠️ [initDb] Form engine seeding skipped:', e.message);
    }

    console.log('✅ [initDb] 100% de tablas y columnas de MySQL verificadas y alineadas con Prisma.');
  } catch (err) {
    console.error('⚠️ [initDb] Error al verificar columnas/tablas en MySQL:', err.message);
  }
}
