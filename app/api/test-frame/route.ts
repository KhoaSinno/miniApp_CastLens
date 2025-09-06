export const runtime = "edge";

// Test endpoint to simulate Frame payload
export async function POST() {
  const testPayload = {
    untrustedData: {
      fid: 12345,
      castId: {
        fid: 12345,
        hash: "0x1234567890abcdef",
      },
      inputText: "What is DeFi?",
      buttonIndex: 2, // Explain button
    },
  };

  try {
    // Forward to actual frame assist endpoint
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_URL}/api/frame/assist`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testPayload),
      },
    );

    const result = await response.text();

    return new Response(
      `
      <html>
        <head><title>Frame Test</title></head>
        <body>
          <h1>Frame Test Result</h1>
          <pre style="background: #f0f0f0; padding: 20px; border-radius: 8px; overflow: auto;">
${result}
          </pre>
          <p><a href="/frame">Back to Frame</a></p>
        </body>
      </html>
    `,
      {
        headers: { "Content-Type": "text/html" },
      },
    );
  } catch (error) {
    return Response.json({
      error: "Test failed",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
