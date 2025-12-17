import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfBase64 } = await req.json();

    if (!pdfBase64) {
      return new Response(
        JSON.stringify({ error: 'PDF content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Ti si asistent za parsiranje hrvatskih računa/faktura iz PDF dokumenata. 
Tvoj zadatak je izdvojiti sljedeće podatke iz računa:
1. PKV broj (ili broj računa)
2. Naziv Dobavljača
3. Stavke s računa: naziv robe/usluge, količina, cijena s PDV-om

VAŽNO za količinu:
- Ako je količina napisana kao "28,000" to znači 28 komada (ne 28000)
- Ako je količina napisana kao "1,000" to znači 1 komad
- Hrvatski format koristi zarez za decimale, a točku za tisuće

VAŽNO za cijenu:
- Uzmi "Cijena s PDV-om" ili "Jedinična cijena s PDV" 
- Ne množiti s količinom, uzmi samo jediničnu cijenu

Vrati JSON u sljedećem formatu:
{
  "pkv_broj": "string",
  "dobavljac": "string",
  "items": [
    {
      "naziv": "string",
      "kolicina": number,
      "cijena": number
    }
  ]
}

Ako ne možeš pronaći neki podatak, ostavi prazno ili 0.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Parsiraj ovaj račun i izvuci podatke:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${pdfBase64}`
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Extract JSON from the response
    let parsedData;
    try {
      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Parse error:', parseError, 'Content:', content);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse AI response',
          rawContent: content 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(parsedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
