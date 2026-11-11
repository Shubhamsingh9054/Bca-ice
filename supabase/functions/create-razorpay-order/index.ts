import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { orderId, items, subtotal, totalAmount, customerMobile } = await req.json();

    // 1. Enforce Minimum Order Value: ₹50
    if (subtotal < 50) {
      return new Response(
        JSON.stringify({ error: 'Minimum order amount is ₹50.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Validate Asia/Kolkata Ordering Schedule (12:00 PM - 6:00 PM)
    const kolkataTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    const kDate = new Date(kolkataTime);
    const kHours = kDate.getHours();
    if (kHours < 12 || kHours >= 18) {
      return new Response(
        JSON.stringify({ error: "Today's ordering window is closed (Open 12 PM - 6 PM IST)." }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Supabase Database Service Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 4. Reserve stock atomically in Postgres
    const { data: reserveResult, error: reserveError } = await supabaseAdmin.rpc(
      'reserve_inventory_for_order',
      {
        p_order_id: orderId,
        p_items: items,
        p_timeout_minutes: 10,
      }
    );

    if (reserveError) {
      return new Response(
        JSON.stringify({ error: reserveError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Create Order with Razorpay API
    const razorpayKey = Deno.env.get('RAZORPAY_KEY_ID') || 'rzp_test_BcaIceCreamWalaKey';
    const razorpaySecret = Deno.env.get('RAZORPAY_KEY_SECRET') || '';

    let razorpayOrderId = `order_${Date.now()}`;

    if (razorpaySecret && !razorpayKey.includes('test_BcaIceCreamWalaKey')) {
      const basicAuth = btoa(`${razorpayKey}:${razorpaySecret}`);
      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(totalAmount * 100), // in paise
          currency: 'INR',
          receipt: orderId,
          notes: {
            shop: 'BCA Ice Cream Wala',
            customerMobile,
          },
        }),
      });

      const rzpData = await rzpRes.json();
      if (rzpData.id) {
        razorpayOrderId = rzpData.id;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        razorpayOrderId,
        amount: totalAmount,
        currency: 'INR',
        expiresAt: reserveResult?.expires_at,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
