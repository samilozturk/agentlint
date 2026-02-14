const stageEvents = [
  "Sanitizing input",
  "Running static checks",
  "Evaluating semantic safety",
  "Calling judge provider",
  "Finalizing output",
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (let index = 0; index < stageEvents.length; index++) {
        const payload = JSON.stringify({
          index,
          stage: stageEvents[index],
          total: stageEvents.length,
        });

        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        await sleep(320);
      }

      controller.enqueue(encoder.encode("event: done\ndata: done\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
