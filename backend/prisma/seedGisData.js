import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Inicializando datos base GIS y ejemplo de la Laguna Humantay...');

  // 1. Países Operativos
  const peru = await prisma.gisCountry.upsert({
    where: { isoCode: 'PE' },
    update: { nombre: 'Perú', activo: true },
    create: { nombre: 'Perú', isoCode: 'PE', activo: true },
  });

  const colombia = await prisma.gisCountry.upsert({
    where: { isoCode: 'CO' },
    update: { nombre: 'Colombia', activo: true },
    create: { nombre: 'Colombia', isoCode: 'CO', activo: true },
  });

  const chile = await prisma.gisCountry.upsert({
    where: { isoCode: 'CL' },
    update: { nombre: 'Chile', activo: true },
    create: { nombre: 'Chile', isoCode: 'CL', activo: true },
  });

  console.log('✅ Países base verificados: Perú, Colombia, Chile.');

  // 2. Jerarquía Administrativa de Ejemplo: Cusco -> Anta -> Mollepata
  const regionCusco = await prisma.gisAdministrativeArea.create({
    data: {
      countryId: peru.id,
      nombre: 'Cusco',
      adminLevel: 1,
      adminType: 'region',
      fuente: 'GeoBoundaries Perú',
      verificado: true,
      verificadoEn: new Date(),
    },
  });

  const provAnta = await prisma.gisAdministrativeArea.create({
    data: {
      countryId: peru.id,
      parentId: regionCusco.id,
      nombre: 'Anta',
      adminLevel: 2,
      adminType: 'provincia',
      fuente: 'GeoBoundaries Perú',
      verificado: true,
      verificadoEn: new Date(),
    },
  });

  const distMollepata = await prisma.gisAdministrativeArea.create({
    data: {
      countryId: peru.id,
      parentId: provAnta.id,
      nombre: 'Mollepata',
      adminLevel: 3,
      adminType: 'distrito',
      fuente: 'GeoBoundaries Perú',
      verificado: true,
      verificadoEn: new Date(),
    },
  });

  console.log('✅ Jerarquía administrativa creada: Cusco -> Anta -> Mollepata.');

  // 3. Atractivo Turístico Principal: Laguna Humantay
  const humantay = await prisma.touristAttraction.upsert({
    where: { slug: 'laguna-humantay' },
    update: {},
    create: {
      nombre: 'Laguna Humantay',
      slug: 'laguna-humantay',
      descripcion: 'Espectacular laguna turquesa formada por el deshielo del nevado Humantay en la cordillera de Vilcabamba a 4,200 msnm.',
      categoria: 'laguna',
      countryId: peru.id,
      administrativeAreaId: distMollepata.id,
      localidad: 'Soraypampa',
      latitud: -13.3644,
      longitud: -72.5714,
      altitudMetros: 4200,
      dificultad: 'exigente',
      duracionDias: 1.0,
      estado: 'verified',
      fuente: 'Agencia Unu-Raymi',
      verificado: true,
      verificadoEn: new Date(),
      creadoPor: 'Admin GIS',
    },
  });

  console.log('✅ Atractivo Turístico registrado: Laguna Humantay (ID:', humantay.id, ')');

  // 4. Ruta Principal: Cusco a Laguna Humantay
  const rutaHumantay = await prisma.gisRoute.upsert({
    where: { slug: 'ruta-cusco-laguna-humantay' },
    update: {},
    create: {
      nombre: 'Expedición Clásica Cusco a Laguna Humantay',
      slug: 'ruta-cusco-laguna-humantay',
      descripcion: 'Ruta completa desde la ciudad imperial del Cusco pasando por Limatambo, Mollepata, el campamento base de Soraypampa y el ascenso a pie hasta la laguna.',
      tipoRuta: 'mixto',
      dificultad: 'exigente',
      duracionDias: 1.0,
      distanciaKm: 128.5,
      altitudMaxMetros: 4200,
      altitudMinMetros: 2900,
      desnivelPositivo: 350,
      desnivelNegativo: 350,
      estado: 'active',
      verificado: true,
      verificadoEn: new Date(),
    },
  });

  // Relacionar Ruta con la Laguna Humantay
  await prisma.routeAttraction.upsert({
    where: {
      routeId_attractionId: {
        routeId: rutaHumantay.id,
        attractionId: humantay.id,
      },
    },
    update: {},
    create: {
      routeId: rutaHumantay.id,
      attractionId: humantay.id,
    },
  });

  // 5. Los 5 Segmentos de la Ruta Humantay
  const segmentosData = [
    {
      nombre: 'Cusco → Mollepata',
      ordenIndex: 1,
      puntoInicio: 'Ciudad de Cusco (3,400 msnm)',
      puntoFin: 'Pueblo de Mollepata (2,900 msnm)',
      tipoTransporte: 'bus',
      distanciaKm: 98.0,
      duracionMinutos: 150,
      altitudInicioM: 3400,
      altitudFinM: 2900,
      dificultad: 'facil',
      advertencias: 'Carretera asfaltada con curvas en descenso hacia el valle.',
    },
    {
      nombre: 'Mollepata → Soraypampa',
      ordenIndex: 2,
      puntoInicio: 'Pueblo de Mollepata (2,900 msnm)',
      puntoFin: 'Campamento Soraypampa (3,850 msnm)',
      tipoTransporte: 'bus',
      distanciaKm: 28.0,
      duracionMinutos: 90,
      altitudInicioM: 2900,
      altitudFinM: 3850,
      dificultad: 'moderado',
      advertencias: 'Trocha carrozable de afirmado. Precaución en época de lluvias.',
    },
    {
      nombre: 'Soraypampa → Laguna Humantay (Ascenso)',
      ordenIndex: 3,
      puntoInicio: 'Campamento Soraypampa (3,850 msnm)',
      puntoFin: 'Orilla de Laguna Humantay (4,200 msnm)',
      tipoTransporte: 'trekking',
      distanciaKm: 2.25,
      duracionMinutos: 110,
      altitudInicioM: 3850,
      altitudFinM: 4200,
      dificultad: 'exigente',
      advertencias: 'Sendero empinado de montaña. Se requiere aclimatación previa y bastones de trekking.',
    },
    {
      nombre: 'Laguna Humantay → Soraypampa (Descenso)',
      ordenIndex: 4,
      puntoInicio: 'Laguna Humantay (4,200 msnm)',
      puntoFin: 'Campamento Soraypampa (3,850 msnm)',
      tipoTransporte: 'trekking',
      distanciaKm: 2.25,
      duracionMinutos: 60,
      altitudInicioM: 4200,
      altitudFinM: 3850,
      dificultad: 'moderado',
      advertencias: 'Cuidado con terreno resbaladizo o piedras sueltas en la bajada.',
    },
    {
      nombre: 'Soraypampa → Cusco (Retorno)',
      ordenIndex: 5,
      puntoInicio: 'Campamento Soraypampa (3,850 msnm)',
      puntoFin: 'Ciudad de Cusco (3,400 msnm)',
      tipoTransporte: 'bus',
      distanciaKm: 126.0,
      duracionMinutos: 210,
      altitudInicioM: 3850,
      altitudFinM: 3400,
      dificultad: 'facil',
      advertencias: 'Retorno en transporte privado turistico.',
    },
  ];

  for (const seg of segmentosData) {
    await prisma.gisRouteSegment.create({
      data: {
        ...seg,
        routeId: rutaHumantay.id,
      },
    });
  }

  console.log('✅ 5 Segmentos de la ruta registrados.');

  // 6. Puntos de Interés / Servicios Cercanos
  const poiHealth = await prisma.gisPointOfInterest.create({
    data: {
      nombre: 'Puesto de Salud Mollepata',
      categoria: 'hospital',
      latitud: -13.5658,
      longitud: -72.6784,
      direccion: 'Plaza de Armas S/N, Mollepata',
      telefono: '+51 084 591024',
      horario: '24 horas urgencias',
      fuente: 'MINSA Perú',
      verificado: true,
    },
  });

  const poiCamp = await prisma.gisPointOfInterest.create({
    data: {
      nombre: 'Eco-Lodges & Campamento Soraypampa',
      categoria: 'campamento',
      latitud: -13.3852,
      longitud: -72.5741,
      direccion: 'Base Soraypampa',
      fuente: 'Verificado Agencia Unu-Raymi',
      verificado: true,
    },
  });

  const poiWater = await prisma.gisPointOfInterest.create({
    data: {
      nombre: 'Punto de Agua y SSHH Soraypampa',
      categoria: 'banos',
      latitud: -13.3845,
      longitud: -72.5738,
      fuente: 'Verificado Agencia Unu-Raymi',
      verificado: true,
    },
  });

  // Relacionar POIs con la Ruta
  await prisma.gisRoutePoint.create({
    data: {
      routeId: rutaHumantay.id,
      pointOfInterestId: poiHealth.id,
      tipoPunto: 'emergencia',
      ordenIndex: 1,
      notas: 'Centro médico más cercano antes del ascenso.',
    },
  });

  await prisma.gisRoutePoint.create({
    data: {
      routeId: rutaHumantay.id,
      pointOfInterestId: poiCamp.id,
      tipoPunto: 'abastecimiento',
      ordenIndex: 2,
      notas: 'Punto de partida del trekking a pie.',
    },
  });

  // 7. Advertencias Operativas de Ruta
  await prisma.gisRouteWarning.create({
    data: {
      routeId: rutaHumantay.id,
      severidad: 'moderada',
      titulo: 'Exposición a Soroche / Mal de Altura',
      descripcion: 'Ascenso rápido por encima de los 4,000 msnm. Se recomienda haber estado al menos 2 días en Cusco previa caminata.',
      activo: true,
    },
  });

  console.log('🎉 Inicialización completada con éxito. Datos de la Laguna Humantay listos en la BD.');
}

main()
  .catch((e) => {
    console.error('❌ Error ejecutando el seed GIS:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
