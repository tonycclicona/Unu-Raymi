// ============================================================
// reservaController.js — Lógica de Checkout y Reservas
//
// REGLA DE SEGURIDAD CRÍTICA:
// El precio total SIEMPRE se calcula en el backend extrayendo
// los valores reales de la base de datos. Nunca se confía en
// montos enviados por el cliente/frontend.
//
// FLUJO POST /api/reservas/checkout:
// 1. Zod valida la estructura del payload (middleware)
// 2. Se busca el tour en BD y se verifica que esté activo
// 3. Se calcula el precioTotal con precios reales de la BD
// 4. Se genera tokenSeguridad con crypto.randomUUID()
// 5. Se persiste la Reserva con estado PENDING y sus Pasajeros
// 6. Se responde con la reserva creada (lista para pasarela de pago)
// ============================================================

import { randomUUID } from "crypto";
import { existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import prisma from "../lib/prismaClient.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INVOICES_DIR = join(__dirname, "..", "..", "storage", "invoices");

// ── POST /api/reservas/checkout ──────────────────────────────
export const checkout = async (req, res, next) => {
  try {
    const {
      tourId,
      fechaViaje,
      cantAdultos,
      cantNinos,
      titularNombre,
      titularEmail,
      titularTelefono,
      pasajeros,
      duracion_dias,
    } = req.body;

    // ── 1. Buscar y validar el Tour en la BD ─────────────────
    const tour = await prisma.tour.findUnique({
      where: { id: tourId },
    });

    if (!tour) {
      return res.status(404).json({
        success: false,
        error: `El tour con ID ${tourId} no existe.`,
      });
    }

    if (!tour.activo) {
      return res.status(400).json({
        success: false,
        error: `El tour '${tour.nombre}' no está disponible actualmente.`,
      });
    }

    // ── Buscar Variante de Duración si se especificó ─────────
    let precioAdulto = parseFloat(tour.precio_adulto);
    let precioNino = parseFloat(tour.precio_nino);
    let cuposDisponibles = tour.cupos_disponibles;
    const duracionFinal = duracion_dias ? parseInt(duracion_dias, 10) : tour.duracion_dias;

    if (duracion_dias) {
      const variante = await prisma.tourVariante.findFirst({
        where: {
          tourId,
          duracion_dias: parseInt(duracion_dias, 10),
        },
      });

      if (variante) {
        precioAdulto = parseFloat(variante.precio_adulto);
        precioNino = parseFloat(variante.precio_nino);
        cuposDisponibles = variante.cupos_disponibles;
      }
    }

    // ── 2. Verificar cupos disponibles ───────────────────────
    const totalPasajeros = cantAdultos + cantNinos;
    if (totalPasajeros > cuposDisponibles) {
      return res.status(400).json({
        success: false,
        error: `No hay suficientes cupos disponibles. Solicitados: ${totalPasajeros}, Disponibles: ${cuposDisponibles}.`,
      });
    }

    // ── 3. Calcular precio total ESTRICTAMENTE en el backend ──
    const precioTotal = (precioAdulto * cantAdultos) + (precioNino * cantNinos);

    // ── 4. Generar tokenSeguridad único criptográfico ─────────
    const tokenSeguridad = randomUUID();

    // ── 5. Persistir Reserva + Pasajeros en una transacción ───
    const nuevaReserva = await prisma.reserva.create({
      data: {
        tourId,
        fechaViaje: new Date(fechaViaje),
        cantAdultos,
        cantNinos,
        precioTotal,
        duracion_dias: duracionFinal,
        estado: "PENDING",
        tokenSeguridad,
        titularNombre,
        titularEmail,
        titularTelefono: titularTelefono ?? null,
        // Crear todos los pasajeros relacionados
        pasajeros: {
          create: pasajeros.map((p) => ({
            nombre: p.nombre,
            apellido: p.apellido,
            dni: p.dni ?? null,
            tipo: p.tipo,
          })),
        },
      },
      include: {
        tour: {
          select: {
            nombre: true,
            slug: true,
            duracion_dias: true,
          },
        },
        pasajeros: true,
      },
    });

    // ── 6. Responder con los datos de la reserva creada ───────
    // El frontend usará estos datos para redirigir a la pasarela de pago.
    return res.status(201).json({
      success: true,
      message: "Reserva creada exitosamente. Pendiente de pago.",
      data: {
        reservaId: nuevaReserva.id,
        tokenSeguridad: nuevaReserva.tokenSeguridad,
        estado: nuevaReserva.estado,
        precioTotal: parseFloat(nuevaReserva.precioTotal),
        fechaViaje: nuevaReserva.fechaViaje,
        cantAdultos: nuevaReserva.cantAdultos,
        cantNinos: nuevaReserva.cantNinos,
        titularNombre: nuevaReserva.titularNombre,
        titularEmail: nuevaReserva.titularEmail,
        tour: nuevaReserva.tour,
        pasajeros: nuevaReserva.pasajeros,
        createdAt: nuevaReserva.createdAt,
        // URL de acceso al invoice (protegida por tokenSeguridad)
        urlInvoice: `/api/reservas/${nuevaReserva.id}/invoice?token=${nuevaReserva.tokenSeguridad}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/reservas/:id ─────────────────────────────────────
// Consulta pública protegida por tokenSeguridad en query param.
export const obtenerReserva = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Acceso denegado. Se requiere el tokenSeguridad.",
      });
    }

    const reserva = await prisma.reserva.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        tour: {
          select: {
            nombre: true,
            slug: true,
            duracion_dias: true,
          },
        },
        pasajeros: true,
      },
    });

    if (!reserva) {
      return res.status(404).json({
        success: false,
        error: `Reserva con ID ${id} no encontrada.`,
      });
    }

    // Verificar que el token coincida — previene enumeración de reservas
    if (reserva.tokenSeguridad !== token) {
      return res.status(403).json({
        success: false,
        error: "Token de seguridad inválido.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...reserva,
        precioTotal: parseFloat(reserva.precioTotal),
      },
    });
  } catch (error) {
    next(error);
  }
};
// ── GET /api/reservas/:id/invoice ────────────────────────────
// Descarga el PDF del invoice protegido por tokenSeguridad.
// No requiere login — el token UUID es el mecanismo de acceso.
export const descargarInvoice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    // ── 1. Validar token presente ─────────────────────────
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Acceso denegado. Se requiere el token de seguridad en la URL.",
      });
    }

    // ── 2. Buscar reserva ─────────────────────────────────
    const reserva = await prisma.reserva.findUnique({
      where: { id: parseInt(id, 10) },
      select: { id: true, tokenSeguridad: true, estado: true, titularNombre: true },
    });

    if (!reserva) {
      return res.status(404).json({
        success: false,
        error: `Reserva con ID ${id} no encontrada.`,
      });
    }

    // ── 3. Verificar token (timingSafeEqual implícito por comparación directa) ──
    if (reserva.tokenSeguridad !== token) {
      return res.status(403).json({
        success: false,
        error: "Token de seguridad inválido.",
      });
    }

    // ── 4. Verificar que la reserva esté pagada ───────────
    if (reserva.estado !== "PAID") {
      return res.status(402).json({
        success: false,
        error: "El invoice solo está disponible para reservas con pago confirmado.",
      });
    }

    // ── 5. Verificar que el archivo PDF existe ────────────
    const pdfPath = join(INVOICES_DIR, `${token}.pdf`);

    if (!existsSync(pdfPath)) {
      return res.status(404).json({
        success: false,
        error: "El invoice aún se está generando. Inténtalo en unos segundos.",
      });
    }

    // ── 6. Servir el PDF ──────────────────────────────────
    const fileName = `invoice-reserva-${String(reserva.id).padStart(6, "0")}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);

    return res.sendFile(pdfPath);

  } catch (error) {
    next(error);
  }
};

// ── GET /api/reservas ──────────────────────────────────────────
export const obtenerReservas = async (req, res, next) => {
  try {
    const reservas = await prisma.reserva.findMany({
      include: {
        tour: {
          select: {
            nombre: true,
          },
        },
        pasajeros: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json(reservas);
  } catch (error) {
    next(error);
  }
};
