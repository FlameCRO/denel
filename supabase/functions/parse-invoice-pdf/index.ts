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
            content: `Ti si asistent za parsiranje hrvatskih primki/računa/faktura iz PDF dokumenata. 

TVOJ ZADATAK:
Izvuci ove podatke iz dokumenta:

1. PKV BROJ ili BROJ RAČUNA
   - Traži: "Primka PKV [broj]" ili "PKV [broj]" ili "Račun br." ili slično
   - Primjer: "Primka PKV 8" → vrati "PKV 8"
   
2. NAZIV DOBAVLJAČA (SUPPLIER)
   - PAŽNJA: Dobavljač je tvrtka koja ŠALJE/PRODAJE robu, NE primatelj!
   - U dokumentu traži tablicu ili sekciju s naslovom "Dobavljač"
   - Dobavljač je u toj tablici, NE na vrhu dokumenta
   - Na vrhu dokumenta je PRIMATELJ (npr. "Trgovački obrt DENEL") - TO NIJE DOBAVLJAČ!
   - Primjer: ako tablica "Dobavljač" sadrži "LAMMACOST D.O.O." → vrati "LAMMACOST D.O.O."
   
3. STAVKE S RAČUNA
   - naziv robe/usluge
   - količina (komadi)
   - jedinična cijena s PDV-om

PRAVILA ZA KOLIČINU:
- "28,000" = 28 komada (NE 28000)
- "1,000" = 1 komad
- Hrvatski format: zarez za decimale, točka za tisuće

PRAVILA ZA CIJENU:
- Uzmi stupac "Cijena (s PDV-om)" ili "Cijena s PDV" ili zadnji stupac cijene
- Samo jedinična cijena, NE ukupni iznos

VRATI JSON:
{
  "pkv_broj": "npr. PKV 8",
  "dobavljac": "npr. LAMMACOST D.O.O. (iz tablice Dobavljač, NE s vrha dokumenta)",
  "items": [{"naziv": "string", "kolicina": number, "cijena": number}]
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Parsiraj ovaj račun. VAŽNO: Dobavljač je u tablici "Dobavljač", NE na vrhu dokumenta!'
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

    // Helper function to convert ALL CAPS to Title Case
    const toTitleCase = (str: string): string => {
      if (!str) return str;
      // Check if string is mostly uppercase (more than 80% uppercase letters)
      const letters = str.replace(/[^a-zA-ZčćžšđČĆŽŠĐ]/g, '');
      const uppercaseCount = (str.match(/[A-ZČĆŽŠĐ]/g) || []).length;
      if (letters.length > 0 && uppercaseCount / letters.length > 0.8) {
        // Convert to title case: first letter uppercase, rest lowercase
        return str.toLowerCase().replace(/^[a-zčćžšđ]/, (char) => char.toUpperCase());
      }
      return str;
    };

    // Extract JSON from the response
    let parsedData;
    try {
      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
        
        console.log('Parsed data:', JSON.stringify(parsedData, null, 2));
        console.log('PKV broj:', parsedData.pkv_broj);
        console.log('Dobavljač:', parsedData.dobavljac);
        
        // Transform item names from ALL CAPS to Title Case
        if (parsedData.items && Array.isArray(parsedData.items)) {
          parsedData.items = parsedData.items.map((item: any) => ({
            ...item,
            naziv: toTitleCase(item.naziv)
          }));
        }
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
