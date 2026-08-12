import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Carga de datos base y ejemplos por categoría para el Formulario Adaptativo...');

  // 1. Crear Formulario Principal si no existe
  let form = await prisma.dynamicForm.findFirst({
    where: { titulo: 'Evaluación Médica y Aptitud Física Unuraymi' },
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
    console.log('✅ Formulario creado con ID:', form.id);
  }

  // 2. Preguntas Iniciales por Categorías (En primera persona y tono amigable)
  const preguntasData = [
    {
      codigo: 'ALT_RESIDENCIA',
      seccion: 'DATOS_BASICOS',
      preguntaText: '¿A qué altitud se encuentra mi ciudad de residencia habitual?',
      tipoControl: 'SELECT',
      orden: 1,
      obligatorio: true,
      ayudaText: 'Nos ayuda a calcular si necesitaré días de aclimatación en montaña.',
      opciones: JSON.stringify([
        { label: 'Nivel del mar / 0 a 500 msnm (Ej: Lima, Costa o ciudades costeras)', value: 'COSTAL_0_500', score: 10, tags: ['RESIDENCIA_COSTAL'] },
        { label: 'Valles y altura media / 500 a 2,000 msnm (Ej: Arequipa, valles interandinos)', value: 'MEDIA_500_2000', score: 5, tags: ['RESIDENCIA_MEDIA'] },
        { label: 'Alta montaña / Más de 2,000 msnm (Ej: Cusco, Huaraz, Puno o similares)', value: 'ALTA_ABOVE_2000', score: 0, tags: ['RESIDENCIA_ALTA'] },
      ]),
    },
    {
      codigo: 'EXP_TREKKING',
      seccion: 'EXPERIENCIA',
      preguntaText: '¿Cuál es mi experiencia previa en caminatas o trekkings de montaña?',
      tipoControl: 'SELECT',
      orden: 2,
      obligatorio: true,
      ayudaText: 'Selecciona la opción que mejor refleje tus rutas anteriores.',
      opciones: JSON.stringify([
        { label: 'Principiante / Nivel Bajo (Sin experiencia o caminatas cortas en caminos planos y bien señalizados)', value: 'PRINCIPIANTE', score: 15, tags: ['PRINCIPIANTE'] },
        { label: 'Moderado / Nivel Medio (Senderos con desniveles moderados, terreno irregular y varias horas de caminata)', value: 'MODERADO', score: 5, tags: ['EXP_MODERADA'] },
        { label: 'Avanzado / Nivel Alto (Treks de varios días en altura > 3,500m como Salkantay o Camino Inca)', value: 'AVANZADO', score: 0, tags: ['EXP_AVANZADA'] },
        { label: 'Experto / Alta Montaña (Zonas expuestas de nevados, pendientes severas y uso de equipo técnico)', value: 'EXPERTO', score: 0, tags: ['EXP_EXPERTO'] },
      ]),
    },
    {
      codigo: 'HISTORIAL_SOROCHE',
      seccion: 'SALUD_ALTITUD',
      preguntaText: '¿He tenido anteriormente antecedentes de Mal de Altura (Soroche)?',
      tipoControl: 'RADIO',
      orden: 3,
      obligatorio: true,
      ayudaText: 'Indícanos si has sentido molestias por la altura en viajes anteriores.',
      opciones: JSON.stringify([
        { label: 'No he tenido síntomas, o solo un leve dolor de cabeza pasajero', value: 'NO_LEVE', score: 0, tags: [] },
        { label: 'Sí, he sentido síntomas moderados (mareo persistente o necesidad de oxígeno/medicación)', value: 'MODERADO', score: 15, tags: ['RIESGO_SOROCHE'] },
        { label: 'Sí, he tenido soroche severo (requerí atención médica u oxigenoterapia continua)', value: 'SEVERO', score: 35, tags: ['SOROCHE_SEVERO'] },
      ]),
    },
    {
      codigo: 'CONDICIONES_MEDICAS',
      seccion: 'SALUD_GENERAL',
      preguntaText: '¿Padezco o tengo diagnóstico de alguna de las siguientes condiciones de salud?',
      tipoControl: 'CHECKBOX',
      orden: 4,
      obligatorio: false,
      ayudaText: 'Tu información es totalmente confidencial para cuidar tu seguridad durante la ruta.',
      opciones: JSON.stringify([
        { label: 'Hipertensión / Presión arterial alta', value: 'HIPERTENSION', score: 10, tags: ['PRESC_CARDIO'] },
        { label: 'Asma o alguna condición respiratoria', value: 'ASMA', score: 10, tags: ['PRESC_RESPIRATORIA'] },
        { label: 'Diabetes o control de glucosa', value: 'DIABETES', score: 5, tags: ['PRESC_METABOLICA'] },
        { label: 'Lesiones o dolores recientes en rodillas, tobillos o espalda', value: 'LESION_ARTICULAR', score: 15, tags: ['PRESC_MOTRIZ'] },
        { label: 'Condiciones cardíacas o arritmias', value: 'CARDIACO', score: 30, tags: ['RIESGO_CARDIACO_ALTO'] },
        { label: 'Cirugía mayor realizada en los últimos 6 meses', value: 'CIRUGIA_RECIENTE', score: 40, tags: ['RIESGO_CIRUGIA'] },
      ]),
    },
    {
      codigo: 'NIVEL_FISICO',
      seccion: 'APTITUD_FISICA',
      preguntaText: '¿Cómo considero mi condición física actual para la caminata?',
      tipoControl: 'SELECT',
      orden: 5,
      obligatorio: true,
      ayudaText: 'Basado en mi actividad o ejercicio semanal.',
      opciones: JSON.stringify([
        { label: 'Sedentario (Realizo poco o ningún ejercicio físico semanal)', value: 'SEDENTARIO', score: 20, tags: ['FISICO_BAJO'] },
        { label: 'Moderado (Practico ejercicio o deportes 1 a 2 veces por semana)', value: 'MODERADO', score: 5, tags: ['FISICO_MEDIO'] },
        { label: 'Activo (Entreno o hago ejercicio regularmente 3 a 5 veces por semana)', value: 'ACTIVO', score: 0, tags: ['FISICO_ALTO'] },
        { label: 'Atleta / Alta Resistencia (Entrenamiento exigente continuo o deportes de alta intensidad)', value: 'ATLETA', score: 0, tags: ['FISICO_ALTO'] },
      ]),
    },
    {
      codigo: 'CONSENTIMIENTO_DECLARACION',
      seccion: 'DECLARACION',
      preguntaText: 'Declaro en primera persona que mi información de salud brindada es correcta y acepto las pautas de seguridad para el tour.',
      tipoControl: 'CHECKBOX',
      orden: 6,
      obligatorio: true,
      ayudaText: 'Requerido para la confirmación de tu experiencia de aventura.',
    },
  ];

  for (const p of preguntasData) {
    await prisma.dynamicQuestion.upsert({
      where: { codigo: p.codigo },
      update: { ...p, formId: form.id },
      create: { ...p, formId: form.id },
    });
  }

  // 3. Reglas de Riesgo Crítico
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
    const existing = await prisma.riskRule.findFirst({ where: { nombre: r.nombre } });
    if (!existing) {
      await prisma.riskRule.create({ data: r });
    }
  }

  // 4. Crear Perfiles y Evaluaciones de Ejemplo por Categoría
  console.log('🌱 Insertando evaluaciones de prueba para el Admin Dashboard...');

  // Ejemplo 1: Pasajero APTO (Carlos Mendoza)
  const profApto = await prisma.pasajeroProfile.upsert({
    where: { documentoIdentidad: '78451296' },
    update: {},
    create: {
      documentoIdentidad: '78451296',
      nombre: 'Carlos',
      apellido: 'Mendoza',
      email: 'carlos.mendoza@gmail.com',
      altitudResidencia: 3400,
    },
  });

  await prisma.passengerEvaluation.create({
    data: {
      profileId: profApto.id,
      formId: form.id,
      respuestasJSON: JSON.stringify({
        ALT_RESIDENCIA: 'ALTA_ABOVE_2000',
        EXP_TREKKING: 'AVANZADO',
        HISTORIAL_SOROCHE: 'NO_LEVE',
        NIVEL_FISICO: 'ACTIVO',
      }),
      scoreRiesgoTotal: 0,
      dictamenCalculado: 'APTO',
      dictamenFinal: 'APTO',
      alertasGeneradas: '[]',
      consentimientoFirmado: true,
      fechaFirma: new Date(),
    },
  });

  // Ejemplo 2: Pasajero APTO CON OBSERVACIÓN (Lucía Gómez)
  const profObs = await prisma.pasajeroProfile.upsert({
    where: { documentoIdentidad: '45896321' },
    update: {},
    create: {
      documentoIdentidad: '45896321',
      nombre: 'Lucía',
      apellido: 'Gómez',
      email: 'lucia.gomez@hotmail.com',
      altitudResidencia: 10,
    },
  });

  await prisma.passengerEvaluation.create({
    data: {
      profileId: profObs.id,
      formId: form.id,
      respuestasJSON: JSON.stringify({
        ALT_RESIDENCIA: 'COSTAL_0_500',
        EXP_TREKKING: 'MODERADO',
        HISTORIAL_SOROCHE: 'MODERADO',
        NIVEL_FISICO: 'MODERADO',
      }),
      scoreRiesgoTotal: 25,
      dictamenCalculado: 'OBSERVACION',
      dictamenFinal: 'OBSERVACION',
      alertasGeneradas: JSON.stringify([
        {
          nombre: 'Recomendación de Aclimatación Obligatoria',
          mensaje: 'Se recomienda al menos 48 horas de aclimatación en Cusco antes de iniciar la caminata.',
        },
      ]),
      consentimientoFirmado: true,
      fechaFirma: new Date(),
    },
  });

  // Ejemplo 3: Pasajero REQUIERE REVISIÓN MANUAL (Roberto Thorne)
  const profRev = await prisma.pasajeroProfile.upsert({
    where: { documentoIdentidad: '99887766' },
    update: {},
    create: {
      documentoIdentidad: '99887766',
      nombre: 'Roberto',
      apellido: 'Thorne',
      email: 'roberto.thorne@outlook.com',
      altitudResidencia: 150,
    },
  });

  await prisma.passengerEvaluation.create({
    data: {
      profileId: profRev.id,
      formId: form.id,
      respuestasJSON: JSON.stringify({
        ALT_RESIDENCIA: 'COSTAL_0_500',
        EXP_TREKKING: 'PRINCIPIANTE',
        HISTORIAL_SOROCHE: 'SEVERO',
        CONDICIONES_MEDICAS: ['CIRUGIA_RECIENTE'],
        NIVEL_FISICO: 'SEDENTARIO',
      }),
      scoreRiesgoTotal: 75,
      dictamenCalculado: 'REQUIERE_REVISION_MANUAL',
      dictamenFinal: 'REQUIERE_REVISION_MANUAL',
      alertasGeneradas: JSON.stringify([
        {
          nombre: 'Alerta Cirugía Reciente en Montaña',
          mensaje: 'Pasajero reporta cirugía reciente en los últimos 6 meses. Se requiere visto bueno médico antes del tour.',
        },
      ]),
      consentimientoFirmado: true,
      fechaFirma: new Date(),
    },
  });

  console.log('✅ Evaluaciones de prueba por categorías insertadas.');
  console.log('🎉 Inicialización completada con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
