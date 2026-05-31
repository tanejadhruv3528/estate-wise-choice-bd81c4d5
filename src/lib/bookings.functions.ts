import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ============ trackEvent ============

const eventInput = z.object({
  session_id: z.string().min(1).max(64),
  event_type: z.string().min(1).max(64),
  property_id: z.string().uuid().nullable().optional(),
  metadata: z.record(z.string(), z.any()).optional().default({}),
});

export const trackEvent = createServerFn({ method: "POST" })
  .inputValidator((input) => eventInput.parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("events").insert({
      session_id: data.session_id,
      event_type: data.event_type,
      property_id: data.property_id ?? null,
      metadata: data.metadata,
    });
    if (error) console.error("trackEvent:", error.message);
    return { ok: true };
  });

// ============ recordBookingIntent (WhatsApp click) ============

const intentInput = z.object({
  property_id: z.string().uuid(),
  session_id: z.string().min(1).max(64),
  budget_min: z.number().nonnegative(),
  budget_max: z.number().positive(),
  locality: z.string().max(120).optional(),
});

export const recordBookingIntent = createServerFn({ method: "POST" })
  .inputValidator((input) => intentInput.parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin.from("bookings").insert({
      property_id: data.property_id,
      session_id: data.session_id,
      status: "intent",
      metadata: {
        budget_min: data.budget_min,
        budget_max: data.budget_max,
        locality: data.locality ?? null,
      },
    });
    if (error) console.error("recordBookingIntent:", error.message);
    return { ok: true };
  });

// ============ upsertUser (soft lead capture) ============

const upsertInput = z.object({
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(7).max(20).regex(/^[0-9+\-\s()]+$/),
  preferences: z.record(z.string(), z.any()).optional().default({}),
});

export const upsertLeadUser = createServerFn({ method: "POST" })
  .inputValidator((input) => upsertInput.parse(input))
  .handler(async ({ data }) => {
    const phone = data.phone.replace(/[^\d+]/g, "");
    const { data: row, error } = await supabaseAdmin
      .from("users")
      .upsert(
        { name: data.name, phone, preferences: data.preferences },
        { onConflict: "phone" },
      )
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { user_id: row.id };
  });

// ============ bookTour (fallback form) ============

const bookInput = z.object({
  name: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(7).max(20).regex(/^[0-9+\-\s()]+$/),
  property_id: z.string().uuid(),
  preferred_time: z.string().trim().min(1).max(120),
  session_id: z.string().min(1).max(64),
});

export const bookTour = createServerFn({ method: "POST" })
  .inputValidator((input) => bookInput.parse(input))
  .handler(async ({ data }) => {
    const phone = data.phone.replace(/[^\d+]/g, "");
    const { data: user, error: userErr } = await supabaseAdmin
      .from("users")
      .upsert({ name: data.name, phone }, { onConflict: "phone" })
      .select("id")
      .single();
    if (userErr) throw new Error(userErr.message);

    const { error: bookErr } = await supabaseAdmin.from("bookings").insert({
      user_id: user.id,
      property_id: data.property_id,
      preferred_time: data.preferred_time,
      session_id: data.session_id,
      status: "requested",
    });
    if (bookErr) throw new Error(bookErr.message);
    return { ok: true };
  });
