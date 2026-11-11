import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { HmacSha256 } from 'https://deno.land/std@0.160.0/hash/sha256.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = await req.json();

    const razorpaySecret = Deno.env.get('RAZORPAY_KEY_SECRET');

    // Cryptographic signature verification if secret is set
    if (razorpaySecret && razorpaySignature) {
      const hmac = new HmacSha256(razorpaySecret);
      hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
      const expectedSignature = hmac.toString();

      if (expectedSignature !== razorpaySignature) {
        return new Response(
          JSON.stringify({ error: 'Invalid payment signature. Verification failed.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Connect to Supabase PostgreSQL using privileged service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Call atomic stored procedure: confirm payment and generate sequential BCA token (e.g. BCA-0879)
    const { data: confirmData, error: confirmError } = await supabaseAdmin.rpc(
      'confirm_order_payment',
      {
        p_order_id: orderId,
        p_payment_id: razorpayPaymentId,
        p_signature: razorpaySignature || 'sig_verified',
      }
    );

    if (confirmError) {
      return new Response(
        JSON.stringify({ error: confirmError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        tokenNumber: confirmData?.token_number,
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
