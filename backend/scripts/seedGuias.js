import prisma from '../src/lib/prismaClient.js';

async function main() {
  const guiasData = [
    {
      nombre: 'Edgar Paucar',
      rol: 'Guía Líder de Alta Montaña UIAGM',
      experiencia: '12 Años',
      idiomas: 'Español, Quechua, Inglés',
      foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
      descripcion: 'Especialista en rutas de alta exigencia, expediciones glaciares en Ausangate y Salkantay con certificación internacional WFR.',
      activo: true,
      orden: 1,
    },
    {
      nombre: 'Cynthia Morales',
      rol: 'Guía Cultural & Trekking',
      experiencia: '8 Años',
      idiomas: 'Español, Inglés, Francés',
      foto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
      descripcion: 'Experta en historia incaica, flora andina y rutas arqueológicas en el Camino Inca, Salkantay y Valle Sagrado.',
      activo: true,
      orden: 2,
    },
    {
      nombre: 'Teobaldo Quispe',
      rol: 'Chef Ejecutivo de Montaña',
      experiencia: '10 Años',
      idiomas: 'Español, Quechua',
      foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
      descripcion: 'Diseñador de menús gourmet energéticos adaptados a la altura con ingredientes orgánicos de los valles del Cusco.',
      activo: true,
      orden: 3,
    },
    {
      nombre: 'Mateo Valenzuela',
      rol: 'Especialista en Seguridad & Rescate',
      experiencia: '9 Años',
      idiomas: 'Español, Inglés, Alemán',
      foto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
      descripcion: 'Encargado de los protocolos de aclimatación, oxigenoterapia preventiva y logística de seguridad médica en todas las rutas.',
      activo: true,
      orden: 4,
    },
    {
      nombre: 'Luciana Alarcón',
      rol: 'Guía de Naturaleza & Ecoturismo',
      experiencia: '7 Años',
      idiomas: 'Español, Inglés, Portugués',
      foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
      descripcion: 'Apasionada por la ornitología andina, astrofotografía nocturna en campamentos y conservación ambiental.',
      activo: true,
      orden: 5,
    },
    {
      nombre: 'Yuri Huamán',
      rol: 'Líder de Logística de Campamento',
      experiencia: '15 Años',
      idiomas: 'Español, Quechua',
      foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=800&q=80',
      descripcion: 'Maestro en la organización de campamentos 4 estaciones, gestión de arrieros y montaje técnico en pasos sobre 4,800 msnm.',
      activo: true,
      orden: 6,
    },
  ];

  await prisma.guia.deleteMany({});
  for (const g of guiasData) {
    await prisma.guia.create({ data: g });
  }

  const all = await prisma.guia.findMany();
  console.log('✅ Guías insertados exitosamente:', all.length);
  for (const item of all) {
    console.log(`- ${item.nombre} (${item.rol})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
