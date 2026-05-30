import { serve } from
"https://deno.land/std/http/server.ts";

serve(async (req) => {
  const { email } =
    await req.json();

  console.log(
    `Welcome email sent to ${email}`
  );

  return new Response(
    JSON.stringify({
      success: true,
    }),
    {
      headers: {
        "Content-Type":
          "application/json",
      },
    }
  );
});